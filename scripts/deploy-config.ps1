Set-StrictMode -Version latest;
$ErrorActionPreference = "Continue";

# Read config file
$config = Get-Content -Raw -Path scripts\deploy.json | ConvertFrom-Json;

$configName = $($config.configName);

Write-Output "`n---------------------------";
Write-Output "Checking if prod-config.json is present in the config folder ...";
$sourceFileIsMissing = ( ! (test-Path -Path config\prod-config.json) );
if ($sourceFileIsMissing) {
    Write-Output "Error: config/prod-config.json is missing";
    Exit -1;
}

Write-Output "`n---------------------------";
Write-Output "Creating swarm config $configName ...";
docker config create $configName config\prod-config.json

Write-Output "`n---------------------------";
Write-Output "Production mode config.json was deployed as a swarm config`n";
Write-Output "**************************************************`n`n";
