const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

function getApiKey() {
  return import.meta.env.VITE_ANTHROPIC_API_KEY
}

function stripJsonFences(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}

async function callAnthropic(messages, systemPrompt, retries = 2) {
  const body = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages,
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    })

    if (res.status === 429 && attempt < retries) {
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
      continue
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${res.status}`)
    }

    const data = await res.json()
    return data.content[0].text
  }
}

export async function generateCurriculum(topic, level) {
  const levelLabel = { beginner: 'Beginner', some_background: 'Some background', technical: 'Technical' }[level] || level

  const prompt = `Generate a structured lesson plan for learning about: "${topic}"
Student level: ${levelLabel}

Guidelines:
- Start with 2-3 concept lessons to build intuition and foundational understanding
- End with 2-3 paper lessons that go deep on the topic with real research
- No video lessons — only concept and paper types
- Total lessons: decide based on complexity (typically 5-8)
- For paper lessons, suggest real arXiv papers with accurate titles

Respond ONLY with valid JSON in this exact format:
{
  "lessons": [
    {
      "type": "concept" | "paper",
      "title": "string",
      "description": "string",
      "arxivQuery": "string (paper lessons only, omit for others)",
      "arxivTitle": "string (paper lessons only — a real paper title)",
      "arxivId": "string (paper lessons only — the arXiv ID, e.g. 1706.03762)"
    }
  ]
}`

  const text = await callAnthropic([{ role: 'user', content: prompt }], 'You are a curriculum designer. Output only valid JSON.')
  return JSON.parse(stripJsonFences(text))
}

export async function generateConceptContent(lessonTitle, level) {
  const levelLabel = { beginner: 'Beginner', some_background: 'Some background', technical: 'Technical' }[level] || level

  const prompt = `Write a concept explainer for: "${lessonTitle}"
Student level: ${levelLabel}

Requirements:
- Use analogies and build from first principles
- No jargon without explanation
- Use markdown formatting (headers, bullet points, code blocks as needed)
- Be comprehensive but accessible`

  return callAnthropic(
    [{ role: 'user', content: prompt }],
    'You are an expert teacher. Write clear, engaging explanations.'
  )
}

export async function generateQuiz(lessonTitle, lessonContent) {
  const contentSnippet = typeof lessonContent === 'string'
    ? lessonContent.slice(0, 1500)
    : JSON.stringify(lessonContent).slice(0, 1500)

  const prompt = `Generate 5 multiple choice questions testing understanding of the lesson: "${lessonTitle}"

Lesson content summary:
${contentSnippet}

Respond ONLY with valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["A text", "B text", "C text", "D text"],
      "correctIndex": 0,
      "explanation": "string — why the correct answer is right"
    }
  ]
}`

  const text = await callAnthropic(
    [{ role: 'user', content: prompt }],
    'You are a quiz writer. Output only valid JSON.'
  )
  return JSON.parse(stripJsonFences(text))
}

export async function generateVideoTakeaways(lessonTitle, level) {
  const levelLabel = { beginner: 'Beginner', some_background: 'Some background', technical: 'Technical' }[level] || level

  const prompt = `Generate 4-6 key takeaways for a video lesson titled: "${lessonTitle}"
Student level: ${levelLabel}

Respond ONLY with valid JSON:
{ "keyTakeaways": ["string", "string", "string", "string"] }`

  const text = await callAnthropic(
    [{ role: 'user', content: prompt }],
    'You are an educational content writer. Output only valid JSON.'
  )
  return JSON.parse(stripJsonFences(text))
}

export async function sendTutorMessage(paperTitle, arxivId, userMessage, history, abstract = null) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  const systemPrompt = `You are an expert researcher who has thoroughly read the paper "${paperTitle}"${arxivId ? ` (arXiv:${arxivId})` : ''}.${abstract ? `\n\nAbstract: ${abstract}` : ''}
The user is reading this paper right now and will ask you questions as they go.
Answer concisely and clearly. Explain equations, figures, and jargon in plain language when asked.
Keep responses focused — the user is mid-read, not looking for a lecture.`

  return callAnthropic(messages, systemPrompt)
}
