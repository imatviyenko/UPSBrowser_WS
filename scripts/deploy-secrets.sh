#!/bin/sh
chmod 744 scripts/bin/jq

getConfigValue() {
    echo $(cat scripts/deploy.json | scripts/bin/jq --raw-output $1)
}



localImageName=$(getConfigValue '.dockerImageName')
sslCertSecretName=$(getConfigValue '.sslCertSecretName')
sslCertKeySecretName=$(getConfigValue '.sslCertKeySecretName')
sslCertPemSecretName=$(getConfigValue '.sslCertPemSecretName')
usersFileSecretName=$(getConfigValue '.usersFileSecretName')

echo "\n\n**************************************************\n";

echo 'localImageName: ' $localImageName
echo 'sslCertSecretName: ' $sslCertSecretName
echo 'sslCertKeySecretName: ' $sslCertKeySecretName
echo 'sslCertPemSecretName: ' $sslCertPemSecretName
echo 'usersFileSecretName: ' $usersFileSecretName


echo "\nChecking if all four required files sslcert.cert, sslcert.key, sslcert.pem and users.json are present in the config/prod-secrets folder ..."
if ! test -f config/PROD-SECRETS-SENSITIVE/sslcert.cert || ! test -f config/PROD-SECRETS-SENSITIVE/sslcert.key || ! test -f config/PROD-SECRETS-SENSITIVE/sslcert.pem || ! test -f config/PROD-SECRETS-SENSITIVE/users.json; then
    echo "Error: one of the required source files or Docker Swarm secrets is missing in config/prod-secrets folder"
    exit 1
fi


echo "\nCreating secret $sslCertSecretName ..."
docker secret create $sslCertSecretName config/PROD-SECRETS-SENSITIVE/sslcert.cert

echo "\nCreating secret $sslCertKeySecretName ..."
docker secret create $sslCertKeySecretName config/PROD-SECRETS-SENSITIVE/sslcert.key

echo "\nCreating secret $sslCertPemSecretName ..."
docker secret create $sslCertPemSecretName config/PROD-SECRETS-SENSITIVE/sslcert.pem

echo "\nCreating secret $usersFileSecretName ..."
docker secret create $usersFileSecretName config/PROD-SECRETS-SENSITIVE/users.json

echo "Docker Swarm secrets have been created successfully\n";
echo "**************************************************\n\n";
