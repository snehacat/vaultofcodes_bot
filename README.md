# VaultOfCodes AI Chatbot 🤖

An intelligent AI-powered chatbot that provides real-time information about VaultOfCodes courses, internships, certificates, and more.

## ✨ Features

- 🔄 **Real-Time URL Search** - Searches the live VaultOfCodes website for accurate page links
- ⚡ **AI-Powered Responses** - Smart answers using Groq AI (LLaMA model)
- 📚 **Dynamic Knowledge Base** - Fetches fresh content from the website
- 🎯 **Exact URL Matching** - Provides direct links to relevant pages
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🌙 **Dark Theme** - Modern VaultOfCodes-branded interface

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Groq API key ([Get one here](https://console.groq.com))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd vaultofcodes-chatbot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example file
copy .env.example .env

# Edit .env and add your API key
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_WHATSAPP_SUPPORT_URL=https://wa.me/919455345519
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:5173
```

## 📦 Project Structure

```
vaultofcodes-chatbot/
├── api/                    # Serverless functions (Vercel)
│   ├── chat.js            # Main AI chat endpoint
│   ├── search-url.js      # Real-time URL search
│   ├── sources.js         # Knowledge base endpoint
│   └── health.js          # Health check
├── src/
│   ├── components/        # React components
│   │   ├── ChatBot.jsx    # Main chat interface
│   │   ├── Message.jsx    # Chat message component
│   │   ├── ChatInput.jsx  # Input field
│   │   └── SuggestedQuestions.jsx
│   ├── services/          # Business logic
│   │   ├── aiService.js           # AI integration
│   │   ├── realtimeUrlSearch.js   # Live URL search
│   │   ├── urlMatcher.js          # Static URL matching
│   │   ├── dynamicRetrieval.js    # Knowledge retrieval
│   │   └── intentDetection.js     # Query understanding
│   ├── data/              # Static data
│   │   ├── knowledgeBase.json     # Pre-crawled content
│   │   ├── urlMap.json            # Verified URLs
│   │   └── systemPrompt.js        # AI instructions
│   └── App.jsx            # Landing page
├── scripts/
│   └── crawlVaultOfCodes.js       # Website crawler
├── .env.example           # Environment template
└── vercel.json           # Deployment config
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GROQ_API_KEY` | Your Groq API key | Yes |
| `VITE_WHATSAPP_SUPPORT_URL` | WhatsApp support link | Optional |
| `VITE_API_BASE_URL` | API base URL (default: `/api`) | Optional |

### AI Model

Currently using: `groq/llama-3.1-8b-instant`

To change the model, edit `src/services/aiService.js`:
```javascript
const MODEL = 'groq/llama-3.1-8b-instant'; // Change here
```

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel --prod
```

3. **Set environment variables** in Vercel dashboard
   - Go to Project Settings → Environment Variables
   - Add `VITE_GROQ_API_KEY`

### Deploy to Netlify

1. **Build the project**
```bash
npm run build
```

2. **Deploy the `dist` folder** to Netlify

3. **Configure serverless functions**
   - Move `api/` folder to `netlify/functions/`

## 🧪 Testing

### Test Real-Time URL Search

Try these queries in the chat:
- "I want internship"
- "Python course"
- "Web Development course"
- "Free study material"
- "Verify certificate"
- "Reviews"

### Test Static Fallback

Disable the API and verify static URL database works.

## 📊 How It Works

### URL Search Flow

```
User Query
    ↓
Intent Detection
    ↓
Real-Time Search (Primary)
    ├── Known Patterns (95% confidence)
    ├── Homepage Scrape (80% confidence)
    ├── Courses Page Search (75-90% confidence)
    └── Internships Page (95% confidence)
    ↓
Static Fallback (if real-time fails)
    ↓
AI Response with URL
```

### AI Response Flow

```
User Query
    ↓
Dynamic Retrieval
    ├── Fetch from Website (if needed)
    └── Use Cached Knowledge Base
    ↓
URL Matching (real-time + static)
    ↓
AI Processing (Groq)
    ↓
Response with Sources & URLs
```

## 🔒 Security

- ✅ `.env` file is gitignored
- ✅ API keys never exposed to client
- ✅ CORS headers configured
- ✅ Input validation on all endpoints
- ✅ Rate limiting ready (add if needed)

## 🛠️ Development

### Run crawler to update knowledge base
```bash
node scripts/crawlVaultOfCodes.js
```

### Lint code
```bash
npm run lint
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 📝 License

This project is private and confidential.

## 🤝 Support

For issues or questions, contact VaultOfCodes support:
- 📧 Email: support@vaultofcodes.in
- 💬 WhatsApp: +91 9455345519

---

Built with ❤️ using React, Vite, TailwindCSS, and Groq AI
