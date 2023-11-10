# bms_url_scanner
Script to scan the BMS url links (removed/submitted-for-removal) and classify them accordingly (as dead sites, live etc)

### Authors
Sairam Koripelly

### Usage
1. cd into the root directory (`bms_url_scanner`)
1. Add the required links to be scanned in the `src/resources/test_links`
2. Run the command `node --trace-warnings src/url_scanner.js src/resources/test_links`
