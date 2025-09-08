@echo off
setlocal ENABLEEXTENSIONS

REM --- 1) Siirry .bat-tiedoston kansioon ---
cd /d "%~dp0"

REM --- 2) Aseta portti (parametrina tai oletus 8000) ---
set "PORT=8000"
if not "%~1"=="" (
  if /I not "%~1"=="debug" set "PORT=%~1"
)

REM --- 3) Debug-tila (kirjoita: start_webserver.bat debug) ---
set "DEBUG=0"
if /I "%~1"=="debug" set "DEBUG=1"
if /I "%~2"=="debug" set "DEBUG=1"

REM --- 4) Etsi Python-komento ---
set "PYCMD="
for %%P in (py.exe python.exe python3.exe) do (
  where %%P >nul 2>&1
  if not errorlevel 1 (
    set "PYCMD=%%P"
    goto :gotpy
  )
)
echo [VIRHE] Pythonia ei loytynyt PATHista (py/python/python3). Asenna Python tai lisaa PATHiin.
echo Paina jotain nappainta sulkeaksesi...
pause >nul
exit /b 1
:gotpy
echo [OK] Kaytetaan: %PYCMD%

REM --- 5) Tapa mahdollinen aiempi palvelin samalla portilla (jos jaa paalle) ---
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do (
  echo [INFO] Suljetaan aiempi prosessi (PID %%a) portissa %PORT%...
  taskkill /PID %%a /F >nul 2>&1
)

REM --- 6) Bind-osoite: 127.0.0.1 vain tälle koneelle (vaihda 0.0.0.0 jos haluat puhelimesta verkon yli) ---
set "BIND=127.0.0.1"
REM set "BIND=0.0.0.0"

REM --- 7) Debug-tila: aja palvelin TASSA samassa ikkunassa, niin naet virheen jos se kosahtaa ---
if "%DEBUG%"=="1" (
  echo [DEBUG] Kaynnistetaan palvelin debug-tilassa. Avaa selain: http://%BIND%:%PORT%/index.html
  "%PYCMD%" -m http.server %PORT% --bind %BIND%
  echo [DEBUG] Palvelin paattyi. Paina nappainta sulkeaksesi...
  pause >nul
  exit /b %errorlevel%
)

REM --- 8) Normaali tila: kaynnista palvelin omaan ikkunaan, joka EI sulkeudu heti (cmd /k) ---
start "HTTP %PORT%" cmd /k "%PYCMD% -m http.server %PORT% --bind %BIND%"

REM --- 9) Pieni viive ja avaa selain (ei curlia, toimii kaikkialla) ---
timeout /t 1 >nul
start "" "http://%BIND%:%PORT%/index.html?v=%random%"

echo [OK] Palvelin kaynnissa: http://%BIND%:%PORT%/
echo Jos selain nayttaa tyhjaa/vanhaa, poista tarvittaessa service worker (DevTools -> Application -> Service Workers -> Unregister).
exit /b 0
