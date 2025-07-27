# SolarFactsNW AI PatchBay System

## Phase 4D Complete - Live API Mode Ready

This repository contains the complete SolarFactsNW AI PatchBay system with Phase 4D implementation including:

- ✅ Live API integration framework
- ✅ Comprehensive fallback systems  
- ✅ Node-RED flow automation
- ✅ MySQL database integration
- ✅ Lead scoring and routing system
- ✅ Multi-channel communication support

## System Status
- **Current Phase**: 4D Complete
- **API Mode**: Live (TEST_MODE=0)
- **Database**: MySQL configured with fallbacks
- **Node-RED**: Localhost:1880
- **Commit**: a833885f15258e575cb1d33144b694637c1ee130

## Key Components
- AI PatchBay core flows preserved
- SolarFactsNW vertical integration
- API wrapper with intelligent fallbacks
- Comprehensive logging and monitoring
- Security-first credential management

## Windows Installation & Permissions Fix

### Common Issue: EPERM Permission Error

If you encounter this error when running the Windows application:
```
Error: EPERM: operation not permitted, copyfile 'C:\Program Files\SolarFactsNW\.config.nodes.json' -> 'C:\Program Files\SolarFactsNW\.config.nodes.json.backup'
```

This occurs because Node-RED cannot write to the protected Program Files directory. Here's how to fix it:

### Quick Fix (Recommended)

1. **Run the Permission Fix Script** (as Administrator):
   ```powershell
   # Navigate to the SolarFactsNW installation directory
   cd "C:\Program Files\SolarFactsNW"
   
   # Run the permission fix script
   PowerShell -ExecutionPolicy Bypass -File "scripts\fix-permissions.ps1"
   ```

2. **What this script does**:
   - Creates a user-writable data directory in `%LOCALAPPDATA%\SolarFactsNW`
   - Copies existing configuration files from Program Files
   - Sets proper NTFS permissions
   - Updates the Windows service configuration
   - Creates a desktop shortcut with correct parameters

### Manual Fix (Alternative)

If you prefer to fix the issue manually:

1. **Create User Data Directory**:
   ```cmd
   mkdir "%LOCALAPPDATA%\SolarFactsNW"
   mkdir "%LOCALAPPDATA%\SolarFactsNW\logs"
   mkdir "%LOCALAPPDATA%\SolarFactsNW\context"
   ```

2. **Copy Configuration Files** (if they exist):
   ```cmd
   copy "C:\Program Files\SolarFactsNW\flows.json" "%LOCALAPPDATA%\SolarFactsNW\"
   copy "C:\Program Files\SolarFactsNW\.config.*.json" "%LOCALAPPDATA%\SolarFactsNW\"
   copy "C:\Program Files\SolarFactsNW\settings.js" "%LOCALAPPDATA%\SolarFactsNW\"
   ```

3. **Run with User Directory Parameter**:
   ```cmd
   cd "C:\Program Files\SolarFactsNW"
   node-red --userDir "%LOCALAPPDATA%\SolarFactsNW"
   ```

### Windows Service Management

The application can run as a Windows service for automatic startup:

- **Create Service**: Run `scripts\create-service.ps1` as Administrator
- **Remove Service**: Run `scripts\uninstall-service.ps1` as Administrator
- **Manual Service Control**: Use `services.msc` or:
  ```cmd
  net start SolarFactsNW
  net stop SolarFactsNW
  ```

### Troubleshooting

**Common Issues:**

1. **"Access Denied" errors**: Ensure you're running PowerShell as Administrator
2. **Service won't start**: Check the log file at `%LOCALAPPDATA%\SolarFactsNW\logs\service.log`
3. **Port 1880 already in use**: Stop any existing Node-RED instances or change the port in settings.js

**File Locations After Fix:**
- **Application Files**: `C:\Program Files\SolarFactsNW\` (read-only)
- **User Data**: `%LOCALAPPDATA%\SolarFactsNW\` (writable)
- **Logs**: `%LOCALAPPDATA%\SolarFactsNW\logs\`
- **Configuration**: `%LOCALAPPDATA%\SolarFactsNW\settings.js`

**Verification:**
After running the fix, you should see:
- No permission errors when starting the application
- Log files being created in the user data directory
- Web interface accessible at `http://localhost:1880`

## Technical Details

- **Node-RED Version**: 4.0.9+
- **Node.js Version**: 20.18.0+
- **Default Port**: 1880
- **Dashboard URL**: `/api/ui`

## Support

For issues and support:
1. Check the troubleshooting section above
2. Review log files in `%LOCALAPPDATA%\SolarFactsNW\logs\`
3. Create an issue in this repository with error details

## Security Notes

- The permission fix moves user data to a secure, user-writable location
- Application files remain protected in Program Files
- Service runs with minimal required permissions
- No sensitive data is stored in world-readable locations

Last Updated: July 25, 2025
