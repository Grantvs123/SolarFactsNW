
<#
.SYNOPSIS
    Uninstall SolarFactsNW Windows Service
.DESCRIPTION
    This script safely removes the SolarFactsNW Windows service
.NOTES
    Must be run as Administrator
#>

param(
    [string]$ServiceName = "SolarFactsNW"
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Right-click and select 'Run as Administrator'"
    exit 1
}

Write-Host "SolarFactsNW Service Removal Script" -ForegroundColor Red
Write-Host "===================================" -ForegroundColor Red

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if (-not $service) {
    Write-Host "Service '$ServiceName' not found. Nothing to remove." -ForegroundColor Yellow
    exit 0
}

Write-Host "Found service: $ServiceName" -ForegroundColor Yellow
Write-Host "Status: $($service.Status)" -ForegroundColor Yellow

# Stop the service if running
if ($service.Status -eq 'Running') {
    Write-Host "`nStopping service..." -ForegroundColor Cyan
    try {
        Stop-Service -Name $ServiceName -Force -ErrorAction Stop
        Write-Host "✓ Service stopped" -ForegroundColor Green
    } catch {
        Write-Warning "Could not stop service: $_"
    }
}

# Remove the service
Write-Host "`nRemoving service..." -ForegroundColor Cyan
try {
    # Try NSSM first if available
    $nssmPath = Get-Command "nssm.exe" -ErrorAction SilentlyContinue
    if ($nssmPath) {
        & nssm remove $ServiceName confirm
        Write-Host "✓ Service removed with NSSM" -ForegroundColor Green
    } else {
        # Use sc.exe
        sc.exe delete $ServiceName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Service removed with sc.exe" -ForegroundColor Green
        } else {
            throw "sc.exe delete failed with exit code $LASTEXITCODE"
        }
    }
} catch {
    Write-Error "Failed to remove service: $_"
    exit 1
}

# Clean up service batch file if it exists
$programFilesPath = "${env:ProgramFiles}\SolarFactsNW"
$batchPath = "${programFilesPath}\service-start.bat"
if (Test-Path $batchPath) {
    try {
        Remove-Item $batchPath -Force
        Write-Host "✓ Cleaned up service batch file" -ForegroundColor Green
    } catch {
        Write-Warning "Could not remove batch file: $_"
    }
}

Write-Host "`n" -ForegroundColor Green
Write-Host "Service removal completed!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "The SolarFactsNW service has been removed from Windows." -ForegroundColor White
Write-Host "User data remains in: ${env:LOCALAPPDATA}\SolarFactsNW" -ForegroundColor White
Write-Host "`nYou can now run Node-RED manually if needed:" -ForegroundColor Yellow
Write-Host "node-red --userDir `"${env:LOCALAPPDATA}\SolarFactsNW`"" -ForegroundColor White
