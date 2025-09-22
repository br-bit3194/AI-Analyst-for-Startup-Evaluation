# 🚀 AI Analyst for Startup Evaluation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

AI-powered analyst platform that evaluates startups by synthesizing founder materials and public data to generate concise, actionable investment insights.

## 🌟 Features

- **Investment Committee Simulator** - Multi-agent VC simulation
- **Investment Memory System** - Long-term learning from past decisions
- **Explainable Risk Radar** - Transparent risk assessment with confidence scores
- **Conversational Due Diligence** - Natural language querying of deal data
- **Continuous Monitoring** - Real-time alerts on key events
- **Founder & Team Analysis** - Automated profile mining and evaluation
- **Market Validation** - TAM/SAM/SOM verification
- **Competitive Analysis** - Visual competitive landscape
- **Automated Deal Memos** - Investor-ready documentation

## 🛠 Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Python FastAPI (RESTful API)
- **Database**: MongoDB
- **AI/ML**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **Cloud**: Google Cloud Platform (BigQuery, Firebase, Cloud Functions, Cloud Storage)

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas account
- Google Cloud account
- Heroku CLI (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/AI-Analyst-for-Startup-Evaluation.git
   cd AI-Analyst-for-Startup-Evaluation
   ```

2. **Set up the backend**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Variables**
   - Copy `.env.example` to `.env` in both `server/` and `client/` directories
   - Update the environment variables with your configuration
   - For the client, ensure `VITE_API_BASE_URL` points to your FastAPI backend

5. **Run the development servers**
   - Backend (from `/server` directory):
     ```bash
     uvicorn app.main:app --reload
     ```
     The API will be available at `http://localhost:8000`
     
     API documentation will be available at:
     - Swagger UI: `http://localhost:8000/docs`
     - ReDoc: `http://localhost:8000/redoc`

   - Frontend (from `/client` directory):
     ```bash
     npm run dev
     ```
     The Vite development server will start, and the app will be available at `http://localhost:5173` (or the port shown in the terminal)

## 🌐 Deployment

### Heroku Deployment

1. **Install Heroku CLI** (if not already installed)
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set buildpacks**
   ```bash
   heroku buildpacks:add --index 1 heroku/python
   heroku buildpacks:add --index 2 heroku/nodejs
   ```

4. **Set Python version**
   ```bash
   heroku config:set PYTHON_RUNTIME_VERSION=3.10.0
   ```

5. **Deploy your application**
   ```bash
   git push heroku main
   ```

## 📂 Project Structure

```
AI-Analyst-for-Startup-Evaluation/
├── client/                 # Frontend React + Vite application
├── server/                 # Backend FastAPI application
│   ├── app/               # Main application code
│   ├── data/              # Data storage
│   ├── tests/             # Test files
│   ├── .env.example       # Example environment variables
│   └── requirements.txt   # Python dependencies
├── .gitignore             # Git ignore file
├── Procfile               # Heroku process file
├── heroku.yml             # Heroku deployment config
├── requirements.txt       # Root requirements
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✨ Acknowledgments

- Built with ❤️ by [Your Team Name]
- Special thanks to all contributors
- Inspired by the need for better startup evaluation tools
