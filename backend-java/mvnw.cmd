@REM Maven Wrapper script for Windows
@echo off
setlocal enabledelayedexpansion
set MAVEN_PROJECTBASEDIR=%~dp0
if not "%MAVEN_PROJECTBASEDIR%"=="" set MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

if exist "%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties" (
  for /f "usebackq tokens=1,2 delims==" %%A in ("%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") do (
    if "%%A"=="distributionUrl" set DISTRIBUTION_URL=%%B
  )
)

set MVN_HOME=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9
if not exist "%MVN_HOME%\bin\mvn.cmd" (
  echo Downloading Apache Maven 3.9.9...
  if not exist "%USERPROFILE%\.m2\wrapper\dists" mkdir "%USERPROFILE%\.m2\wrapper\dists"
  powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%TEMP%\apache-maven-3.9.9-bin.zip'; Expand-Archive -Path '%TEMP%\apache-maven-3.9.9-bin.zip' -DestinationPath '%USERPROFILE%\.m2\wrapper\dists' -Force"
)

call "%MVN_HOME%\bin\mvn.cmd" %*
endlocal
