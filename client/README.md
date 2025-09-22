<div align="center">
<img width="1200" height="475" alt="AI Analyst for Startup Evaluation" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
<h1>AI Analyst for Startup Evaluation</h1>
<p>An intelligent platform for analyzing and evaluating startup investments using AI-powered financial analysis.</p>
</div>

## Features

- **Financial Health Dashboard**: Track MRR, burn rate, runway, and more
- **Cash Flow Analysis**: Visualize operating, investing, and financing activities
- **Unit Economics**: Analyze CAC, LTV, payback period, and other key metrics
- **Benchmarking**: Compare against industry standards
- **AI-Powered Insights**: Get automated analysis and recommendations

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **AI/ML**: Google Gemini 2.5 Pro/Flash
- **Cloud**: Google Cloud Platform (GCP)

## Prerequisites

- Node.js 18+ and npm 9+
- Python 3.9+
- MongoDB 6.0+
- Google Cloud account (for Gemini API)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your MongoDB and Gemini API credentials

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Frontend dev server: [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Backend (`.env`)

```
MONGO_URI=mongodb://localhost:27017/startup_ai
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
STORAGE_PATH=./uploads
USE_CLOUD=false
```

### Frontend (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## API Endpoints

- `GET /api/finance/metrics/{document_id}` - Get financial metrics
- `GET /api/finance/health/{document_id}` - Get financial health metrics
- `GET /api/finance/cash-flow/{document_id}` - Get cash flow data
- `GET /api/finance/unit-economics/{document_id}` - Get unit economics
- `GET /api/finance/benchmarks/{document_id}` - Get benchmark comparisons

## License

MIT
