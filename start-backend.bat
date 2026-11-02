@echo off
echo ========================================================
echo Starting FinSafe Backend on http://localhost:3001
echo ========================================================
cd /d "%~dp0backend"
npm run dev
pause
