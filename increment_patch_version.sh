#!/bin/bash

# check temp.json exists
if [ -f temp.json ]; then
    rm temp.json
fi
# Ensure jq is installed
if ! command -v jq &> /dev/null
then
    echo "jq could not be found, please install it (e.g., sudo apt install jq)"
    exit
fi

# Increment the patch version
jq '.version |= (split(".") | .[0] |= tonumber | .[1] |= tonumber | .[2] |= (tonumber + 1) | map(tostring) | join("."))' package.json > temp.json
mv temp.json package.json

INCREMENTED_VERSION="v$(jq -r '.version' package.json)"

git add package.json

git commit -m "chore: release ${INCREMENTED_VERSION}"

git tag "${INCREMENTED_VERSION}"

git push

git push origin "${INCREMENTED_VERSION}"
