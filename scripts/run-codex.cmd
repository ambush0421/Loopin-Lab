@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-codex.ps1" %*
