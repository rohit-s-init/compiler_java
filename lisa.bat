@echo off
set "CMD=%1"
set "FILEPATH=%2"

REM ====== Paths ======
set "JAVA_COMPILER=E:\compiler\Main.jar"
set "NODE_COMPILER=E:\compiler\backend\cli.js"

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