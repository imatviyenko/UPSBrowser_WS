Set-StrictMode -Version latest;
$ErrorActionPreference = "Stop";

# Read config file
$config = Get-Content -Raw -Path scripts/deploy.json | ConvertFrom-Json;

$localImageName = $($config.dockerImageName);
$registryImageName = "$($config.dockerRegistryPath)/$($config.dockerImageName)";
$stackName = $($config.dockerStackName);

Write-Output "`n`n**************************************************";
Write-Output "Building docker image ...";
docker build --tag $localImageName --file scripts\docker\Dockerfile .

Write-Output "`n---------------------------";
Write-Output "localImageName: $localImageName";
Write-Output "registryImageName: $registryImageName";
Write-Output "Tagging the image ...";
docker tag $localImageName $registryImageName

Write-Output "`n---------------------------";
Write-Output "Pushing the image to the private registry ...";
docker push $registryImageName

Write-Output "`n---------------------------";
Write-Output "Redeploying docker swarm stack ...";
docker stack deploy -c scripts\docker\docker-compose.yml $stackName

Write-Output "`n---------------------------";
Write-Output "Deployment was successful`n";
Write-Output "**************************************************`n`n";
