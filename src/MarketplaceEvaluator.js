const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const randomUseragent = require('random-useragent');

nonHeadlessMarketplaces = [];


// Create an enum-like class for marketplace XPaths and messages
class MarketplaceEvaluator {
    static DEFAULT = {
        XPATHS: ['//title'],
        MESSAGES: [['Not Found', 'Home page', 'Error', 'Website unavailable']],
        marketplaceQuery: 'default',
        async evaluate(url) {
            const userAgent = randomUseragent.getRandom();
            return await evaluateWithUserAgent(url, this, userAgent);
        },
    };

    static WORLD_TMON = {
        marketplaceQuery: 'world.tmon',
        MESSAGES: ['현재 사이트에서 구매하실 수 없는 상품입니다. US 사이트로 이동하여 상품을 구매하시겠습니까',
            '죄송합니다. 이 상품은 현재 판매중지된 상품입니다'],
        async evaluate(url) {
            let driver = await fetchDriver(this.marketplaceQuery, randomUseragent.getRandom());
            try {
                await driver.get(url);
                let outputText = await driver.switchTo().alert().getText();
                await driver.switchTo().alert().accept();
                return this.MESSAGES.some(message => outputText.includes(message));
            } catch (err) {
                // If no alert is present, an error will be thrown
                console.log("No alert was present");
            } finally {
                await driver.quit();
            }
            return false;
        },
    };

    static UNIT808 = {
        marketplaceQuery: 'unit808',
        MESSAGES: ['해당 상품은 품절되었거나 삭제된 상품입니다'],
        async evaluate(url) {
            let driver = await fetchDriver(this.marketplaceQuery);
            try {
                await driver.get(url);
                let outputText = await driver.switchTo().alert().getText();
                await driver.switchTo().alert().accept();
                return this.MESSAGES.some(message => outputText.includes(message));
            } catch (err) {
                // If no alert is present, an error will be thrown
                console.error("No alert was present",err);
            } finally {
                await driver.quit();
            }
            return false;
        },
    };

