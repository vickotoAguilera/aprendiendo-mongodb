@echo off
echo ========================================================
echo        Iniciando Servidor MongoLearn AI (Port: 3500)
echo ========================================================
echo.
echo Abriendo navegador automaticamente...
timeout /t 3 /nobreak > NUL
start http://localhost:3500
echo Arrancando el entorno local de NextJS...
npm run dev -- -p 3500
