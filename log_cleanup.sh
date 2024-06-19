#!/bin/bash

days_ago=7

# Get the date 'days_ago' in the past
current_date=$(date -d "-$days_ago days" "+%Y-%m-%d")

# deleting the report
echo y | rm src/reports/report_${current_date}

client_names=("GRILL_RESCUE" "BEER_BUDDY" "HAUTE_DIGGITE_DOG" "SPRINGER_PETS" "UPROOT")

# Base directory where client directories are located
base_dir="src/output"

# Iterate through the array
for client in "${client_names[@]}"
do
   client_dir="$base_dir/$client" # Path to the client's directory

   # Check if the directory exists
   if [ -d "$client_dir" ]; then
       # List all files in the directory
       for file in "$client_dir"/*
       do
           # Check if it's a file and not a directory and contains the current date
           if [ -f "$file" ] && [[ $file == *"$current_date"* ]]; then

             # deleting the file
               echo "Deleting: $file"
               rm "$file"
           fi
       done
   fi
done
