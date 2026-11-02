@echo off
echo ========================================================
echo Stopping FinSafe Background Servers...
echo ========================================================
echo.

echo Freeing Port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Stopping PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo Freeing Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    echo Stopping PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ========================================================
echo FinSafe servers have been stopped.
echo ========================================================
pause

