const {readFileSync} = require('fs');
const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
const {getCurrentDateForFilename, appendToFile, clearFile} = require('./util/file_util');
require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs');
const fetchDataFromDB = require('./util/db_operations');
const { prisma } = require('../prisma/prisma');

// Defines the concurrent urls count to be scanned

const deadSites = [];
const deadSitesWithId = [];
const sitesTobeCheckedManually = [];
const marketPlaceSitesToBeConfigured = [];


// Create a function to get the marketplace information based on the URL
function getMarketplaceInfo(url) {
    const marketplaceKeys = Object.keys(MarketplaceEvaluator);
    let longestMatch = null;
    let longestMatchLength = 0;

    for (const key of marketplaceKeys) {
        const marketplace = MarketplaceEvaluator[key];
        if (url.includes(marketplace.marketplaceQuery)) {
            if (marketplace.marketplaceQuery.length > longestMatchLength) {
                longestMatch = marketplace;
                longestMatchLength = marketplace.marketplaceQuery.length;
            }
        }
    }

    return longestMatch ? longestMatch : MarketplaceEvaluator['DEFAULT'];
}

async function classifyURL(url, evaluatedCount) {
    console.log(`${evaluatedCount}. Evaluating ${url.link}`)
    let marketPlace = getMarketplaceInfo(url.link);
    let isURLRemoved;
    try {
        isURLRemoved = await marketPlace.evaluate(url.link);
    } catch (error) {
        console.log(`An error occurred for ${url} during scanning for XPath: ${error}`);
        isURLRemoved = false;
    }
    if (isURLRemoved) {
        console.log(`URL is dead - ${url.link}`);
        deadSites.push(url.link);
        deadSitesWithId.push(url)
    } else if (marketPlace.marketplaceQuery === 'default') {
        console.log(`URL marketplace to be configured - ${url.link}`);
        marketPlaceSitesToBeConfigured.push(url.link);
    } else {
        console.log(`URL to be checked manually - ${url.link}`);
        sitesTobeCheckedManually.push(url.link);
    }
}

async function classifyURLsfromFilePath(filePath, concurrentLimit) {
    const file = readFileSync(filePath, 'utf8');
    const urls = file.split(/\r?\n/);
    await classifyURLs(urls, concurrentLimit);
}

async function classifyURLs(urls, concurrentLimit) {
    const dateSuffix = getCurrentDateForFilename();
    clearFile(`${outputDir}/deadSites_${dateSuffix}.txt`);
    clearFile(`${outputDir}/sitesTobeCheckedManually_${dateSuffix}.txt`);
    clearFile(`${outputDir}/marketPlaceSitesToBeConfigured_${dateSuffix}.txt`);
    const promiseList = [];
    let evaluatedCount = 1;
    let urlsLength = urls.length;

    for (const url of urls) {
        if (promiseList.length == concurrentLimit) {
            await Promise.all(promiseList);
            promiseList.length = 0;
        }

        promiseList.push(classifyURL(url, evaluatedCount));
        evaluatedCount++;

        // Write data to files every 20 links evaluated
        if (evaluatedCount % 20 === 0 || evaluatedCount == urlsLength + 1) {
            await Promise.all(promiseList);
            console.log("Writing the links to respective files...")
            // Write dead sites to a file
            appendToFile(`${outputDir}/deadSites_${getCurrentDateForFilename()}.txt`, deadSites.join('\n'));

            // Write sites to be checked manually to a file
            appendToFile(`${outputDir}/sitesTobeCheckedManually_${getCurrentDateForFilename()}.txt`,
                sitesTobeCheckedManually.join('\n'));

            // Write marketplaces to be configured to a file
            appendToFile(`${outputDir}/marketPlaceSitesToBeConfigured_${getCurrentDateForFilename()}.txt`,
                marketPlaceSitesToBeConfigured.join('\n'));

            if (deadSites.length > 0) {
                await updateInfringementStatus(deadSitesWithId);
            }

            // Clear the arrays after writing
            deadSites.length = 0;
            deadSitesWithId.length = 0;
            sitesTobeCheckedManually.length = 0;
            marketPlaceSitesToBeConfigured.length = 0;
            promiseList.length = 0;
        }
    }
}

const start = Date.now();
// fetching file from command line
const client = process.argv[2];
let concurrentLimit = process.argv[3];
if (concurrentLimit == null) {
    concurrentLimit = 10;
    console.log(`Setting url batch size scan count as ${concurrentLimit}`);
}

const outputDir = 'src/output/' + client?.trim();
console.log(client);
if (!fs.existsSync(outputDir)) {
    fs.mkdir(outputDir, {recursive: true}, (err) => {
        if (err) {
            console.error('Error creating directory:', err);
            throw err;
        } else {
            console.log('Directory created:', outputDir);
        }
    });
}

const filePath = 'src/input/' + client;


fetchDataFromDB(client).then(urls => {
    // Randomize the order of the URLs
    // shuffleArray(urls);

     // Filter out Alibaba and Amazon URLs
     const filteredUrls = urls.filter(url => {
        return !url.link?.toLowerCase().includes('alibaba') && !url.link?.toLowerCase().includes('amazon');
    });

    console.log(`Total filtered urls: - ${filteredUrls.length}`);

    classifyURLs(filteredUrls, concurrentLimit).then(() => {
        const end = Date.now();
        const executionTime = (end - start) / 1000;
        console.log(`Execution time: ${executionTime} seconds`);
    });
});



async function batchInfringementStatus(infringementObjects, infringementStatus) {
   
    try {
        // Log the incoming parameters
        console.log('Infringement Objects:', infringementObjects);
        console.log('Infringement Status:', infringementStatus);

        // Update the infringement status in the database
        const updatedEntries = await prisma.infringment.updateMany({
            where: {
                id: {
                    in: infringementObjects.map(obj => obj.id)
                }
            },
            data: {
                infringementStatus: 'Removed' 
            }
        });
        console.log('Updated Entries:', updatedEntries);

        // Prepare the history entries
        const dbEntries = infringementObjects.map(request => ({
            infringementId: request.id,
            submittedBy: '0',
            operationPerformed: 'Removed',
            removedAt: new Date()
        }));

        console.log('DB Entries to be created:', dbEntries);

        if (dbEntries.length > 0) {
            const historyResponse = await prisma.infringementHistory.createMany({
                data: dbEntries
            });
            console.log('History Entries Created:', historyResponse);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}


async function updateInfringementStatus(infringementObjects) {
    await batchInfringementStatus(infringementObjects, 'Removed');
}


