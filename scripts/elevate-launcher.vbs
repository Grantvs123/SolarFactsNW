
' SolarFactsNW UAC Elevation Launcher
' This script provides UAC elevation for the desktop shortcut if needed

Set objShell = CreateObject("Shell.Application")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
strScriptDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strParentDir = objFSO.GetParentFolderName(strScriptDir)

' Path to the PowerShell permission fix script
strPowerShellScript = strParentDir & "\scripts\fix-permissions.ps1"

' Check if the PowerShell script exists
If objFSO.FileExists(strPowerShellScript) Then
    ' Run the PowerShell script with elevation
    objShell.ShellExecute "powershell.exe", "-ExecutionPolicy Bypass -File """ & strPowerShellScript & """", "", "runas", 1
Else
    ' Fallback: try to run Node-RED directly with elevation
    strProgramFiles = objShell.ExpandEnvironmentStrings("%ProgramFiles%")
    strNodeRedPath = strProgramFiles & "\SolarFactsNW"
    strLocalAppData = objShell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
    strUserDir = strLocalAppData & "\SolarFactsNW"
    
    ' Create the command to run Node-RED with proper user directory
    strCommand = "cmd.exe"
    strArgs = "/c ""cd /d """ & strNodeRedPath & """ && node-red --userDir """ & strUserDir & """ && pause"""
    
    ' Run with elevation
    objShell.ShellExecute strCommand, strArgs, strNodeRedPath, "runas", 1
End If
