@echo off
REM Start both Django and React development servers

echo.
echo ====================================================
echo  Mens Hub - Starting Backend & Frontend
echo ====================================================
echo.

REM Check if we're in the right directory
if not exist "manage.py" (
    echo Error: manage.py not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo [1/2] Starting Django Backend Server on port 8000...
echo.
start "Django Backend - Mens Hub" cmd /k "python manage.py runserver 8000"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak

echo.
echo [2/2] Starting React Frontend Server...
echo.
start "React Frontend - Mens Hub" cmd /k "pnpm dev"

echo.
echo ====================================================
echo  ✓ Both servers starting!
echo ====================================================
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo.
echo  Admin Email: mubarak@menshub.com
echo  Admin Password: S@kMf$34
echo.
echo  Close these command windows to stop the servers.
echo ====================================================
echo.

pause
