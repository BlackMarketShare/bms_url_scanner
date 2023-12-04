#!/bin/bash

# Add client names here and also in sr/input folder
client_names=("beer_buddy" "grill_rescue" "haute_diggite_dog" "springer_pets" "strojo" "uproot")

# Loop through each client
for name in "${client_names[@]}"; do
    # Run the node command with the current client name
    sudo node --trace-warnings src/url_scanner.js "$name" "$1" > ./"$name" 2>&1

    # Remove the temporary Chromium files
    sudo rm -rf /tmp/.org.chromium.Chromiu*
done