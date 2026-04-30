@echo off
set "CMD=%1"
set "FILEPATH=%2"

REM ====== Paths ======
set "BASE_DIR=%~dp0"

set "JAVA_COMPILER=%BASE_DIR%Main.jar"
set "NODE_COMPILER=%BASE_DIR%backend\cli.js"

REM ====== Commands ======
if "%CMD%"=="parse" (
    java -jar "%JAVA_COMPILER%" "%FILEPATH%"

) else if "%CMD%"=="compile" (
    node "%NODE_COMPILER%" "%FILEPATH%"

) else (
    echo Unknown command: %CMD%
    echo.
    echo Usage:
    echo   lisa parse ^<file_path^>
    echo   lisa compile ^<file_path^>
)