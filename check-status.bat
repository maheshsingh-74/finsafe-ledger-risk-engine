@echo off
echo ========================================================
echo Checking FinSafe Server Status...
echo ========================================================
echo.

netstat -aon | findstr ":3001" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [ONLINE]  Backend API is running on http://localhost:3001
) else (
    echo [OFFLINE] Backend API is NOT running (Port 3001 free)
)

netstat -aon | findstr ":5173" | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo [ONLINE]  Frontend Dashboard is running on http://localhost:5173
) else (
    echo [OFFLINE] Frontend Dashboard is NOT running (Port 5173 free)
)

echo.
echo ========================================================
pause

