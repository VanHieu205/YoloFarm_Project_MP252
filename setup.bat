@echo off
REM Setup script cho YoloFarm RAG Chatbot System (Windows)

echo ==========================================
echo YoloFarm RAG Chatbot - Setup Script
echo ==========================================

REM 1. Check Python version
echo.
echo [1/5] Checking Python version...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    exit /b 1
)

REM 2. Install Python dependencies
echo.
echo [2/5] Installing Python dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    cd ..
    exit /b 1
)
cd ..

REM 3. Check .env file
echo.
echo [3/5] Checking .env configuration...
if not exist "backend\.env" (
    echo ERROR: .env file not found!
    echo Please create backend\.env with:
    echo   gemini_api_key=YOUR_GEMINI_API_KEY
    echo   OPENWEATHER_API_KEY=YOUR_WEATHER_API_KEY
    exit /b 1
) else (
    echo OK: .env file exists
)

REM 4. Initialize Chroma vector store
echo.
echo [4/5] Initializing Chroma vector store...
cd backend
python ML\initialize_rag.py
if errorlevel 1 (
    echo ERROR: Failed to initialize RAG
    cd ..
    exit /b 1
)
cd ..

REM 5. Install Node.js dependencies
echo.
echo [5/5] Installing Node.js dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install npm dependencies
    cd ..
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ==========================================

echo.
echo NEXT STEPS:
echo 1. Start backend: cd backend ^& python main.py
echo 2. Start frontend: cd frontend ^& npm run dev
echo 3. Open http://localhost:5173 in your browser
echo 4. Login and navigate to Chatbot page

echo.
echo CONFIGURATION:
echo - Gemini API Key: Check in backend\.env
echo - Database: Make sure MySQL is running
echo - Vector Store: .\backend\chroma_data\

echo.
echo For more information, see RAG_CHATBOT_README.md
pause
