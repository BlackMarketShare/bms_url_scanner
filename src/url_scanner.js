const {readFileSync} = require('fs');
const {MarketplaceEvaluator} = require('./MarketplaceEvaluator');
require('events').EventEmitter.defaultMaxListeners = 0;

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

function printUrlList(urlList) {
    urlList.forEach(url => console.log(url));
    console.log();
}

async function classifyURL(url) {
    console.log(`Evaluating ${url}`)
    let marketPlace = getMarketplaceInfo(url);
    let isURLRemoved = await marketPlace.evaluate(url);
    if (isURLRemoved) {
        console.log(`URL is dead - ${url}`);
        deadSites.push(url);
    }
    else if (marketPlace.marketplaceQuery === 'default') {
        console.log(`URL marketplace to be configured - ${url}`);
        marketPlaceSitesToBeConfigured.push(url);
    }
    else {
        console.log(`URL to be checked manually - ${url}`);
        sitesTobeCheckedManually.push(url);
    }
}

async function classifyURLs(filePath, concurrentLimit) {
    const file = readFileSync(filePath, 'utf8');
    const urls = file.split(/\r?\n/);
    const promiseList = [];
    for (const url of urls) {

        if (promiseList.length == concurrentLimit) {
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
const filePath = process.argv[2];
const concurrentLimit = process.argv[3];
classifyURLs(filePath, concurrentLimit)


