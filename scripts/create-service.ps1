
<#
.SYNOPSIS
    Create Windows Service for SolarFactsNW Node-RED application
.DESCRIPTION
    This script creates a Windows service for SolarFactsNW using NSSM (Non-Sucking Service Manager)
    or the built-in sc.exe command as fallback.
.NOTES
    Must be run as Administrator
#>

param(
    [string]$ServiceName = "SolarFactsNW",
    [string]$ServiceDisplayName = "SolarFactsNW Node-RED Service",
    [string]$ServiceDescription = "Solar Facts Northwest Node-RED Dashboard Service"
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Right-click and select 'Run as Administrator'"
    exit 1
}

Write-Host "SolarFactsNW Service Creation Script" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Define paths
$programFilesPath = "${env:ProgramFiles}\SolarFactsNW"
$userDataPath = "${env:LOCALAPPDATA}\SolarFactsNW"
$nodeRedCmd = "${env:APPDATA}\npm\node-red.cmd"
$logPath = "${userDataPath}\logs\service.log"

# Check if Node-RED is installed globally
if (-not (Test-Path $nodeRedCmd)) {
    $nodeRedCmd = "node-red"  # Fallback to PATH
    Write-Warning "Global Node-RED installation not found in expected location. Using PATH."
}

# Ensure user data directory exists
if (-not (Test-Path $userDataPath)) {
    New-Item -Path $userDataPath -ItemType Directory -Force | Out-Null
    New-Item -Path "${userDataPath}\logs" -ItemType Directory -Force | Out-Null
}

# Check if service already exists
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Service '$ServiceName' already exists. Stopping and removing..." -ForegroundColor Yellow
    
    if ($existingService.Status -eq 'Running') {
        Stop-Service -Name $ServiceName -Force
    }
    
    # Try to remove with sc.exe
    sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# Try to use NSSM first (if available)
$nssmPath = Get-Command "nssm.exe" -ErrorAction SilentlyContinue
if ($nssmPath) {
    Write-Host "Using NSSM to create service..." -ForegroundColor Cyan
    
    try {
        # Install service with NSSM
        & nssm install $ServiceName $nodeRedCmd
        & nssm set $ServiceName AppParameters "--userDir `"$userDataPath`""
        & nssm set $ServiceName AppDirectory $programFilesPath
        & nssm set $ServiceName DisplayName $ServiceDisplayName
        & nssm set $ServiceName Description $ServiceDescription
        & nssm set $ServiceName Start SERVICE_AUTO_START
        & nssm set $ServiceName AppStdout $logPath
        & nssm set $ServiceName AppStderr $logPath
        & nssm set $ServiceName AppRotateFiles 1
        & nssm set $ServiceName AppRotateOnline 1
        & nssm set $ServiceName AppRotateSeconds 86400
        & nssm set $ServiceName AppRotateBytes 1048576
        
        Write-Host "✓ Service created successfully with NSSM" -ForegroundColor Green
    } catch {
        Write-Error "Failed to create service with NSSM: $_"
        exit 1
    }
} else {
    Write-Host "NSSM not found. Using sc.exe to create service..." -ForegroundColor Cyan
    Write-Host "Note: For better service management, consider installing NSSM from https://nssm.cc/" -ForegroundColor Yellow
    
    # Create batch file for service
    $batchPath = "${programFilesPath}\service-start.bat"
    $batchContent = @"
@echo off
cd /d "$programFilesPath"
"$nodeRedCmd" --userDir "$userDataPath" >> "$logPath" 2>&1
"@
    
    try {
        Set-Content -Path $batchPath -Value $batchContent -Force
        
        # Create service with sc.exe
        $result = sc.exe create $ServiceName binPath= "`"$batchPath`"" DisplayName= $ServiceDisplayName start= auto
        if ($LASTEXITCODE -eq 0) {
            sc.exe description $ServiceName $ServiceDescription
            Write-Host "✓ Service created successfully with sc.exe" -ForegroundColor Green
        } else {
            throw "sc.exe create failed with exit code $LASTEXITCODE"
        }
    } catch {
        Write-Error "Failed to create service with sc.exe: $_"
        exit 1
    }
}

# Set service to run as LocalSystem (default) or configure for specific user
Write-Host "`nConfiguring service account..." -ForegroundColor Cyan
try {
    # For now, use LocalSystem. In production, consider using a dedicated service account
    sc.exe config $ServiceName obj= "LocalSystem"
    Write-Host "✓ Service configured to run as LocalSystem" -ForegroundColor Green
} catch {
    Write-Warning "Could not configure service account: $_"
}

# Start the service
Write-Host "`nStarting service..." -ForegroundColor Cyan
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
    Write-Host "✓ Service started successfully" -ForegroundColor Green
    
    # Wait a moment and check status
    Start-Sleep -Seconds 3
    $serviceStatus = Get-Service -Name $ServiceName
    Write-Host "Service Status: $($serviceStatus.Status)" -ForegroundColor $(if ($serviceStatus.Status -eq 'Running') { "Green" } else { "Red" })
    
} catch {
    Write-Warning "Could not start service: $_"
    Write-Host "Check the service logs at: $logPath" -ForegroundColor Yellow
    Write-Host "You can start the service manually from Services.msc" -ForegroundColor Yellow
}

Write-Host "`n" -ForegroundColor Green
Write-Host "Service creation completed!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Service Name: $ServiceName" -ForegroundColor White
Write-Host "Display Name: $ServiceDisplayName" -ForegroundColor White
Write-Host "User Data: $userDataPath" -ForegroundColor White
Write-Host "Log File: $logPath" -ForegroundColor White
Write-Host "Web Interface: http://localhost:1880" -ForegroundColor White
Write-Host "`nUse 'services.msc' to manage the service" -ForegroundColor Yellow
