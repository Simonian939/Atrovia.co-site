@echo off
setlocal
cd /d "C:\Users\Administrator\Atrovia.co-site"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Administrator\Atrovia.co-site\scripts\deploy-now.ps1"
echo.
echo === Log: C:\Users\Administrator\atrovia_deploy_full_output.txt ===
type "C:\Users\Administrator\atrovia_deploy_full_output.txt" 2>nul
pause