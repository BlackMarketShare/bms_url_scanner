const {readFileSync} = require('fs');
const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
require('events').EventEmitter.defaultMaxListeners = 0;

// Defines the concurrent urls count to be scanned
const concurrentLimit = 1;

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

function printUrlList(urlList) {
    urlList.forEach(url => console.log(url));
    console.log();
}

async function classifyURL(url) {
    let marketPlace = getMarketplaceInfo(url);
    let isURLRemoved = await marketPlace.evaluate(url);
    if (isURLRemoved) {
        deadSites.push(url);
    }
    else if (marketPlace.marketplaceQuery == 'default') {
        marketPlaceSitesToBeConfigured.push(url);
    }
    else {
        console.log("SitesTobeCheckedManually")
        sitesTobeCheckedManually.push(url);
    }
}

async function classifyURLs(filePath) {
    const file = readFileSync(filePath, 'utf8');
    const urls = file.split(/\r?\n/);
    const promiseList = [];
    for (const url of urls) {
        if (promiseList.length === concurrentLimit) {
            await Promise.all(promiseList);
            promiseList.length = 0;
        }
        promiseList.push(classifyURL(url));
    }
    await Promise.all(promiseList);
    console.log('Dead Sites :');
    printUrlList(deadSites);
    console.log('To be checked Manually :');
    printUrlList(sitesTobeCheckedManually);
    console.log('Marketplaces to be configured :');
    printUrlList(marketPlaceSitesToBeConfigured);
}

// fetching file from command line
filePath = process.argv[2];
classifyURLs(filePath)


