@echo off
title MongoLearn AI - Instalador de Entorno
color 0A
cd /d "%~dp0"
echo =======================================================
echo  MONGOLEARN AI - SETUP SCRIPT
echo =======================================================
echo.
echo Comprobando requisitos del sistema...
echo.

:: 1. Comprobar Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js no detectado.
    echo Node.js es fundamental para correr NextJS y el servidor web local.
    echo Por favor, instala Node.js v18+ desde https://nodejs.org/
    pause
    exit /b
)
echo [OK] Node.js detectado.

:: 2. Comprobar Mongosh
where mongosh >nul 2>nul
if %ERRORLEVEL% neq 0 (
    color 0E
    echo [ADVERTENCIA] mongosh no detectado en las variables de entorno PATH.
    echo Para que los comandos a la base de datos funcionen, debes tener instalada
    echo la consola 'mongosh' de MongoDB.
    echo Por favor descargala desde: https://www.mongodb.com/try/download/shell
    echo E incluyela en el PATH de Windows como se indica en el README.md.
    echo Si ya lo descargaste y abriste esto por error, ignoralo e instalaremos las dependencias igual.
    pause
) else (
    echo [OK] Consola de MongoDB (mongosh) detectada.
)

:: 3. Python no es necesario
echo [OK] No se requiere instalacion de Python para este proyecto.

echo.
echo =======================================================
echo  INSTALANDO DEPENDENCIAS (NPM INSTALL)
echo =======================================================
call npm install
echo.

:: 4. Crear archivo .env.local de plantilla si no existe
if not exist ".env.local" (
    echo GROQ_API_KEY=tu_clave_de_groq_aqui > ".env.local"
    echo [INFO] Se creo el archivo '.env.local'. Abrelo y coloca tu API Key de Groq.
) else (
    echo [INFO] El archivo '.env.local' ya existe, configuracion conservada.
)

echo.
echo =======================================================
echo  INSTALACION COMPLETADA
echo  Puedes iniciar el servidor ejecutando: iniciar.bat
echo =======================================================
pause
