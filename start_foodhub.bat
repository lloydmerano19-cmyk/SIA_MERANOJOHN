@echo off
title FoodHub System Launcher
cd /d "C:\SIA_MERANOJOHN\org.openwms-master"
echo ========================================================
echo       FOODHUB SYSTEM - LAUNCHING SERVER
echo ========================================================
echo.
echo Starting local web server on port 8080...
echo Opening browser automatically...
echo.

:: Automatically open default browser to localhost:8080
start http://localhost:8080

:: Run python server
python -m http.server 8080

pause
