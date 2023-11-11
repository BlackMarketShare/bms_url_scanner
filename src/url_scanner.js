const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const {readFileSync} = require("fs");

xpathToMessageMap = {
    "ebay": [['//title', ['Error page', 'Error Page', 'foutpagina', 'Fehlerseite']]], // ebay
    "walmart": [['//*[@id="maincontent"]/div/span', ['This page could not be found.']]], // walmart
    "amazon": [['//title', ['Page Not Found']]], // amazon
    // "shopee": [['//*[@id="main"]/div/div[2]/div/div/div/div[2]/form/div/div[1]/div]',
    //     ['เข้าสู่ระบบ', 'Log In', '登入', 'Log In']]], // add Log In to the list
    "es.aliexpress": [['//title', ['Page Not Found - Aliexpress.com']]],
    "aliexpress": [['//title', ['404', 'Page Not Found', 'campaign']]],
    "alibaba": [['//title', ['This product is no longer available', 'Dit product is niet meer beschikbaar',
        'Bu ürün artık mevcut değildir','Este produto não está mais disponível']]],
    "lazada": [['//title', ['non-existent products']]],
    "joom.com": [['//title', ['Buy at low prices in the Joom online store']]],
    "daraz": [['//title', ['Product not found']]],
    "ubuy": [['//*[@id="product-view-full"]/section/div/div/div/div/p', ['Not found your desired product']],
        ['//title', ['Product not available']]],
    "you-buy": [['//title', ['Product not available']]],
    "tokopedia": [['//*[@id="zeus-root"]/div/div[2]/div/div[2]/p', ['Mungkin kamu salah jalan atau alamat']]],
    "articulo": [['//*[@id=":r0:-title"]/h2', ['Los usuarios también buscaron', 'Las búsquedas más deseadas']]],
    "fruugo": [['//title', ['no longer available', 'Lamentamos', 'Spiacenti', 'Désolé', 'Λυπούμαστε', 'Beklager',
        'Sorry', 'Tyvärr', 'Lo sentimos', 'Sajnos', 'Pahoittelemme',]]],
    "temu": [['//*[@id="main_scale"]/div[2]/div/div/div/div/div[1]/h1', ['Sign in / Register', 'This item was discontinued']]],
    "galleon": [['//title', ['Homepage']]],
    "dhgate": [['//title', ['error']]],
    "etsy": [['//*[@id="content"]/div[1]/div[1]/div/div/div/div/p', ['this item and shop']]],
    "guatemaladigital": [['//*[@id="__next"]/div/div[1]/div[3]/div/div/h1', ['Su búsqueda no generó']]],
    "catch": [['//title', ['Great daily deals at Australia\'s favourite superstore']]],
    "zola": [['//title', ['Not found']]],
    "planclient": [['//title', ['Planclient']]],
    "menards": [['//title', ['Missing Page']]],
    "cesdeals": [['//*[@id="shoplaza-section-1539137345643"]/div/div/div/span[2]', ['Sorry']]],
    "gipstk": [['//*[@id="top"]/div[2]/div/div/section/div/div/div/div/div/div/header/h2/span[1]', ['We are sorry']]],
    "familyfoodproducts": [['//title', ['Not Found']]],
    "americanas": [['//title', ['Estamos']]],
    "tiktok": [['//*[@id="root"]/div/div[1]/div/div[1]', ['Product not available']]],
    "meesho": [['//*[@id="__next"]/div[3]/div/span', ['This product is out of stock']]],
    "wish.com": [['//*[@id="react-app"]/div/div[6]/div[3]/div/div/div[2]', ['This product is no longer available on Wish']]],
    "made-in-china": [['/html/body/div[7]/div[2]/div[4]/div/div/div[1]/div[1]/h1', ['']]],
    "allegro": [['/html/body/div[2]/div[8]/div/div/div[1]/div/div/div/div/div/div/div/h6', ['Oferta została zakończona']]],
    "taobao": [['/html/body/center[1]/h1', ['404']]],
    "magaluempresas.com": [['//title', ['Produto não encontrado']]]
};

defaultXpathMap = [['//title', ['404', 'Not Found', 'Home page']]]

nonHeadlessMarketplaces = ['shopee', 'tokopedia', 'walmart', 'fruugo', 'dhgate', 'etsy', 'americanas', 'meesho',
    'made-in-china', 'allegro', 'magaluempresas.com'];

