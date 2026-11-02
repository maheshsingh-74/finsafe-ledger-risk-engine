@echo off
echo ========================================================
echo Launching FinSafe Full-Stack Platform...
echo ========================================================
echo.
echo [1/2] Starting FinSafe Backend on http://localhost:3001...
start "FinSafe Backend (Port 3001)" cmd /k "cd /d %~dp0backend && npm run dev"

echo Waiting 4 seconds for backend to start...
timeout /t 4 /nobreak >nul

echo [2/2] Starting FinSafe Frontend on http://localhost:5173...
start "FinSafe Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   FinSafe is now running!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001/health
echo ========================================================
echo Opening http://localhost:5173 in your default browser...
start http://localhost:5173
pause
