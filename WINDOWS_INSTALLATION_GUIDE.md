# SolarFactsNW Windows Installation & Permissions Guide

## Overview

This guide provides comprehensive instructions for installing and configuring SolarFactsNW on Windows systems, with special focus on resolving the common EPERM permission error that occurs when Node-RED tries to write to the Program Files directory.

## The Permission Problem

When SolarFactsNW is installed in `C:\Program Files\SolarFactsNW\`, Windows security restrictions prevent Node-RED from creating or modifying configuration files. This results in the error:

```
Error: EPERM: operation not permitted, copyfile 'C:\Program Files\SolarFactsNW\.config.nodes.json' -> 'C:\Program Files\SolarFactsNW\.config.nodes.json.backup'
```

## Solution Overview

The solution involves:
1. Moving user data to a writable location (`%LOCALAPPDATA%\SolarFactsNW`)
2. Configuring Node-RED to use the new user directory
3. Setting up proper Windows service configuration
4. Maintaining security best practices

## Quick Installation & Fix

### Step 1: Install SolarFactsNW
1. Download `SolarFactsNW-Setup-1.0.0.exe`
2. Right-click and select "Run as Administrator"
3. Follow the installation wizard
4. **Do not start the application yet**

### Step 2: Run Permission Fix Script
1. Open PowerShell as Administrator:
   - Press `Win + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. Navigate to installation directory:
   ```powershell
   cd "C:\Program Files\SolarFactsNW"
   ```

3. Run the permission fix script:
   ```powershell
   PowerShell -ExecutionPolicy Bypass -File "scripts\fix-permissions.ps1"
   ```

4. The script will:
   - Create `%LOCALAPPDATA%\SolarFactsNW` directory structure
   - Copy existing configuration files
   - Set proper NTFS permissions
   - Update Windows service configuration
   - Create a desktop shortcut

### Step 3: Verify Installation
1. Check that the service is running:
   ```cmd
   sc query SolarFactsNW
   ```

2. Open web browser and navigate to:
   ```
   http://localhost:1880
   ```

3. You should see the Node-RED interface without permission errors

## Manual Installation (Alternative Method)

If you prefer to configure everything manually:

### Step 1: Create User Data Directory
```cmd
mkdir "%LOCALAPPDATA%\SolarFactsNW"
mkdir "%LOCALAPPDATA%\SolarFactsNW\logs"
mkdir "%LOCALAPPDATA%\SolarFactsNW\context"
mkdir "%LOCALAPPDATA%\SolarFactsNW\backup"
```

### Step 2: Copy Configuration Files
```cmd
# Copy existing flows and configuration (if they exist)
copy "C:\Program Files\SolarFactsNW\flows.json" "%LOCALAPPDATA%\SolarFactsNW\" 2>nul
copy "C:\Program Files\SolarFactsNW\flows_cred.json" "%LOCALAPPDATA%\SolarFactsNW\" 2>nul
copy "C:\Program Files\SolarFactsNW\.config.*.json" "%LOCALAPPDATA%\SolarFactsNW\" 2>nul
copy "C:\Program Files\SolarFactsNW\package.json" "%LOCALAPPDATA%\SolarFactsNW\" 2>nul

# Copy the updated settings.js
copy "C:\Program Files\SolarFactsNW\settings.js" "%LOCALAPPDATA%\SolarFactsNW\"
```

### Step 3: Set Permissions
```cmd
# Grant full control to Users group
icacls "%LOCALAPPDATA%\SolarFactsNW" /grant "*S-1-5-32-545:(OI)(CI)F" /T /Q

# Grant full control to current user
icacls "%LOCALAPPDATA%\SolarFactsNW" /grant "%USERNAME%:(OI)(CI)F" /T /Q
```

### Step 4: Run Node-RED with User Directory
```cmd
cd "C:\Program Files\SolarFactsNW"
node-red --userDir "%LOCALAPPDATA%\SolarFactsNW"
```

## Windows Service Configuration

### Using the Automated Script

Run as Administrator:
```powershell
PowerShell -ExecutionPolicy Bypass -File "scripts\create-service.ps1"
```

### Manual Service Creation with NSSM

1. Download NSSM from https://nssm.cc/
2. Extract to `C:\Tools\nssm\`
3. Run as Administrator:
   ```cmd
   C:\Tools\nssm\nssm.exe install SolarFactsNW "%APPDATA%\npm\node-red.cmd"
   C:\Tools\nssm\nssm.exe set SolarFactsNW AppParameters "--userDir \"%LOCALAPPDATA%\SolarFactsNW\""
   C:\Tools\nssm\nssm.exe set SolarFactsNW AppDirectory "C:\Program Files\SolarFactsNW"
   C:\Tools\nssm\nssm.exe set SolarFactsNW DisplayName "SolarFactsNW Node-RED Service"
   C:\Tools\nssm\nssm.exe set SolarFactsNW Description "Solar Facts Northwest Dashboard Service"
   C:\Tools\nssm\nssm.exe set SolarFactsNW Start SERVICE_AUTO_START
   ```

4. Start the service:
   ```cmd
   net start SolarFactsNW
   ```

### Manual Service Creation with sc.exe

```cmd
# Create batch file for service
echo @echo off > "C:\Program Files\SolarFactsNW\service-start.bat"
echo cd /d "C:\Program Files\SolarFactsNW" >> "C:\Program Files\SolarFactsNW\service-start.bat"
echo node-red --userDir "%LOCALAPPDATA%\SolarFactsNW" >> "C:\Program Files\SolarFactsNW\service-start.bat"

