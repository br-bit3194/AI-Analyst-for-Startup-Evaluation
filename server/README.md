🧠 Gen AI Analyst – Debate Orchestrator

This project is a FastAPI + MongoDB backend that allows you to upload documents, extract text, and orchestrate structured debates between AI agents.
It supports ingestion of PDF, DOCX, PPTX, TXT, and images, stores them in MongoDB, and provides endpoints to simulate debates over extracted content.

📂 Project Structure
server/
│── app/
│   ├── main.py            # FastAPI entrypoint
│   ├── config.py          # Environment & settings
│   ├── db.py              # MongoDB Beanie setup
│   ├── models.py          # MongoDB models
│   ├── routers/
│   │   ├── upload.py      # File ingestion
│   │   ├── documents.py   # Document retrieval
│   │   └── debate.py      # Debate orchestration
│   └── services/
│       ├── storage.py     # File storage utils
│       ├── parsers.py     # PDF/DOCX/PPTX/TXT/Image parsers
│       ├── orchestrator.py# Debate flow orchestration
│       └── llm_client.py  # LLM API client (OpenAI / Ollama)
│
│── requirements.txt
│── .env.example
│── README.md

⚙️ Setup
1. Clone repo & install dependencies
git clone <your-repo-url>
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

2. Environment variables

Copy .env.example → .env and update:

MONGO_URI=mongodb://localhost:27017/debate_ai
OPENAI_API_KEY=your_api_key_here   # or leave blank if using Ollama

3. Start server
uvicorn app.main:app --reload


Server will run at: http://127.0.0.1:8000

🚀 API Usage
📤 1. File Upload

POST /upload/

Form-data: file (required), user_id (optional)

Response:

{
  "id": "6489a23abc123",
  "status": "processed"
}

📥 2. Get All Files

GET /documents/

📄 3. Get Document by ID

GET /documents/{document_id}

🗣️ 4. Start Debate Session

POST /debate/start?topic=StartupX&document_id={doc_id}

Response:

{
  "id": "66f0f352f10f0d2a4e8a5678"
}

🔄 5. Run Next Debate Round

POST /debate/{session_id}/next

Response:

{
  "agent": "Pro",
  "message": "I believe StartupX has strong potential..."
}

📜 6. Get Debate Transcript

GET /debate/{session_id}/transcript

Response:

{
  "messages": [
    {"agent": "Pro", "message": "..."},
    {"agent": "Con", "message": "..."}
  ]
}

🛠️ Notes

By default, this project uses OpenAI API. If you don’t have credits, switch to Ollama (local model).

All extracted texts and debates are stored in MongoDB.