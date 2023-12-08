#!/bin/bash

if [ -z "$1" ]; then
    echo "Error: batch size not provided."
    exit 1
fi

# Add client names here and also in sr/input folder
client_names=("GRILL_RESCUE" "BEER_BUDDY" "HAUTE_DIGGITE_DOG" "SPRINGER_PETS" "STOJO" "UPROOT")

# Loop through each client
for name in "${client_names[@]}"; do
    # Run the node command with the current client name
    sudo node --trace-warnings src/url_scanner.js "$name" "$1" > ./"$name" 2>&1

    # Remove the temporary Chromium files
    sudo ps -ef |  grep chromium | awk '{print $2}' | xargs kill
    sudo rm -rf /tmp/.org.chromium.Chromiu*
done