    static EBAY = {
        XPATHS: ['//title', '/html/body/div[2 or 3]/div[2]/div[1]/div[2]/div/div/div[1 or 2]/div/div/div/div/div/span',
        '/html/body/div[2]/div[2]/div[1]/div[2]/div/div/div[1]/div/div[2]/div/span[1]/span'],
        MESSAGES: [['Error page', 'Error Page', 'foutpagina', 'Foutpagina', 'Fehlerseite', 'Página de error',
            'Remove  | eBay'],
                   ['This listing ended', 'This listing was ended','This listing was ended by the seller',
                   'Dieses Angebot wurde', 'Bieten endete am'],['Dieser Artikel ist nicht vorrätig']],
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
            const userAgent = 'Mozilla/5.0 (Linux; Android 4.0.4; BNTV400 Build/IMM76L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.111 Safari/537.36';
            return await evaluateWithUserAgent(url, this, userAgent);
        },
    };

    static MAGAZINELUIZA = {
        XPATHS: ['//*[@id="__next"]/div/main/section[2]/div[1]/div/div/div/h1'],
        MESSAGES: [['Não encontramos essa página']],
        marketplaceQuery: 'magazineluiza',
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
        XPATHS: ['//*[@id="main"]/div/div[2]/div[1]/div/div/div/div'],
        MESSAGES: [['The product doesn\'t exist']],
        marketplaceQuery: 'shopee',
        async evaluate(url) {
            // const userAgent = randomUseragent.getRandom();
            // return await evaluateWithUserAgent(url, this, userAgent);
            // // return await evaluateWithInfo(url, this);
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

    static CAROUSELL = {
        XPATHS: ['//*[@id="main"]/div[1]/div[1]/p'],
        MESSAGES: [['This listing is currently not available']],
        marketplaceQuery: 'carousell',
        async evaluate(url) {
            const userAgent = randomUseragent.getRandom();
            return await evaluateWithUserAgent(url, this, userAgent);
        },
    };

    static ALIBABA = {
        XPATHS: ['//title', '//*[@id="root"]/div/div[1]/div[2]/div[1]'],
        MESSAGES: [['This product is no longer available', 'Dit product is niet meer beschikbaar',
            'Bu ürün artık mevcut değildir', 'Este produto não está mais disponível',
            'この製品はもう利用できません', 'इस उत्पाद अब उपलब्ध नहीं है', 'Ce produit n\'est plus disponible',
            'Este produto não está mais disponível', '이 제품은 더 이상 사용할 수 없습니다', 'Alibaba.com Select',
             'Produk ini sudah tidak tersedia lagi', 'สินค้าตัวนี้ไม่มีแล้วครับ', 'Этот продукт больше не доступен',
              'Sản phẩm này là không còn có sẵn', 'Este producto ya no está disponible', '该产品不再可用。',
               'Dieses Produkt ist nicht mehr verfügbar', 'Questo prodotto non è più disponibile.'],
                  ['Oops! We can\'t find the page you\'re looking for.']],
        marketplaceQuery: 'alibaba.com',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static LAZADA = {
        XPATHS: ['/html/body/div[2]/div/h3','//title'],
        MESSAGES: [['This product is no longer available'],['non-existent products']],
        marketplaceQuery: 'lazada',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static PROM = {
        XPATHS: ['//*[@id="page-block"]/div/div[2]/div/div[1]/div/div[2]/div[1]/span'],
        MESSAGES: [['Оо! Сторінка не знайдена']],
        marketplaceQuery: 'prom.ua',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static TOKOPEDIA = {
        XPATHS: ['//*[@id="zeus-root"]/div/div[2]/div/div[2]/p'],
        MESSAGES: [['Mungkin kamu salah jalan atau alamat']],
        marketplaceQuery: 'tokopedia',
        async evaluate(url) {
            const userAgent = 'Mozilla/5.0 (PLAYSTATION 3; 2.00)'
            return await evaluateWithUserAgent(url, this, userAgent);
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
            'Tyvärr', 'Lo sentimos', 'Sajnos', 'Pahoittelemme', 'عذراً، المُنتْج الذي تبحث عنه لم يعد متوفراً | Fruugo',
        'Ne pare rău, produsul căutat nu mai este disponibil']],
        marketplaceQuery: 'fruugo',
        async evaluate(url) {
            const userAgent = 'Opera/9.80 (Windows NT 6.1; U; en) Presto/2.7.62 Version/11.01';
            return await evaluateWithUserAgent(url, this, userAgent);
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
        MESSAGES: [['error', "This item doesn't exist"]],
        marketplaceQuery: 'dhgate',
        async evaluate(url) {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0';
            return await evaluateWithUserAgent(url, this, userAgent);
        },
    };

    static ETSY = {
        XPATHS: ['//title', '//*[@id="content"]/div[1]/div[1]/div/div/div/div/p'],
        MESSAGES: [['This item is unavailable'], ['this item and shop']],
        marketplaceQuery: 'etsy',
        async evaluate(url) {
            const userAgent = randomUseragent.getRandom();
            return await evaluateWithUserAgent(url, this, userAgent);
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
        XPATHS: ['//title','//*[@id="maincontent"]/div/main/div/h1'],
        MESSAGES: [['Great daily deals at Australia\'s favourite superstore','404']],
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

    static GMARKET = {
        XPATHS: ['//*[@id="gnb"]/li[1]/a'],
        MESSAGES: [['Brand Fashion']],
        marketplaceQuery: 'global.gmarket',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    static SHOPABUNDA = {
        XPATHS: ['/html/body/div[2]/main/div/section/h3'],
        MESSAGES: [['Something isn\'t right']],
        marketplaceQuery: 'shopabunda',
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
            const userAgent = 'Mozilla/5.0 (compatible; Konqueror/3.5; Linux; en_US) KHTML/3.5.6 (like Gecko) (Kubuntu)';
            return await evaluateWithUserAgent(url, this, userAgent);
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
            } catch (e) {
                console.error(`Exception occured while performing pre-processing for wish link - ${url}`, e);
                await driver.quit();
            }
            return false;
        },
    };

    static MADEINCHINA = {
        XPATHS: ['/html/body/div[7]/div[2]/div[4]/div/div/div[1]/div[1]/h1'],
        MESSAGES: [['']],
        marketplaceQuery: 'made-in-china',
        async evaluate(url) {
            const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_5) AppleWebKit/536.26.17 (KHTML like Gecko) Version/6.0.2 Safari/536.26.17';
            return await evaluateWithUserAgent(url, this, userAgent);
        },
    };

    static ALLEGRO = {
        XPATHS: ['/html/body/div[2]/div[2]/div/div[4]/div/div/div[2]/div/div/div/div/div/div/div/h3',
            '/html/body/div[2]/div[8]/div/div/div[1]/div/div/div/div/div/div/div/h6'],
        MESSAGES: [['Oferta archiwalna. Zobacz aktualne oferty'], ['Oferta została zakończona']],
        marketplaceQuery: 'allegro',
        async evaluate(url) {
            const userAgent = randomUseragent.getRandom();
            return await evaluateWithUserAgent(url, this, userAgent);
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
        marketplaceQuery: 'magaluempresas.com',
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

    static BUYEE = {
        XPATHS: ['//title'],
        MESSAGES: [['403 Forbidden'], ['Error | Buyee, an Online Proxy Shopping Service']],
        marketplaceQuery: 'buyee',
        async evaluate(url) {
            return await evaluateWithInfo(url, this);
        },
    };

    // Add more marketplaces here
}

async function evaluateWithUserAgent(url, info, userAgent) {
    console.log(userAgent);
    let driver = await fetchDriver(info.marketplaceQuery, userAgent);
    try {
        await driver.get(url);
        return await evaluateWithInfo(url, info, driver);
    } catch (error) {
        await driver.quit();
        return false;
    }
}

async function evaluateWithInfo(url, info) {
    return await evaluateWithInfo(url, info, null);
}

async function evaluateWithInfo(url, info, customDriver) {
    let driver = customDriver;

    // If the URL is from AliExpress, remove the query or search params
    const aliExpressRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)?aliexpress\.[a-z]{2,}/;
    if (aliExpressRegex.test(url)) {
    console.log('this is aliexpress url', url);
        const urlObj = new URL(url);
        urlObj.search = ''; // Clear the search params
        url = urlObj.toString();
        console.log(`Modified URL without query params for AliExpress: ${url}`);
    }

    try {
        if (driver == null) {
            driver = await fetchDriver(info.marketplaceQuery);
            await driver.get(url);
        }
        const { XPATHS, MESSAGES } = info;
        for (let i = 0; i < XPATHS.length; i++) {
            try {
                const xpath = XPATHS[i];
                const expectedMessages = MESSAGES[i];
                await driver.wait(until.elementLocated(By.xpath(xpath)), 15000);
                const titleElement = await driver.findElement(By.xpath(xpath));
                const xpathValue = await titleElement.getAttribute('textContent');
                console.log(`The xpath value for ${url} is: ${xpathValue}`);
                if (expectedMessages.some(message => xpathValue.includes(message))) {
                    return true;
                }
            } catch (error) {
                console.error(`An error occurred for ${url} during scanning for XPath: ${error}`);
            }
        }
    } catch (error) {
        console.error(`An error occurred for ${url} during scanning for XPath: ${error}`);
    } finally {
        await driver.quit();
    }
    return false;
}


async function fetchDriver(marketplace) {
    return await fetchDriver(marketplace, null);
}

async function fetchDriver(marketplace, userAgent) {
    var options = new chrome.Options();
    if (!nonHeadlessMarketplaces.includes(marketplace)) {
        options.addArguments('--no-sandbox');
        options.addArguments('--headless'); // Run in headless mode
        options.addArguments('--disable-gpu'); // Recommended for headless mode
        options.addArguments('--disable-dev-shm-usage');
    }
    if (userAgent != null) {
        options.addArguments(`--user-agent=${userAgent}`);
    }
    return new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}

module.exports = {MarketplaceEvaluator};