@echo off
setlocal

cd /d "%~dp0"
if "%~1"=="-SkipDeploy" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pages-deploy-fixed.ps1" -SkipDeploy
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pages-deploy-fixed.ps1"
)

if errorlevel 1 (
  echo.
  echo [deploy] failed. See output above.
  pause
  exit /b 1
)

echo.
echo [deploy] completed.
pause
exit /b 0
