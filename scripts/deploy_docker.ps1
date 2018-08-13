# https://stackoverflow.com/questions/9948517/how-to-stop-a-powershell-script-on-the-first-error?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

Set-StrictMode -Version latest;
$ErrorActionPreference = "Stop";


# Taken from psake https://github.com/psake/psake
<#
.SYNOPSIS
  This is a helper function that runs a scriptblock and checks the PS variable $lastexitcode
  to see if an error occcured. If an error is detected then an exception is thrown.
  This function allows you to run command-line programs without having to
  explicitly check the $lastexitcode variable.
.EXAMPLE
  exec { svn info $repository_trunk }
#>
function Exec
{
    [CmdletBinding()]
    param( [Parameter(Position=0,Mandatory=1)][scriptblock] $cmd );
    
    & $cmd;

    if ($lastexitcode -ne 0) {
        $errorMessage = ("Error executing command {0}" -f $cmd);    
        throw ("Exec: " + $errorMessage);
        Write-Output "`n**************************************************`n`n";
    }
}

# SCRIPT ENTRY POINT
Try {
    Write-Output "`n`n**************************************************";
    Write-Output "Building docker image ...";
    Exec { docker build -t upsbrowser_ws_api . };
    
    Write-Output "`n---------------------------";
    Write-Output "Tagging the image ...";
    Exec { docker tag upsbrowser_ws_api kc-docker1.kcell.kz:5000/upsbrowser_ws_api };
    
    Write-Output "`n---------------------------";
    Write-Output "Pushing the image to the private registry ...";
    Exec { docker push kc-docker1.kcell.kz:5000/upsbrowser_ws_api };
    
    Write-Output "`n---------------------------";
    Write-Output "Redeploying docker swarm stack ...";
    Exec { docker stack deploy -c docker-compose.yml upsbrowser_ws };

    Write-Output "`n---------------------------";
    Write-Output "Deployment was successful`n";
    Write-Output "**************************************************`n`n";
} Catch {
    $host.SetShouldExit(-1);
    throw;
}