# LearnFlow

A personalized learning management system that builds a structured curriculum for any technical topic. Concept lessons are AI-generated, and research papers are pulled directly from arXiv and embedded with a side AI chat tutor.

## What it does

- Generates a custom curriculum (concept lessons + research papers) for any topic
- Embeds real arXiv papers with a side AI assistant that has read the paper
- Saves all progress locally — pick up where you left off
- Mark lessons complete at your own pace, with optional quizzes

## Requirements

- Node.js 18+
- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com) (requires credit purchase)

## Setup

### 1. Clone and install frontend dependencies

```bash
git clone <your-repo-url>
cd learn-flow
npm install
```

### 2. Install backend dependencies

```bash
pip install fastapi uvicorn requests
```

### 3. Add your Anthropic API key

Create a `.env` file in the project root:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

> Your `.env` is already in `.gitignore` and will never be committed.

### 4. Run the app

```bash
npm run dev
```

This starts both the frontend (port 5173) and backend (port 8000) together.

Open **<http://localhost:5173>** in your browser.

## Usage

1. Click **New Curriculum** and enter a topic, your level, and how many research papers you want
2. LearnFlow generates concept lessons and finds real arXiv papers for the topic
3. Work through lessons in any order — read, ask questions, mark complete when done
4. Paper lessons embed the full PDF with an AI chat sidebar that has already read the paper

## How papers are selected

1. **Claude picks the topic** — when generating the curriculum, Claude suggests paper titles and search queries relevant to the topic (e.g. "Attention Is All You Need" for transformers)
2. **arXiv API finds the real paper** — the backend takes that search query and hits the arXiv API, returning the closest matching real paper with a verified arXiv ID and PDF link
3. **Google Docs viewer embeds it** — the PDF link is passed to Google Docs viewer which renders it in the page

Claude decides what's relevant, but arXiv decides what actually gets displayed. The paper shown is the top relevance result from arXiv's search engine for Claude's suggested query — meaning it's always a real paper but may not be exactly the one Claude had in mind.

## Notes

- The arXiv API rate limits to 1 request per 3 seconds — curriculum generation will take a few extra seconds when fetching multiple papers
- All progress is saved to `localStorage` — clearing your browser storage will reset progress
- The Anthropic API is called directly from the browser — keep your API key private and do not expose it publicly
