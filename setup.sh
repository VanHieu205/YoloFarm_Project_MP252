#!/bin/bash
# Setup script cho YoloFarm RAG Chatbot System

echo "=========================================="
echo "YoloFarm RAG Chatbot - Setup Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Python version
echo -e "\n${YELLOW}[1/5]${NC} Checking Python version..."
python --version || { echo -e "${RED}Python not found!${NC}"; exit 1; }

# 2. Install Python dependencies
echo -e "\n${YELLOW}[2/5]${NC} Installing Python dependencies..."
cd backend
pip install -r requirements.txt || { echo -e "${RED}Failed to install dependencies${NC}"; exit 1; }
cd ..

# 3. Check .env file
echo -e "\n${YELLOW}[3/5]${NC} Checking .env configuration..."
if [ ! -f backend/.env ]; then
    echo -e "${RED}.env file not found!${NC}"
    echo "Please create backend/.env with:"
    echo "  gemini_api_key=YOUR_GEMINI_API_KEY"
    echo "  OPENWEATHER_API_KEY=YOUR_WEATHER_API_KEY"
    exit 1
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# 4. Initialize Chroma vector store
echo -e "\n${YELLOW}[4/5]${NC} Initializing Chroma vector store..."
cd backend
python ML/initialize_rag.py || { echo -e "${RED}Failed to initialize RAG${NC}"; exit 1; }
cd ..

# 5. Install Node.js dependencies
echo -e "\n${YELLOW}[5/5]${NC} Installing Node.js dependencies..."
cd frontend
npm install || { echo -e "${RED}Failed to install npm dependencies${NC}"; exit 1; }
cd ..

echo -e "\n${GREEN}=========================================="
echo "✓ Setup completed successfully!"
echo "=========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Start backend: cd backend && python main.py"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo "4. Login and navigate to Chatbot page"

echo -e "\n${YELLOW}Configuration:${NC}"
echo "- Gemini API Key: Check in backend/.env"
echo "- Database: Make sure MySQL is running"
echo "- Vector Store: ./backend/chroma_data/"

echo -e "\n${YELLOW}For more information, see RAG_CHATBOT_README.md${NC}"