# Create service
sc create SolarFactsNW binPath= "C:\Program Files\SolarFactsNW\service-start.bat" DisplayName= "SolarFactsNW Node-RED Service" start= auto
sc description SolarFactsNW "Solar Facts Northwest Dashboard Service"
sc config SolarFactsNW obj= "LocalSystem"

# Start service
net start SolarFactsNW
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Access Denied" when running scripts
**Problem**: PowerShell execution policy prevents script execution
**Solution**: 
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser
# Or run with: PowerShell -ExecutionPolicy Bypass -File "script.ps1"
```

#### 2. Service fails to start
**Problem**: Service configuration or permissions issue
**Solution**: 
1. Check service logs: `%LOCALAPPDATA%\SolarFactsNW\logs\service.log`
2. Verify Node-RED is installed globally: `node-red --version`
3. Test manual startup: `node-red --userDir "%LOCALAPPDATA%\SolarFactsNW"`

#### 3. Port 1880 already in use
**Problem**: Another Node-RED instance or service is using port 1880
**Solution**: 
1. Find and stop conflicting process: `netstat -ano | findstr :1880`
2. Or change port in `%LOCALAPPDATA%\SolarFactsNW\settings.js`:
   ```javascript
   uiPort: process.env.PORT || 1881,
   ```

#### 4. Web interface not accessible
**Problem**: Service running but web interface not responding
**Solution**: 
1. Check Windows Firewall settings
2. Verify service status: `sc query SolarFactsNW`
3. Check logs for startup errors
4. Try accessing via `http://127.0.0.1:1880` instead of `localhost`

#### 5. Configuration files not found
**Problem**: Node-RED can't find flows or settings
**Solution**: 
1. Verify files exist in `%LOCALAPPDATA%\SolarFactsNW\`
2. Check file permissions
3. Restart Node-RED service

### Log File Locations

After applying the fix, check these locations for troubleshooting:

- **Service Logs**: `%LOCALAPPDATA%\SolarFactsNW\logs\service.log`
- **Node-RED Logs**: `%LOCALAPPDATA%\SolarFactsNW\logs\node-red.log`
- **Windows Event Logs**: Event Viewer → Windows Logs → Application
- **Service Status**: `services.msc` → SolarFactsNW

### File Structure After Fix

```
C:\Program Files\SolarFactsNW\          # Application files (read-only)
├── node_modules\
├── scripts\
│   ├── fix-permissions.ps1
│   ├── create-service.ps1
│   ├── uninstall-service.ps1
│   └── elevate-launcher.vbs
├── settings.js                         # Template settings
└── [other application files]

%LOCALAPPDATA%\SolarFactsNW\            # User data (writable)
├── flows.json                          # Node-RED flows
├── flows_cred.json                     # Encrypted credentials
├── settings.js                         # Active settings
├── package.json                        # Installed packages
├── logs\
│   ├── node-red.log
│   └── service.log
├── context\                            # Context storage
└── backup\                             # Configuration backups
```

## Security Considerations

### Best Practices Applied

1. **Principle of Least Privilege**: Application files remain in protected Program Files directory
2. **User Data Separation**: User-modifiable data moved to appropriate user directory
3. **Service Account**: Service runs with minimal required permissions
4. **File Permissions**: NTFS permissions set to allow only necessary access
5. **Credential Protection**: Sensitive data encrypted and stored securely

### Security Notes

- The fix does not compromise Windows security
- Application files remain protected from modification
- User data is stored in standard Windows user directories
- Service runs with LocalSystem account (can be changed to dedicated service account)
- No world-readable sensitive files are created

## Uninstallation

### Remove Service
```powershell
PowerShell -ExecutionPolicy Bypass -File "scripts\uninstall-service.ps1"
```

### Manual Service Removal
```cmd
net stop SolarFactsNW
sc delete SolarFactsNW
```

### Clean Up User Data (Optional)
```cmd
rmdir /s /q "%LOCALAPPDATA%\SolarFactsNW"
```

### Uninstall Application
Use Windows "Add or Remove Programs" or run the uninstaller from the installation directory.

## Advanced Configuration

### Custom Port Configuration

Edit `%LOCALAPPDATA%\SolarFactsNW\settings.js`:
```javascript
module.exports = {
    uiPort: process.env.PORT || 8080,  // Change from 1880 to 8080
    // ... other settings
}
```

### Custom User Directory

To use a different user directory location:
```cmd
node-red --userDir "D:\MyNodeRedData\SolarFactsNW"
```

### Multiple Instances

To run multiple instances:
1. Create separate user directories
2. Use different ports
3. Create separate services with unique names

## Support and Resources

### Getting Help

1. **Check Logs**: Always check log files first
2. **Verify Configuration**: Ensure all paths and permissions are correct
3. **Test Manual Startup**: Try running Node-RED manually before using service
4. **Windows Event Viewer**: Check for system-level errors

### Useful Commands

```cmd
# Check service status
sc query SolarFactsNW

# View service configuration
sc qc SolarFactsNW

# Check port usage
netstat -ano | findstr :1880

# Test Node-RED manually
cd "C:\Program Files\SolarFactsNW"
node-red --userDir "%LOCALAPPDATA%\SolarFactsNW" --verbose

# Check Node-RED version
node-red --version

# List installed Node-RED nodes
npm list --depth=0 --prefix "%LOCALAPPDATA%\SolarFactsNW"
```

### Additional Resources

- [Node-RED Documentation](https://nodered.org/docs/)
- [Windows Service Management](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/sc-create)
- [NSSM Documentation](https://nssm.cc/usage)
- [PowerShell Execution Policies](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies)

---

**Last Updated**: July 25, 2025  
**Version**: 1.0.0  
**Compatibility**: Windows 10/11, Windows Server 2016+
