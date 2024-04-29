const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
const {getCurrentDateForFilename, appendToFile, clearFile} = require('./util/file_util');
require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs');
const axios = require('axios');
require('dotenv').config()

// Defines the concurrent urls count to be scanned

const deadSites = [];
const sitesTobeCheckedManually = [];
const marketPlaceSitesToBeConfigured = [];

let client_arg = process.argv[2];
let concurrentLimit = process.argv[3];
if (concurrentLimit == null) {
    concurrentLimit = 5;
    console.log(`Setting url batch size scan count as ${concurrentLimit}`);
}

// NEED TO CALL API TO GET THE INFRINGEMENT LINK
const outputDir = 'src/output/' + client_arg;
client = client_arg.replace(/_/g, ' '); // Replacing underscores with whitespace
client = encodeURIComponent(client); // Encoding the client name to ensure URL safety

const headers = {
    'x-api-key': process.env.SCANNER_API_SECRET,
    'Content-Type': 'application/json'
};


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

async function classifyURL(urlObj, evaluatedCount) {
    console.log(`${evaluatedCount}. Evaluating ${urlObj.link}`)
    let marketPlace = getMarketplaceInfo(urlObj.link);
    let isURLRemoved;
    try {
        isURLRemoved = await marketPlace.evaluate(urlObj.link);
    } catch (error) {
        console.log(`An error occurred for ${urlObj.link} during scanning for XPath: ${error}`);
        isURLRemoved = false;
    }
    if (isURLRemoved) {
        console.log(`URL is dead - ${urlObj.link}`);
        deadSites.push({url: urlObj.link, id: urlObj.id});
    } else if (marketPlace.marketplaceQuery === 'default') {
        console.log(`URL marketplace to be configured - ${urlObj.link}`);
        marketPlaceSitesToBeConfigured.push({url: urlObj.link, id: urlObj.id});
    } else {
        console.log(`URL to be checked manually - ${urlObj.link}`);
        sitesTobeCheckedManually.push({url: urlObj.link, id: urlObj.id});
    }
}

// Function to convert objects to a string representation
function stringifyObjects(objects) {
    return objects.map(obj => `${obj.url}`).join('\n');
}


async function classifyURLs(urls, concurrentLimit, infringementStatus) {
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

        const promise = classifyURL(url, evaluatedCount);
        promiseList.push(promise);
        evaluatedCount++;

        // Write data to files every 20 links evaluated
        if (evaluatedCount % 20 === 0 || evaluatedCount == urlsLength + 1) {
            await Promise.all(promiseList);
            console.log("Writing the links to respective files...")
            // Write dead sites to a file
            appendToFile(`${outputDir}/deadSites_${getCurrentDateForFilename()}.txt`, stringifyObjects(deadSites));

            // Write sites to be checked manually to a file
            appendToFile(`${outputDir}/sitesTobeCheckedManually_${getCurrentDateForFilename()}.txt`,
                stringifyObjects(sitesTobeCheckedManually));

            // Write marketplaces to be configured to a file
            appendToFile(`${outputDir}/marketPlaceSitesToBeConfigured_${getCurrentDateForFilename()}.txt`,
                stringifyObjects(marketPlaceSitesToBeConfigured));

            //need to call api to update the statuses of Removed Links
            if (infringementStatus == 'Removed') {
                await updateInfringementStatus(deadSites, infringementStatus);
            }
            else {
                // Merge sitesTobeCheckedManually and marketPlaceSitesToBeConfigured arrays
                const sitesToBeUpdated = [...sitesTobeCheckedManually, ...marketPlaceSitesToBeConfigured];
                await updateInfringementStatus(sitesToBeUpdated, infringementStatus);
            }

            // Clear the arrays after writing
            deadSites.length = 0;
            sitesTobeCheckedManually.length = 0;
            marketPlaceSitesToBeConfigured.length = 0;
            promiseList.length = 0;
        }
    }
}

(async () => {
    const start = Date.now();
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


    let clientInfringementURLS = await fetchClientData(client);
    console.log(`Total url count: - ${clientInfringementURLS.length}`);

    // need to seperate removed and submit for removal links
    const { removedStatusURLs, submittedStatusURLs } = clientInfringementURLS.reduce((acc, item) => {
        if (item.infringementStatus === "Removed") {
            acc.removedStatusURLs.push(item);
        } else if (item.infringementStatus === "Submitted for removal") {
            acc.submittedStatusURLs.push(item);
        }
        return acc;
    }, { removedStatusURLs: [], submittedStatusURLs: [] });

    // Evaluate the links For Removed Ones
    classifyURLs(submittedStatusURLs, concurrentLimit, 'Removed').then(() => {
        console.log('Checked SubmitForRemoval Links that they are Removed or Not');
        const end = Date.now();
        const executionTime = (end - start) / 1000;
        console.log(`Execution time: ${executionTime} seconds`);
    });

    // this is for checking if Removed Statuses are live again
    classifyURLs(removedStatusURLs, concurrentLimit, 'Approved').then(() => {
        console.log('Checked Removed Links that they are Removed or Live again');
        const end = Date.now();
        const executionTime = (end - start) / 1000;
        console.log(`Execution time: ${executionTime} seconds`);
    });
})();


async function fetchClientData(clientName) {
    try {
        const response = await axios.get(`${process.env.BASE_URL}bmsScannerHandler?infringementStatus=${encodeURIComponent('Submitted for removal')}&infringementStatus2=${encodeURIComponent('Removed')}&clientName=${encodeURIComponent(clientName)}`,
            {headers}
        );
        if (!response.data) {
            console.log('Unable to perform actions. Exit....');
            return;
        }
        return response.data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function batchInfringementStatus(infringementObjects, infringmentStatus) {
    // map with status
    try {
        const requestData = {
            infringementUpdates: infringementObjects.map(obj => ({id: obj.id, newStatus: infringmentStatus}))
        };
        const response = await axios.post(`${process.env.BASE_URL}bmsScannerHandler`, requestData,
            {headers}
        );
        console.log('Response After updating the data', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function updateInfringementStatus(infringementObjects, infringementStatus) {
    await batchInfringementStatus(infringementObjects, infringementStatus);
}
