#!/bin/bash

current_date=$(date "+%Y-%m-%d")

if [ -z "$1" ]; then
    echo "Error: batch size not provided."
    exit 1
fi

# Add client names here and also in sr/input folder
client_names=("GRILL_RESCUE" "BEER_BUDDY" "HAUTE_DIGGITE_DOG" "SPRINGER_PETS" "UPROOT")

# Loop through each client
for name in "${client_names[@]}"; do
    # Run the node command with the current client name
    sudo node --trace-warnings src/url_scanner.js "$name" "$1" > ./"$name" 2>&1

    # Remove the temporary Chromium files
    sudo ps -ef |  grep chromium | awk '{print $2}' | xargs kill
    sudo rm -rf /tmp/.org.chromium.Chromiu*
done

# create a report for the day
sh report.sh > src/reports/report_${current_date}

# clean up older logs
sh log_cleanup.sh


# mail the report for the day
echo "Report for ${current_date}" | s-nail -s "BMS Sheets Scanner report ${current_date}" -r "BMS Scanner <desertjones404@gmail.com>" -a src/reports/report_${current_date} scott@blackmarketshare.com brad@blackmarketshare.com theomherrero@gmail.com moid@blackmarketshare.com
