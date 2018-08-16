Set-StrictMode -Version latest;
$ErrorActionPreference = "Stop";

# Read config file
$config = Get-Content -Raw -Path scripts\deploy.json | ConvertFrom-Json;


# SCRIPT ENTRY POINT
$sslCertSecretName = $($config.sslCertSecretName);
$sslCertKeySecretName = $($config.sslCertKeySecretName);
$sslCertPemSecretName = $($config.sslCertPemSecretName);

Write-Output "`n---------------------------";
Write-Output "Checking if all  required files sslcert.cert, sslcert.key and sslcert.pem  are present in the config/PROD-SECRETS-SENSITIVE folder ...";
$secretSourceFileIsMissing =  
    ( `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.cert) `
        -or `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.key) `
        -or `
        ! (test-Path -Path config\PROD-SECRETS-SENSITIVE\sslcert.pem) `
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
Write-Output "Creating secret upsbrowser_ws_ldapUserLogin ...";
docker secret create upsbrowser_ws_ldapUserLogin config\PROD-SECRETS-SENSITIVE\ldapUserLogin;


Write-Output "`n---------------------------";
Write-Output "Creating secret upsbrowser_ws_ldapUserPassword ...";
docker secret create upsbrowser_ws_ldapUserPassword config\PROD-SECRETS-SENSITIVE\ldapUserPassword;


Write-Output "`n---------------------------";
Write-Output "Docker Swarm secrets have been created successfully`n";
Write-Output "**************************************************`n`n";
