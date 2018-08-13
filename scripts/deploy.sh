#!/bin/sh
chmod 744 scripts/bin/jq

getConfigValue() {
    echo $(cat scripts/deploy.json | scripts/bin/jq --raw-output $1)
}


localImageName=$(getConfigValue '.dockerImageName')
dockerRegistryPath=$(getConfigValue '.dockerRegistryPath')
registryImageName="$dockerRegistryPath/$localImageName"
stackName=$(getConfigValue '.dockerStackName')

echo 'localImageName: ' $localImageName
echo 'dockerRegistryPath: ' $dockerRegistryPath
echo 'registryImageName: ' $registryImageName
echo 'stackName: ' $stackName



echo "\n\n**************************************************";
echo "Building docker image ...";
docker build --tag $localImageName --file scripts/docker/Dockerfile .

echo "\nTagging the image ..."
docker tag $localImageName $registryImageName

echo "\nPushing the image to the private registry ..."
docker push $registryImageName

echo "\nRedeploying docker swarm stack ...";
docker stack deploy -c scripts/docker/docker-compose.yml $stackName

echo "\nDeployment was successful\n";
echo "**************************************************\n\n";




