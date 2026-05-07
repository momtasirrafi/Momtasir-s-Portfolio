@echo off
cd /d "%~dp0"
echo Starting CodeLab Attendance System...
echo.
echo Keep this window open while using the app.
echo Open http://127.0.0.1:5500/index.html in your browser.
echo.
node server.js
pause
