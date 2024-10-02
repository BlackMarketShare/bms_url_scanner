#!/bin/bash

# PostgreSQL credentials
PGHOST="aws-0-us-west-1.pooler.supabase.com"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="postgres.qgmhsfgatjzbdxxiqnhq"
PGPASSWORD="r3XyvQUkUjJPPATXBZoXoinE6try1LwdF2Osf6KgILk="
export PGPASSWORD=$PGPASSWORD

# Query to get client names
query='SELECT DISTINCT "clientName" FROM "User" WHERE "clientName" != '\''BMS'\'';'


# Fetch client names from PostgreSQL and handle each line individually
client_names=()
while IFS= read -r line; do
    # Trim any leading/trailing whitespace (optional) and add the client name to the array
    client_names+=("$line")
done < <(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "$query")

if [ ${#client_names[@]} -eq 0 ]; then
    echo "Error: No client names found in the database."
    exit 1
fi

current_date=$(date "+%Y-%m-%d")

if [ -z "$1" ]; then
    echo "Error: batch size not provided."
    exit 1
fi

# Loop through each client
for name in "${client_names[@]}"; do
    # Remove leading and trailing whitespace from the client name
    name=$(echo "$name" | xargs)
    
    echo "Processing client: $name"
    
    # Run the node command with the current client name
    node src/url_scanner.js "$name" "$1" > ./"$name" 2>&1

    # Check if the node command was successful
    if [ $? -eq 0 ]; then
        echo "Processing of $name completed successfully."
    else
        echo "Error processing $name." >&2
    fi
    
    # Remove the temporary Chromium files
    sudo ps -ef | grep '[c]hromium' | awk '{print $2}' | xargs -r sudo kill
    sudo rm -rf /tmp/.org.chromium.Chromiu*
done


# # create a report for the day
sh report.sh > src/reports/report_${current_date}

# clean up older logs
sh log_cleanup.sh


# # mail the report for the day
echo "Report for ${current_date}" | s-nail -s "BMS Sheets Scanner report ${current_date}" -r "BMS Scanner <desertjones404@gmail.com>" -a src/reports/report_${current_date} moid@blackmarketshare.com
