Set-StrictMode -Version latest;
$ErrorActionPreference = "Stop";

# Read config file
$config = Get-Content -Raw -Path scripts\deploy.json | ConvertFrom-Json;


# SCRIPT ENTRY POINT
$sslCertSecretName = $($config.sslCertSecretName);
$sslCertKeySecretName = $($config.sslCertKeySecretName);
$usersFileSecretName = $($config.usersFileSecretName);
$sslCertPemSecretName = $($config.sslCertPemSecretName);

Write-Output "`n---------------------------";
Write-Output "Checking if all four required files sslcert.cert, sslcert.key, sslcert.pem and users.json are present in the config/PROD-SECRETS-SENSITIVE folder ...";
$secretSourceFileIsMissing =  
    ( `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.cert) `
        -or `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.key) `
        -or `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.pem) `
        -or `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\users.json) `
    );
if ($secretSourceFileIsMissing) {
    Write-Output "Error: one of the required source files or Docker Swarm secrets is missing in config/PROD-SECRETS-SENSITIVE folder";
    Exit -1;
}


Write-Output "`n---------------------------";
Write-Output "Creating secret $sslCertSecretName ...";
docker secret create $sslCertSecretName config\PROD-SECRETS-SENSITIVE\sslcert.cert;


Write-Output "`n---------------------------";
Write-Output "Creating secret $sslCertKeySecretName ...";
docker secret create $sslCertKeySecretName config\PROD-SECRETS-SENSITIVE\sslcert.key;

Write-Output "`n---------------------------";
Write-Output "Creating secret $sslCertPemSecretName ...";
docker secret create $sslCertPemSecretName config\PROD-SECRETS-SENSITIVE\sslcert.pem;

Write-Output "`n---------------------------";
Write-Output "Creating secret $usersFileSecretName ...";
docker secret create $usersFileSecretName config\PROD-SECRETS-SENSITIVE\users.json;


Write-Output "`n---------------------------";
Write-Output "Docker Swarm secrets have been created successfully`n";
Write-Output "**************************************************`n`n";
