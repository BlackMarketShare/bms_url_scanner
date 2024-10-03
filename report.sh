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
directories=()
while IFS= read -r line; do
    # Trim any leading/trailing whitespace (optional) and add the client name to the array
    directories+=("$line")
done < <(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "$query")

if [ ${#directories[@]} -eq 0 ]; then
    echo "Error: No client names found in the database."
    exit 1
fi


# List of directory names
# directories=("GRILL_RESCUE" "BEER_BUDDY" "HAUTE_DIGGITE_DOG" "SPRINGER_PETS" "UPROOT") # Replace with your directory names

# Get current date in the desired format (adjust the format as needed)
current_date=$(date "+%Y-%m-%d")

# Loop through each directory
for dir in "${directories[@]}"
do
    dir=$(echo "$dir" | xargs)
    # Construct the deadSites file path
    dead_sites_file="src/output/${dir}/deadSites_${current_date}.txt"
    echo "Directory: $dir"

    # Check if the main file exists
    if [ -f "$dir" ]; then
        # Fetch the line that starts with 'Total url count' from the main file
        total_url_count_line=$(grep '^Total url count' "$dir")

        # Fetch the last line from the main file
        last_line=$(tail -n 1 "$dir")

        # Print the Total url count line and last line of the main file
        echo "Urls scanned: $total_url_count_line"
        echo "$last_line"
    else
        echo "Main file not found: $dir"
    fi

    # Check if the deadSites file exists
    echo "Dead links fetched:"
    if [ -f "$dead_sites_file" ]; then

        # Initialize line number counter
        line_number=1

        # Read and print each line with line numbers
        while IFS= read -r line; do
            echo "$line_number: $line"
            ((line_number++))
        done < "$dead_sites_file"
    else
        echo "None"
    fi

    echo "-------------------"
done
