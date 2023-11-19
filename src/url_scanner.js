const {readFileSync} = require('fs');
const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
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
    let isURLRemoved = await marketPlace.evaluate(url);
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

async function classifyURLs(filePath, concurrentLimit) {
    const file = readFileSync(filePath, 'utf8');
    const urls = file.split(/\r?\n/);
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
            fs.appendFileSync('src/output/deadSites.txt',
                deadSites.join('\n'));
            if (deadSites.length != 0) {
                fs.appendFileSync('src/output/deadSites.txt', '\n');
            }

            // Write sites to be checked manually to a file
            fs.appendFileSync('src/output/sitesTobeCheckedManually.txt',
                sitesTobeCheckedManually.join('\n'));
            if (sitesTobeCheckedManually.length != 0) {
                fs.appendFileSync('src/output/sitesTobeCheckedManually.txt', '\n');
            }

            // Write marketplaces to be configured to a file
            fs.appendFileSync('src/output/marketPlaceSitesToBeConfigured.txt',
                marketPlaceSitesToBeConfigured.join('\n'));
            if (marketPlaceSitesToBeConfigured.length != 0) {
                fs.appendFileSync('src/output/marketPlaceSitesToBeConfigured.txt', '\n');
            }

            // Clear the arrays after writing
            deadSites.length = 0;
            sitesTobeCheckedManually.length = 0;
            marketPlaceSitesToBeConfigured.length = 0;
            promiseList.length = 0;
        }
    }
}

// fetching file from command line
const filePath = process.argv[2];
let concurrentLimit = process.argv[3];
if (concurrentLimit == null) {
    concurrentLimit = 5;
    console.log(`Setting url batch size scan count as ${concurrentLimit}`);
}
classifyURLs(filePath, concurrentLimit)


