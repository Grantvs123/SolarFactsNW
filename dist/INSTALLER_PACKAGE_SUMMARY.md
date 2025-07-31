# SolarFactsNW Windows Installer Package

## 📦 Package Overview

This package contains everything needed to create a professional Windows EXE installer for SolarFactsNW using Inno Setup. The installer targets Windows 10/11 x64 systems and provides a complete installation experience with Node.js detection, configuration preservation, and proper Windows integration.

## 🎯 Key Features

### ✅ Complete Installation System
- **Professional UI**: Modern wizard-style interface with resizable windows
- **Smart File Handling**: Copies all necessary files while excluding development artifacts
- **Configuration Preservation**: Keeps existing `.env.local` files during updates
- **Windows Integration**: Creates Start Menu shortcuts, optional desktop shortcuts
- **Clean Uninstall**: Removes all files while preserving user configurations

### ✅ Node.js Integration
- **Version Detection**: Automatically detects installed Node.js version
- **Compatibility Check**: Warns if Node.js version is below 14.0
- **Graceful Handling**: Allows installation to continue with user confirmation
- **Registry Scanning**: Checks both system-wide and user-specific Node.js installations

### ✅ Professional Polish
- **Versioned Output**: Creates `SolarFactsNW-Setup-v1.0.0.exe`
- **License Integration**: Displays MIT license during installation
- **Comprehensive Documentation**: Includes detailed readme with setup instructions
- **Metadata Complete**: Full version info, company details, and descriptions

## 📁 Package Contents

| File | Purpose | Size |
|------|---------|------|
| `SolarFactsNW.iss` | Main Inno Setup script with all configurations | 12K |
| `license.txt` | MIT license displayed during installation | 4K |
| `readme.txt` | User documentation shown before installation | 4K |
| `start_solarfactsnw.bat` | Windows launcher script with error handling | 4K |
| `BUILD_INSTRUCTIONS.txt` | Complete compilation and testing guide | 8K |
| `INSTALLER_PACKAGE_SUMMARY.md` | This overview document | - |

## 🚀 Quick Start Guide

### For Developers (Creating the Installer)

1. **Install Inno Setup**
   ```
   Download from: https://jrsoftware.org/isinfo.php
   Install version 6.x or later
   ```

2. **Prepare Files**
   ```
   Copy this dist/ folder to your Windows PC
   Place inside your SolarFactsNW project directory
   ```

3. **Compile Installer**
   ```
   Open Inno Setup Compiler
   Load: SolarFactsNW.iss
   Press F9 to compile
   Output: SolarFactsNW-Setup-v1.0.0.exe
   ```

### For End Users (Installing SolarFactsNW)

1. **Run Installer**
   - Double-click `SolarFactsNW-Setup-v1.0.0.exe`
   - Follow the installation wizard
   - Choose installation options

2. **Complete Setup**
   ```cmd
   cd "C:\Program Files\SolarFactsNW"
   npm install
   ```

3. **Launch Application**
   - Use desktop shortcut (if created)
   - Or Start Menu → SolarFactsNW

## 🔧 Technical Specifications

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **Runtime**: Node.js 14.0+ (detected automatically)
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB free space
- **Network**: Internet connection for full functionality

### Installation Details
- **Target Directory**: `C:\Program Files\SolarFactsNW`
- **Shortcuts**: Start Menu + optional Desktop
- **Registry**: Proper Windows integration for Add/Remove Programs
- **Permissions**: Requires Administrator privileges for installation

### File Handling
- **Included**: All source files, documentation, scripts
- **Excluded**: `node_modules/`, `.git/`, `dist/`, temporary files
- **Preserved**: `.env.local` configuration files
- **Generated**: Windows-compatible launcher script

## 🛡️ Security & Reliability

### Code Signing Ready
The installer is prepared for code signing with:
- Complete version information
- Publisher details
- Professional metadata
- Digital signature support (certificate required)

### Error Handling
- **Node.js Missing**: User-friendly warning with options to continue
- **Version Conflicts**: Clear messaging about compatibility requirements
- **Permission Issues**: Proper elevation requests and error messages
- **Installation Failures**: Detailed logging and rollback capabilities

### Update Support
- **In-Place Updates**: Preserves user configurations during upgrades
- **Version Detection**: Handles existing installations gracefully
- **Backup Strategy**: Protects user data during update process

## 📋 Testing Checklist

Before distributing the installer, verify:

- [ ] Installer compiles without errors
- [ ] Installation completes on clean Windows system
- [ ] Node.js detection works correctly
- [ ] Start Menu shortcuts function properly
- [ ] Desktop shortcut works (if selected)
- [ ] Application launches after installation
- [ ] `npm install` completes successfully
- [ ] Configuration files are preserved during updates
- [ ] Uninstaller removes all files except user configs
- [ ] Windows Add/Remove Programs integration works

## 🔄 Customization Guide

### Version Updates
```ini
#define MyAppVersion "1.0.0"  ; Update this line
```

### Company Branding
```ini
#define MyAppPublisher "Your Company Name"
#define MyAppURL "https://your-website.com"
```

### Node.js Requirements
```pascal
const MinNodeVersion = '14.0.0.0';  ; Minimum required version
```

### Installation Directory
```ini
DefaultDirName={autopf}\{#MyAppName}  ; Default: Program Files
```

## 📞 Support Information

### For Installation Issues
- Check BUILD_INSTRUCTIONS.txt for detailed troubleshooting
- Verify Node.js installation and version
- Run installer as Administrator if needed
- Review Windows Event Logs for detailed error information

### For Application Issues
- Visit: https://github.com/solarfactsnw/solarfactsnw
- Check existing issues or create new ones
- Include installer version and system information

### For Development Questions
- Review Inno Setup documentation: https://jrsoftware.org/ishelp/
- Check Pascal scripting reference for advanced customizations
- Test changes on clean Windows systems before distribution

## 🎉 Success Metrics

This installer package delivers:

✅ **Professional Experience**: Modern UI with proper Windows integration  
✅ **Robust Installation**: Handles edge cases and provides clear feedback  
✅ **User-Friendly**: Clear documentation and intuitive setup process  
✅ **Developer-Ready**: Complete build instructions and customization options  
✅ **Enterprise-Quality**: Code signing ready with comprehensive metadata  

---

**Package Created**: July 28, 2025  
**Inno Setup Version**: 6.x compatible  
**Target Platform**: Windows 10/11 x64  
**Package Version**: 1.0.0
