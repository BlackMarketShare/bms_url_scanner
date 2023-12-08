const {readFileSync} = require('fs');
const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
const {getCurrentDateForFilename, appendToFile} = require('./util/file_util');
const fetchDataFromClientSheet = require('./util/google_sheets_accessor');
require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs');

// Defines the concurrent urls count to be scanned

const deadSites = [];
const sitesTobeCheckedManually = [];
const marketPlaceSitesToBeConfigured = [];


// Create a function to get the marketplace information based on the URL
function getMarketplaceInfo(url) {
    const marketplaceKeys = Object.keys(MarketplaceEvaluator);
    for (const key of marketplaceKeys) {
        const marketplace = MarketplaceEvaluator[key];
        if (url.includes(marketplace.marketplaceQuery)) {
            return marketplace;
        }
    }
    return MarketplaceEvaluator['DEFAULT'];
}

async function classifyURL(url, evaluatedCount) {
    console.log(`${evaluatedCount}. Evaluating ${url}`)
    let marketPlace = getMarketplaceInfo(url);
    let isURLRemoved;
    try {
        isURLRemoved = await marketPlace.evaluate(url);
    } catch (error) {
        console.log(`An error occurred for ${url} during scanning for XPath: ${error}`);
        isURLRemoved = false;
    }
    if (isURLRemoved) {
        console.log(`URL is dead - ${url}`);
        deadSites.push(url);
    } else if (marketPlace.marketplaceQuery === 'default') {
        console.log(`URL marketplace to be configured - ${url}`);
        marketPlaceSitesToBeConfigured.push(url);
    } else {
        console.log(`URL to be checked manually - ${url}`);
        sitesTobeCheckedManually.push(url);
    }
}

async function classifyURLsfromFilePath(filePath, concurrentLimit) {
    const file = readFileSync(filePath, 'utf8');
    const urls = file.split(/\r?\n/);
    await classifyURLs(urls, concurrentLimit);
}

async function classifyURLs(urls, concurrentLimit) {
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

            // Clear the arrays after writing
            deadSites.length = 0;
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
    concurrentLimit = 5;
    console.log(`Setting url batch size scan count as ${concurrentLimit}`);
}

const outputDir = 'src/output/' + client;
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

fetchDataFromClientSheet(client).then(urls => {
    classifyURLs(urls, concurrentLimit).then(() => {
        const end = Date.now();
        const executionTime = (end - start) / 1000;
        console.log(`Execution time: ${executionTime} seconds`);
    });
})
// console.log(urls);

// classifyURLs(await fetchDataFromClientSheet(),concurrentLimit).then(() => {
//     const end = Date.now();
//     const executionTime = (end - start) / 1000;
//     console.log(`Execution time: ${executionTime} seconds`);
// });
// classifyURLsfromFilePath(filePath, concurrentLimit).then(() => {
//     const end = Date.now();
//     const executionTime = (end - start) / 1000;
//     console.log(`Execution time: ${executionTime} seconds`);
// });



