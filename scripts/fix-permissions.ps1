
<#
.SYNOPSIS
    Fix Windows permissions for SolarFactsNW Node-RED application
.DESCRIPTION
    This script resolves the EPERM permission error by:
    1. Creating a user-writable data directory in LocalAppData
    2. Copying existing configuration files from Program Files
    3. Setting proper NTFS permissions
    4. Restarting the Windows service if it exists
.NOTES
    Must be run as Administrator
#>

param(
    [switch]$Force,
    [string]$ServiceName = "SolarFactsNW"
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator. Right-click and select 'Run as Administrator'"
    exit 1
}

Write-Host "SolarFactsNW Permission Fix Script" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Define paths
$programFilesPath = "${env:ProgramFiles}\SolarFactsNW"
$userDataPath = "${env:LOCALAPPDATA}\SolarFactsNW"
$logsPath = "${userDataPath}\logs"
$contextPath = "${userDataPath}\context"
$backupPath = "${userDataPath}\backup"

Write-Host "Program Files Path: $programFilesPath" -ForegroundColor Yellow
Write-Host "User Data Path: $userDataPath" -ForegroundColor Yellow

# Create user data directories
Write-Host "`nCreating user data directories..." -ForegroundColor Cyan
try {
    New-Item -Path $userDataPath -ItemType Directory -Force | Out-Null
    New-Item -Path $logsPath -ItemType Directory -Force | Out-Null
    New-Item -Path $contextPath -ItemType Directory -Force | Out-Null
    New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
    Write-Host "✓ Directories created successfully" -ForegroundColor Green
} catch {
    Write-Error "Failed to create directories: $_"
    exit 1
}

# Copy existing configuration files from Program Files if they exist
Write-Host "`nCopying existing configuration files..." -ForegroundColor Cyan
$configFiles = @(
    "flows.json",
    "flows_cred.json", 
    ".config.nodes.json",
    ".config.runtime.json",
    ".config.users.json",
    "package.json"
)

foreach ($file in $configFiles) {
    $sourcePath = Join-Path $programFilesPath $file
    $destPath = Join-Path $userDataPath $file
    
    if (Test-Path $sourcePath) {
        try {
            Copy-Item $sourcePath $destPath -Force
            Write-Host "✓ Copied $file" -ForegroundColor Green
        } catch {
            Write-Warning "Could not copy $file : $_"
        }
    }
}

# Copy the updated settings.js to both locations
$settingsSource = Join-Path (Split-Path $PSScriptRoot -Parent) "settings.js"
if (Test-Path $settingsSource) {
    try {
        Copy-Item $settingsSource (Join-Path $userDataPath "settings.js") -Force
        Copy-Item $settingsSource (Join-Path $programFilesPath "settings.js") -Force
        Write-Host "✓ Updated settings.js copied" -ForegroundColor Green
    } catch {
        Write-Warning "Could not copy settings.js: $_"
    }
}

# Set NTFS permissions for the user data directory
Write-Host "`nSetting NTFS permissions..." -ForegroundColor Cyan
try {
    # Grant full control to Users group
    icacls $userDataPath /grant "*S-1-5-32-545:(OI)(CI)F" /T /Q
    # Grant full control to current user
    icacls $userDataPath /grant "${env:USERNAME}:(OI)(CI)F" /T /Q
    Write-Host "✓ Permissions set successfully" -ForegroundColor Green
} catch {
    Write-Warning "Could not set permissions: $_"
}

# Handle Windows service if it exists
Write-Host "`nChecking for Windows service..." -ForegroundColor Cyan
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue

if ($service) {
    Write-Host "Found service: $ServiceName" -ForegroundColor Yellow
    
    # Stop the service
    if ($service.Status -eq 'Running') {
        Write-Host "Stopping service..." -ForegroundColor Yellow
        try {
            Stop-Service -Name $ServiceName -Force -ErrorAction Stop
            Write-Host "✓ Service stopped" -ForegroundColor Green
        } catch {
            Write-Warning "Could not stop service: $_"
        }
    }
    
    # Update service to run with proper user directory parameter
    try {
        $servicePath = (Get-WmiObject win32_service | Where-Object {$_.name -eq $ServiceName}).PathName
        if ($servicePath -and $servicePath -notlike "*--userDir*") {
            # Add userDir parameter to service
            $newPath = $servicePath.TrimEnd('"') + " --userDir `"$userDataPath`""
            sc.exe config $ServiceName binPath= $newPath
            Write-Host "✓ Service updated with userDir parameter" -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not update service path: $_"
    }
    
    # Start the service
    Write-Host "Starting service..." -ForegroundColor Yellow
    try {
        Start-Service -Name $ServiceName -ErrorAction Stop
        Write-Host "✓ Service started successfully" -ForegroundColor Green
    } catch {
        Write-Warning "Could not start service: $_"
        Write-Host "You may need to start the service manually from Services.msc" -ForegroundColor Yellow
    }
} else {
    Write-Host "No Windows service found with name: $ServiceName" -ForegroundColor Yellow
    Write-Host "If you're running Node-RED manually, use this command:" -ForegroundColor Cyan
    Write-Host "node-red --userDir `"$userDataPath`"" -ForegroundColor White
}

# Create a desktop shortcut with proper parameters
Write-Host "`nCreating desktop shortcut..." -ForegroundColor Cyan
try {
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktopPath "SolarFactsNW.lnk"
    
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "cmd.exe"
    $shortcut.Arguments = "/c `"cd /d `"$programFilesPath`" && node-red --userDir `"$userDataPath`" && pause`""
    $shortcut.WorkingDirectory = $programFilesPath
    $shortcut.Description = "SolarFactsNW Node-RED Application"
    $shortcut.Save()
    
    Write-Host "✓ Desktop shortcut created" -ForegroundColor Green
} catch {
    Write-Warning "Could not create desktop shortcut: $_"
}

# Final verification
Write-Host "`nVerification:" -ForegroundColor Cyan
Write-Host "User data directory: $(Test-Path $userDataPath)" -ForegroundColor $(if (Test-Path $userDataPath) { "Green" } else { "Red" })
Write-Host "Settings file: $(Test-Path (Join-Path $userDataPath "settings.js"))" -ForegroundColor $(if (Test-Path (Join-Path $userDataPath "settings.js")) { "Green" } else { "Red" })
Write-Host "Logs directory: $(Test-Path $logsPath)" -ForegroundColor $(if (Test-Path $logsPath) { "Green" } else { "Red" })

Write-Host "`n" -ForegroundColor Green
Write-Host "Permission fix completed!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "The SolarFactsNW application should now run without permission errors." -ForegroundColor White
Write-Host "User data is stored in: $userDataPath" -ForegroundColor White
Write-Host "Access the application at: http://localhost:1880" -ForegroundColor White
Write-Host "`nIf you encounter any issues, check the logs in: $logsPath" -ForegroundColor Yellow
