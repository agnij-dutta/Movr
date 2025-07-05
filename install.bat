@echo off
setlocal enabledelayedexpansion

REM Batch installation script for movr CLI
REM Usage: install.bat

set "VERSION=v1.0.0"
set "GITHUB_REPO=agnij-dutta/Movr"
set "DOWNLOAD_URL=https://github.com/%GITHUB_REPO%/releases/download/%VERSION%/movr-win.exe"
set "INSTALL_DIR=%LOCALAPPDATA%\movr"
set "BINARY_PATH=%INSTALL_DIR%\movr.exe"

echo Downloading movr CLI...
echo URL: %DOWNLOAD_URL%
echo.

REM Create installation directory
if not exist "%INSTALL_DIR%" (
    mkdir "%INSTALL_DIR%"
)

REM Download the binary using PowerShell (available on Windows 7+)
powershell -Command "try { Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%BINARY_PATH%' -UseBasicParsing; Write-Host 'Download successful!' -ForegroundColor Green } catch { Write-Error 'Download failed: ' + $_.Exception.Message; exit 1 }"

if %errorlevel% neq 0 (
    echo Error: Failed to download binary
    pause
    exit /b 1
)

echo.
echo Binary installed at: %BINARY_PATH%

REM Add to PATH
set "CURRENT_PATH="
for /f "tokens=2*" %%i in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%j"

REM Check if already in PATH
echo !CURRENT_PATH! | find /i "%INSTALL_DIR%" >nul
if %errorlevel% neq 0 (
    echo Adding to PATH...
    if defined CURRENT_PATH (
        set "NEW_PATH=%CURRENT_PATH%;%INSTALL_DIR%"
    ) else (
        set "NEW_PATH=%INSTALL_DIR%"
    )
    reg add "HKCU\Environment" /v PATH /t REG_EXPAND_SZ /d "!NEW_PATH!" /f >nul
    if %errorlevel% equ 0 (
        echo PATH updated successfully!
    ) else (
        echo Warning: Could not update PATH automatically
        echo Please add %INSTALL_DIR% to your PATH manually
    )
) else (
    echo Already in PATH
)

echo.
echo Installation complete!
echo Run 'movr --help' to get started!
echo.
echo Note: You may need to restart your terminal for the PATH changes to take effect.
echo.
pause 