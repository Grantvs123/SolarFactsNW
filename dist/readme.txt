
SolarFactsNW - Solar Panel Information System
==============================================

Version: 1.0.0
Website: https://github.com/solarfactsnw/solarfactsnw

ABOUT SOLARFACTSNW
------------------
SolarFactsNW is a comprehensive solar panel information system designed to help
users access detailed information about solar installations, efficiency data,
and renewable energy insights for the Pacific Northwest region.

SYSTEM REQUIREMENTS
-------------------
- Windows 10 or Windows 11 (64-bit)
- Node.js 14.0 or higher
- Minimum 4GB RAM
- 500MB free disk space
- Internet connection for full functionality

INSTALLATION NOTES
------------------
This installer will:
- Copy all SolarFactsNW files to C:\Program Files\SolarFactsNW
- Create Start Menu shortcuts
- Optionally create a desktop shortcut
- Preserve your existing .env.local configuration file (if present)
- Check for Node.js installation and version compatibility

FIRST-TIME SETUP
-----------------
After installation, you need to complete these steps:

1. Open Command Prompt or PowerShell as Administrator
2. Navigate to the installation directory:
   cd "C:\Program Files\SolarFactsNW"
3. Install Node.js dependencies:
   npm install
4. Configure your environment (optional):
   - Copy .env.local.example to .env.local
   - Edit .env.local with your specific settings
5. Start the application using the desktop shortcut or Start Menu

RUNNING SOLARFACTSNW
--------------------
- Use the desktop shortcut (if created during installation)
- Use Start Menu > SolarFactsNW > SolarFactsNW
- Or manually run: start_solarfactsnw.bat from the installation folder

The application will start a local web server and open your default browser
to the SolarFactsNW interface.

CONFIGURATION
-------------
The application can be configured by editing the .env.local file in the
installation directory. Common settings include:
- Port number for the web server
- Database connection settings
- API keys for external services
- Logging levels

TROUBLESHOOTING
---------------
Common issues and solutions:

1. "Node.js not found" error:
   - Download and install Node.js from https://nodejs.org
   - Ensure Node.js is added to your system PATH

2. "npm install" fails:
   - Run Command Prompt as Administrator
   - Clear npm cache: npm cache clean --force
   - Try installing again

3. Application won't start:
   - Check that port 3000 (or configured port) is not in use
   - Review the console output for error messages
   - Check the .env.local file for configuration errors

4. Permission errors:
   - Ensure you're running as Administrator when needed
   - Check file permissions in the installation directory

UNINSTALLING
------------
To remove SolarFactsNW:
1. Use Windows "Add or Remove Programs" feature
2. Or run the uninstaller from Start Menu > SolarFactsNW > Uninstall

Note: Your .env.local configuration file will be preserved even after
uninstallation to protect your custom settings.

SUPPORT
-------
For technical support, bug reports, or feature requests:
- Visit: https://github.com/solarfactsnw/solarfactsnw
- Create an issue on the GitHub repository
- Check the documentation in the project repository

UPDATES
-------
To update SolarFactsNW:
1. Download the latest installer
2. Run the new installer (it will update your existing installation)
3. Your configuration files and data will be preserved

Thank you for using SolarFactsNW!