async function evaluateUrlUsingXpath(url, xpathToMessagesList, marketplace) {
    let driver;

    if (nonHeadlessMarketplaces.includes(marketplace)) {
        driver = await new Builder()
            .forBrowser('chrome')
            .build();
    } else {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(new chrome.Options().headless()) // Run in headless mode
            .build();
    }
    try {
        for (let i = 0; i < xpathToMessagesList.length; ++i) {
            let xpath = xpathToMessagesList[i][0];
            let expectedMessages = xpathToMessagesList[i][1];
            try {
                await driver.get(url);
                performPreprocess(driver, marketplace);
                // await new Promise(r => setTimeout(r, 15000));
                // let googleLogin = await driver.findElement(By.xpath(
                //     "//button/div[2][text()='Google']"));
                // googleLogin.click();
                // await new Promise(r => setTimeout(r, 40000));
                // let googleLogin2 = await driver.findElement(By.xpath(
                //     '//*[@id="view_container"]/div/div/div[2]/div/div[1]/div/form/span/section/div/div/div/div/ul/li[1]/div/div[1]/div'));

                // googleLogin2.click();
                // 'shoppeebms@gmail.com'
                // BlackMarket@2023
                // shopee
                // removed tabou link - https://item.taobao.com/auction/noitem.htm?itemid=665851295171&catid=0&spm=a230r.1.14.144.1fa155adWEfu5S&ns=1&abbucket=20#detail
                // http://love.taobao.com/guang/transfer.htm?src=item_auto&itemid=665851295171&catid=0&ad_id=&jlogid=p09005207fa1b4

                // Wait for the title element and retrieve its text
                // console.log(await driver.getPageSource());
                await driver.wait(until.elementLocated(By.xpath(xpath)), 10000); // Wait for up to 10 seconds
                const titleElement = await driver.findElement(By.xpath(xpath));
                const xpathValue = await titleElement.getAttribute('textContent');
                console.log(`The xpath value for ${url} is: ${xpathValue}`);
                return matchesWithExpectedMessage(xpathValue, expectedMessages);

                // // Now wait for the specific element by XPath
                // await driver.wait(until.elementLocated(By.xpath('//title')), 10000); // Wait for up to 10 seconds
                // let element = await driver.findElement(By.xpath('//title'));
                // let isElementDisplayed = await element.isDisplayed();

                // console.log(`Element with XPath "${xpath}" is ${isElementDisplayed ? 'displayed' : 'not displayed'} on the page.`);
            } catch (error) {
                console.error(`An error occurred for ${url} during scanning for XPath: ${error}`);
            }
        }
    } finally {
        await driver.quit();
    }
    return false;
}

/**
 * Handles pre-processing such as remove pop-ups/ handle logins, based on the marketplace.
 *
 * @param driver
 * @param marketplace
 */
async function performPreprocess(driver, marketplace) {
    switch (marketplace) {
        case 'wish.com' :
            let xpath = '//*[@id="react-app"]/div/div[8]/div[3]/div/div/div[1]';
            await driver.wait(until.elementLocated(By.xpath(xpath)), 30000);
            let exitButton = await driver.findElement(By.xpath(xpath));
            exitButton.click();
            break;
    }

}

function fetchMarketPlace(url) {
    let marketplaces = Object.keys(xpathToMessageMap);
    for (let i = 0; i < marketplaces.length; ++i) {
        if (url.includes(marketplaces[i])) {
            console.log(marketplaces[i]);
            console.log(`marketplace found for ${url} is ${marketplaces[i]}`);
            return marketplaces[i];
        }
    }
    console.log("no marketplace found for " + url);
    return null;
}

function fetchExpectedXpathMessage(marketplace) {
    return xpathToMessageMap[marketplace][1][1];
}

function matchesWithExpectedMessage(xpathValue, expectedMessages) {
    for (let i = 0; i < expectedMessages.length; ++i) {
        if (xpathValue.includes(expectedMessages[i])) {
            return true;
        }
    }
    return false;
}

function printUrlList(urlList) {
    for (let i = 0; i < urlList.length; ++i) {
        console.log(urlList[i]);
    }
    console.log();
}

const deadSites = [];
const sitesTobeCheckedManually = [];
const marketPlaceSitesToBeConfigured = [];

async function isURLActive(url) {
    let marketPlace = fetchMarketPlace(url);
    if (marketPlace == null) {
        let isURLRemoved = await evaluateUrlUsingXpath(url, defaultXpathMap, marketPlace);
        if(!isURLRemoved) {
            marketPlaceSitesToBeConfigured.push(url);
        }
        else {
            console.log("standalone site is dead")
            deadSites.push(url)
        }
        return;
    }
    let xpathToMessagesList = xpathToMessageMap[marketPlace];
    console.log(url);
    if (xpathToMessagesList != null) {
        let isURLRemoved = await evaluateUrlUsingXpath(url, xpathToMessagesList, marketPlace)
        if (isURLRemoved) {
            deadSites.push(url);
        } else {
            console.log("SitesTobeCheckedManually")
            sitesTobeCheckedManually.push(url);
        }
    }
}

async function areURLsActive(filePath) {
    const file = readFileSync(filePath, 'utf8');
    let urls = [];
    file.split(/\r?\n/).forEach(url => {
        urls.push(url);
    });
    for (let i = 0; i < urls.length; ++i) {
        await isURLActive(urls[i]);
    }
    console.log('Dead Sites :');
    printUrlList(deadSites);
    console.log('To be checked Manually :');
    printUrlList(sitesTobeCheckedManually);
    console.log('Marketplaces to be configured :');
    printUrlList(marketPlaceSitesToBeConfigured);
}

// Example usage:
// const url = 'https://www.walmart.com/ip/Livesture-Creative-And-Simple-Barbecue-Grill-Cleaning-Brush-Yellow/1468866620?wmlspartner=wlpa&selectedSellerId=101099318&adid=22222222227000000000&wl0=&wl1=g&wl2=c&wl3=42423897272&wl4=aud-393207457166:pla-51320962143&wl5=9051746&wl6=&wl7=&wl8=&wl9=pla&wl10=503229898&wl11=online&wl12=1468866620&veh=sem&gclid=CjwKCAiAhKycBhAQEiwAgf19eheYE7B5Ho2Y9c9sys-RjH9S4vyuVAgRbxBrqiT6Eixu72IyJ4AFTRoCRTMQAvD_BwE'; // Replace with your target URL
// const xpath = '//title'; // Replace with the XPath you want to scan for


// fetchXpathValue(url, xpath);
filePath = process.argv[2];
areURLsActive(filePath)