#!/bin/bash

# List of directory names
directories=("GRILL_RESCUE" "BEER_BUDDY" "HAUTE_DIGGITE_DOG" "SPRINGER_PETS" "STOJO" "UPROOT") # Replace with your directory names

# Get current date in the desired format (adjust the format as needed)
current_date=$(date "+%Y-%m-%d")

# Loop through each directory
for dir in "${directories[@]}"
do
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
