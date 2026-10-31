@echo off
rem Lance le serveur local, puis Chrome en plein ecran sur la borne.
set "HERE=%~dp0"
start "Serveur borne ODEJ" /min node "%HERE%serve.mjs"
timeout /t 2 /nobreak >nul

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

start "" "%CHROME%" --kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --user-data-dir="%HERE%chrome-profile" http://127.0.0.1:4173/
