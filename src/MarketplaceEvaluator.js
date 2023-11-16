const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');


nonHeadlessMarketplaces = ['shopee', 'tokopedia', 'walmart', 'fruugo', 'dhgate', 'etsy', 'americanas', 'meesho',
    'made-in-china', 'allegro', 'magaluempresas.com', 'world.tmon'];


// Create an enum-like class for marketplace XPaths and messages
class MarketplaceEvaluator {
    static DEFAULT = {
        XPATHS: ['//title'],
        MESSAGES: [['404', 'Not Found', 'Home page']],
        marketplaceQuery: 'default',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static WORLD_TMON = {
        marketplaceQuery: 'world.tmon',
        async evaluate(url) {
            let driver = await fetchDriver('world.tmon');
            await driver.get(url);
            try {
                let message = await driver.switchTo().alert().getText();
                await driver.switchTo().alert().accept();
                return !!(message.includes('현재 사이트에서 구매하실 수 없는 상품입니다. US 사이트로 이동하여 상품을 구매하시겠습니까')
                    || message.includes('죄송합니다. 이 상품은 현재 판매중지된 상품입니다'));
            } catch (err) {
                // If no alert is present, an error will be thrown
                console.log("No alert was present");
            } finally {
                await driver.quit();
            }
            return false;
        },
    };

    static EBAY = {
        XPATHS: ['//title'],
        MESSAGES: [['Error page', 'Error Page', 'foutpagina', 'Foutpagina', 'Fehlerseite', 'Página de error',
            'Remove  | eBay']],
        marketplaceQuery: 'ebay',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static WALMART = {
        XPATHS: ['//*[@id="maincontent"]/div/span'],
        MESSAGES: [['This page could not be found.']],
        marketplaceQuery: 'walmart',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static AMAZON = {
        XPATHS: ['//title'],
        MESSAGES: [['Page Not Found']],
        marketplaceQuery: 'amazon',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static SHOPEE = {
        XPATHS: [],
        MESSAGES: [],
        marketplaceQuery: 'shopee',
        async evaluate(url) {
            return false; // shopee should be checked manually as there is no aumated solution available at the moment.
        },
    };

    static ALIEXPRESS = {
        XPATHS: ['//title'],
        MESSAGES: [['404', 'Page Not Found', 'campaign']],
        marketplaceQuery: 'aliexpress',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ALIBABA = {
        XPATHS: ['//title'],
        MESSAGES: [['This product is no longer available', 'Dit product is niet meer beschikbaar', 'Bu ürün artık mevcut değildir', 'Este produto não está mais disponível', 'この製品はもう利用できません', 'इस उत्पाद अब उपलब्ध नहीं है', 'Ce produit n\'est plus disponible', 'Este produto não está mais disponível']],
        marketplaceQuery: 'alibaba',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static LAZADA = {
        XPATHS: ['//title'],
        MESSAGES: [['non-existent products']],
        marketplaceQuery: 'lazada',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static TOKOPEDIA = {
        XPATHS: ['//*[@id="zeus-root"]/div/div[2]/div/div[2]/p'],
        MESSAGES: [['Mungkin kamu salah jalan atau alamat']],
        marketplaceQuery: 'tokopedia',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ARTICULO = {
        XPATHS: ['//*[@id=":r0:-title"]/h2'],
        MESSAGES: [['Los usuarios también buscaron', 'Las búsquedas más deseadas']],
        marketplaceQuery: 'articulo',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static FRUUGO = {
        XPATHS: ['//title'],
        MESSAGES: [['no longer available', 'Lamentamos', 'Spiacenti', 'Désolé', 'Λυπούμαστε', 'Beklager', 'Sorry',
            'Tyvärr', 'Lo sentimos', 'Sajnos', 'Pahoittelemme']],
        marketplaceQuery: 'fruugo',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static TEMU = {
        XPATHS: ['//*[@id="main_scale"]/div[2]/div/div/div/div/div[1]/h1'],
        MESSAGES: [['This item was discontinued']],
        marketplaceQuery: 'temu',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static GALLEON = {
        XPATHS: ['//title'],
        MESSAGES: [['Homepage']],
        marketplaceQuery: 'galleon',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    // Add more marketplaces here

    static DHGATE = {
        XPATHS: ['//title'],
        MESSAGES: [['error']],
        marketplaceQuery: 'dhgate',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ETSY = {
        XPATHS: ['//*[@id="content"]/div[1]/div[1]/div/div/div/div/p'],
        MESSAGES: [['this item and shop']],
        marketplaceQuery: 'etsy',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static GUATEMALADIGITAL = {
        XPATHS: ['//*[@id="__next"]/div/div[1]/div[3]/div/div/h1'],
        MESSAGES: [['Su búsqueda no generó']],
        marketplaceQuery: 'guatemaladigital',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static CATCH = {
        XPATHS: ['//title'],
        MESSAGES: [['Great daily deals at Australia\'s favourite superstore']],
        marketplaceQuery: 'catch',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ZOLA = {
        XPATHS: ['//title'],
        MESSAGES: [['Not found']],
        marketplaceQuery: 'zola',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static PLANCLIENT = {
        XPATHS: ['//title'],
        MESSAGES: [['Planclient']],
        marketplaceQuery: 'planclient',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static MENARDS = {
        XPATHS: ['//title'],
        MESSAGES: [['Missing Page']],
        marketplaceQuery: 'menards',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static CESDEALS = {
        XPATHS: ['//*[@id="shoplaza-section-1539137345643"]/div/div/div/span[2]'],
        MESSAGES: [['Sorry']],
        marketplaceQuery: 'cesdeals',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static GIPSTK = {
        XPATHS: ['//*[@id="top"]/div[2]/div/div/section/div/div/div/div/div/div/header/h2/span[1]'],
        MESSAGES: [['We are sorry']],
        marketplaceQuery: 'gipstk',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static FAMILYFOODPRODUCTS = {
        XPATHS: ['//title'],
        MESSAGES: [['Not Found']],
        marketplaceQuery: 'familyfoodproducts',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static AMERICANAS = {
        XPATHS: ['//title'],
        MESSAGES: [['Estamos']],
        marketplaceQuery: 'americanas',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static TIKTOK = {
        XPATHS: ['//*[@id="root"]/div/div[1]/div/div[1]'],
        MESSAGES: [['Product not available']],
        marketplaceQuery: 'tiktok',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static MEESHO = {
        XPATHS: ['//*[@id="__next"]/div[3]/div/span'],
        MESSAGES: [['This product is out of stock']],
        marketplaceQuery: 'meesho',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static WISH = {
        XPATHS: ['//*[@id="react-app"]/div/div[6]/div[3]/div/div/div[2]'],
        MESSAGES: [['This product is no longer available on Wish']],
        marketplaceQuery: 'wish.com',
        async evaluate(url) {
            // pre-process
            try {
                let driver = await fetchDriver(this.marketplaceQuery);
                await driver.get(url);
                let wishXpath = '//*[@id="react-app"]/div/div[8]/div[3]/div/div/div[1]';
                await driver.wait(until.elementLocated(By.xpath(wishXpath)), 30000);
                let exitButton = await driver.findElement(By.xpath(wishXpath));
                exitButton.click();
                return await evaluateWithInfo(url, this, driver);
            }
            catch (e) {
                console.error(`Exception occured while performing pre-processing for wish link - ${url}`, e);
            }
        },
    };

    static MADEINCHINA = {
        XPATHS: ['/html/body/div[7]/div[2]/div[4]/div/div/div[1]/div[1]/h1'],
        MESSAGES: [['']],
        marketplaceQuery: 'made-in-china',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ALLEGRO = {
        XPATHS: ['/html/body/div[2]/div[8]/div/div/div[1]/div/div/div/div/div/div/div/h6'],
        MESSAGES: [['Oferta została zakończona']],
        marketplaceQuery: 'allegro',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static TAOBAO = {
        XPATHS: ['/html/body/center[1]/h1'],
        MESSAGES: [['404']],
        marketplaceQuery: 'taobao',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static MAGALUEMPRESAS = {
        XPATHS: ['//title'],
        MESSAGES: [['Produto não encontrado']],
        marketplaceQuery: 'magaluempresas',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static FYNDIQ = {
        XPATHS: ['//title'],
        MESSAGES: [['Fynda billiga produkter']],
        marketplaceQuery: 'fyndiq',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static DARAZ = {
        XPATHS: ['//title'],
        MESSAGES: [['Product not found']],
        marketplaceQuery: 'daraz',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static ES_ALIEXPRESS = {
        XPATHS: ['//title'],
        MESSAGES: [['Page Not Found - Aliexpress.com']],
        marketplaceQuery: 'es.aliexpress',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static JOOM = {
        XPATHS: ['//title'],
        MESSAGES: [['Buy at low prices in the Joom online store']],
        marketplaceQuery: 'joom',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static UBUY = {
        XPATHS: [
            '//*[@id="product-view-full"]/section/div/div/div/div/p',
            '//title',
        ],
        MESSAGES: [['Not found your desired product'], ['Product not available']],
        marketplaceQuery: 'ubuy',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static YOU_BUY = {
        XPATHS: ['//title'],
        MESSAGES: [['Product not available']],
        marketplaceQuery: 'you-buy',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    // Add more marketplaces here
}

async function evaluateWithInfo(url, info) {
    return await evaluateWithInfo(url, info, null);
}

async function evaluateWithInfo(url, info, customDriver) {
    let driver = customDriver;
    try {
        if(driver == null) {
            driver = await fetchDriver(info.marketplaceQuery);
            await driver.get(url);
        }
        const {XPATHS, MESSAGES} = info;
        for (let i = 0; i < XPATHS.length; i++) {
            const xpath = XPATHS[i];
            const expectedMessages = MESSAGES[i];
            await driver.wait(until.elementLocated(By.xpath(xpath)), 10000);
            const titleElement = await driver.findElement(By.xpath(xpath));
            const xpathValue = await titleElement.getAttribute('textContent');
            console.log(`The xpath value for ${url} is: ${xpathValue}`);
            return expectedMessages.some(message => xpathValue.includes(message));
        }
    } catch (error) {
        console.error(`An error occurred for ${url} during scanning for XPath: ${error}`);
    } finally {
        await driver.quit();
    }
    return false;
}

async function fetchDriver(marketplace) {
    var options = new chrome.Options();
    if (!nonHeadlessMarketplaces.includes(marketplace)) {
        options.addArguments('--headless'); // Run in headless mode
        options.addArguments('--disable-gpu'); // Recommended for headless mode
    }
    return new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}

module.exports = {MarketplaceEvaluator};