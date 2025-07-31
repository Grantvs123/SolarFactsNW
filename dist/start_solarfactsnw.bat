
@echo off
REM SolarFactsNW Launcher Script
REM This script starts the SolarFactsNW application

echo Starting SolarFactsNW...
echo.

REM Change to the directory where this script is located
cd /d "%~dp0"

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not found in PATH.
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo Node.js dependencies not found. Installing...
    echo This may take a few minutes...
    echo.
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies.
        echo Please run 'npm install' manually as Administrator.
        echo.
        pause
        exit /b 1
    )
)

REM Check if package.json exists
if not exist "package.json" (
    echo ERROR: package.json not found.
    echo Please ensure SolarFactsNW is properly installed.
    echo.
    pause
    exit /b 1
)

REM Start the application
echo Starting SolarFactsNW server...
echo The application will open in your default web browser.
echo To stop the server, close this window or press Ctrl+C.
echo.

REM Start the Node.js application
npm start

REM If we get here, the application has stopped
echo.
echo SolarFactsNW has stopped.
pause
