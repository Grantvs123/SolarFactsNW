
; SolarFactsNW Windows Installer Script
; Created with Inno Setup 6.x
; Targets Windows 10/11 x64

#define MyAppName "SolarFactsNW"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "SolarFactsNW Team"
#define MyAppURL "https://github.com/solarfactsnw/solarfactsnw"
#define MyAppExeName "start_solarfactsnw.bat"
#define MyAppDescription "Solar Facts Northwest - Solar Panel Information System"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
AppId={{8B5F2A1C-9D3E-4F7A-B8C6-1E2F3A4B5C6D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=license.txt
InfoBeforeFile=readme.txt
OutputDir=.
OutputBaseFilename=SolarFactsNW-Setup-v{#MyAppVersion}
SetupIconFile=
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64
MinVersion=10.0
PrivilegesRequired=admin
UninstallDisplayIcon={app}\{#MyAppExeName}
UninstallDisplayName={#MyAppName} {#MyAppVersion}
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppDescription}
VersionInfoCopyright=Copyright (C) 2025 {#MyAppPublisher}

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1

[Files]
; Main application files (exclude node_modules, .git, dist)
Source: "..\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*,dist\*,.git\*,*.log,*.tmp"
; Preserve user's .env.local file if it exists
Source: "..\.env.local"; DestDir: "{app}"; Flags: onlyifdoesntexist uninsneveruninstall ignoreversion; Check: FileExists(ExpandConstant('{src}\.env.local'))
; Launcher script
Source: "start_solarfactsnw.bat"; DestDir: "{app}"; Flags: ignoreversion
; Documentation
Source: "license.txt"; DestDir: "{app}"; Flags: ignoreversion
Source: "readme.txt"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Comment: "{#MyAppDescription}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon; Comment: "{#MyAppDescription}"
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: quicklaunchicon; Comment: "{#MyAppDescription}"

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent shellexec

[UninstallDelete]
Type: filesandordirs; Name: "{app}\node_modules"
Type: filesandordirs; Name: "{app}\.git"
Type: files; Name: "{app}\*.log"
Type: files; Name: "{app}\*.tmp"

[Code]
//------------------------------------------------------------------------------
// EXTERNAL DECLARATIONS FOR NODE.JS VERSION CHECKING
//------------------------------------------------------------------------------
function GetFileVersionInfoSizeA(
  lpstrFilename: AnsiString;
  var lpdwHandle: Cardinal
): Cardinal;
  external 'GetFileVersionInfoSizeA@version.dll stdcall';

function GetFileVersionInfoA(
  lpstrFilename: AnsiString;
  dwHandle: Cardinal;
  dwLen: Cardinal;
  lpData: Pointer
): Boolean;
  external 'GetFileVersionInfoA@version.dll stdcall';

function VerQueryValueA(
  pBlock: Pointer;
  lpSubBlock: AnsiString;
  var lplpBuffer: Pointer;
  var puLen: Cardinal
): Boolean;
  external 'VerQueryValueA@version.dll stdcall';

//------------------------------------------------------------------------------
// VARIABLES AND CONSTANTS
//------------------------------------------------------------------------------
var
  NodeCheckDone: Boolean;
  NodeOk: Boolean;

const
  MinNodeVersion = '14.0.0.0';

//------------------------------------------------------------------------------
// HELPER FUNCTIONS
//------------------------------------------------------------------------------
function VersionToArray(const V: String; var A: array of Cardinal): Boolean;
var
  Parts: TArrayOfString;
  I: Integer;
begin
  Parts := SplitString(V, '.');
  if GetArrayLength(Parts) <> 4 then
  begin
    Result := False;
    Exit;
  end;
  for I := 0 to 3 do
    if not TryStrToInt(Parts[I], Cardinal(A[I])) then
    begin
      Result := False;
      Exit;
    end;
  Result := True;
end;

function CompareVersions(const V1, V2: String): Integer;
var
  A1, A2: array [0..3] of Cardinal;
  I: Integer;
begin
  if not VersionToArray(V1, A1) or not VersionToArray(V2, A2) then
  begin
    Result := -1;
    Exit;
  end;
  for I := 0 to 3 do
    if A1[I] <> A2[I] then
    begin
      if A1[I] > A2[I] then Result := 1 else Result := -1;
      Exit;
    end;
  Result := 0;
end;

function GetFileVersion(const FileName: String; var outVersion: String): Boolean;
var
  Size, Dummy: Cardinal;
  Block: Pointer;
  FixedInfo: PVSFixedFileInfo;
  FixedInfoLen: Cardinal;
begin
  Result := False;
  Size := GetFileVersionInfoSizeA(AnsiString(FileName), Dummy);
  if Size = 0 then
    Exit;

  Block := AllocateMemory(Size);
  try
    if not GetFileVersionInfoA(AnsiString(FileName), 0, Size, Block) then
      Exit;
    if not VerQueryValueA(Block, '\', Pointer(FixedInfo), FixedInfoLen) then
      Exit;
    outVersion := 
      IntToStr(HiWord(FixedInfo.dwFileVersionMS)) + '.' +
      IntToStr(LoWord(FixedInfo.dwFileVersionMS)) + '.' +
      IntToStr(HiWord(FixedInfo.dwFileVersionLS)) + '.' +
      IntToStr(LoWord(FixedInfo.dwFileVersionLS));
    Result := True;
  finally
    FreeMemory(Block);
  end;
end;

function IsNodeJsInstalled(out NodeExePath: String): Boolean;
var
  InstallPath: String;
begin
  if RegQueryStringValue(HKEY_LOCAL_MACHINE, 'SOFTWARE\Node.js', 'InstallPath', InstallPath) then
  begin
    NodeExePath := AddBackslash(InstallPath) + 'node.exe';
    Result := FileExists(NodeExePath);
    Exit;
  end;
  if RegQueryStringValue(HKEY_CURRENT_USER, 'SOFTWARE\Node.js', 'InstallPath', InstallPath) then
  begin
    NodeExePath := AddBackslash(InstallPath) + 'node.exe';
    Result := FileExists(NodeExePath);
    Exit;
  end;
  Result := False;
end;

function CheckNodeJsInstalledAndVersion: Boolean;
var
  NodePath, Ver: String;
  cmp: Integer;
begin
  if NodeCheckDone then
  begin
    Result := NodeOk;
    Exit;
  end;

  NodeCheckDone := True;
  NodeOk := False;

  if not IsNodeJsInstalled(NodePath) then
  begin
    if MsgBox('Node.js was not found on this machine.' + #13#10 + 
              'SolarFactsNW requires Node.js version 14.0 or higher to run.' + #13#10#13#10 +
              'Would you like to continue the installation anyway?' + #13#10 +
              '(You will need to install Node.js manually before running SolarFactsNW)',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      NodeOk := True;
      Result := True;
    end
    else
      Result := False;
    Exit;
  end;

  if not GetFileVersion(NodePath, Ver) then
  begin
    MsgBox('Unable to read Node.js version information from:' + #13#10 + NodePath + #13#10#13#10 +
           'Installation will continue, but please verify your Node.js version manually.',
           mbInformation, MB_OK);
    NodeOk := True;
    Result := True;
    Exit;
  end;

  cmp := CompareVersions(Ver, MinNodeVersion);
  if cmp < 0 then
  begin
    if MsgBox('Detected Node.js version ' + Ver + ',' + #13#10 +
              'but SolarFactsNW requires version 14.0 or higher.' + #13#10#13#10 +
              'Would you like to continue the installation anyway?' + #13#10 +
              '(You may need to upgrade Node.js before running SolarFactsNW)',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      NodeOk := True;
      Result := True;
    end
    else
      Result := False;
    Exit;
  end;

  NodeOk := True;
  Result := True;
end;

//------------------------------------------------------------------------------
// SETUP EVENT HANDLERS
//------------------------------------------------------------------------------
function InitializeSetup(): Boolean;
begin
  Result := CheckNodeJsInstalledAndVersion;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Show information about next steps
    MsgBox('Installation completed successfully!' + #13#10#13#10 +
           'Before running SolarFactsNW:' + #13#10 +
           '1. Navigate to the installation folder: ' + ExpandConstant('{app}') + #13#10 +
           '2. Run "npm install" to install dependencies' + #13#10 +
           '3. Configure your .env.local file if needed' + #13#10 +
           '4. Use the desktop shortcut or Start Menu to launch the application' + #13#10#13#10 +
           'For detailed setup instructions, see the readme.txt file in the installation folder.',
           mbInformation, MB_OK);
  end;
end;
