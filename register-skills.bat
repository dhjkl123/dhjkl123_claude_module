@echo off
:: register-skills.bat
:: PowerShell 인터랙티브 스크립트를 호출하는 래퍼
:: (CMD에서는 방향키 인터랙션이 불가능하므로 PowerShell로 위임)

powershell -ExecutionPolicy Bypass -File "%~dp0register-skills.ps1"
