#!/bin/sh
chmod 744 scripts/bin/jq

getConfigValue() {
    echo $(cat scripts/deploy.json | scripts/bin/jq --raw-output $1)
}



configName=$(getConfigValue '.configName')

echo "\n\n**************************************************\n";

echo 'configName: ' $configName

echo "\nChecking if prod-config.json is present in the config folder ..."
if ! test -f config/prod-config.json; then
    echo "Error: config/prod-config.json is missing"
    exit 1
fi


echo "\nCreating swarm config $configName ..."
docker config create $configName config\prod-config.json

echo "Production mode config.json was deployed as a swarm config\n";
echo "**************************************************\n\n";
