# bms_url_scanner
Script to scan the BMS url links (removed/submitted-for-removal) and classify them accordingly (as dead sites, live etc)

### Authors
Sairam Koripelly

### Usage
1. cd into the root directory (`bms_url_scanner`)
2. Add the required links to be scanned in the `src/resources/test_links`
3. Run the command `node --trace-warnings src/url_scanner.js src/resources/test_links 10` 
(here 10 refers to the url batch count to be scanned at a given point)

### Output
1. All the deadSites are written to **src/output/deadSites.txt**
2. All the marketPlaceSitesToBeConfigured sites are written to **src/output/marketPlaceSitesToBeConfigured.txt**
3. All the sitesTobeCheckedManually sites are written to **src/output/sitesTobeCheckedManually.txt**