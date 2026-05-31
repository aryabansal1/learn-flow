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
- Start with 1-2 concept lessons to build intuition
- Include video lessons in the middle
- End with 1-2 paper lessons once the student has enough foundation
- Total lessons: decide based on complexity (typically 5-10)
- For paper lessons, suggest real arXiv papers

Respond ONLY with valid JSON in this exact format:
{
  "lessons": [
    {
      "type": "concept" | "video" | "paper",
      "title": "string",
      "description": "string",
      "youtubeQuery": "string (video lessons only, omit for others)",
      "arxivQuery": "string (paper lessons only, omit for others)",
      "arxivTitle": "string (paper lessons only — a real paper title)"
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

export async function sendTutorMessage(paperTitle, userMessage, history) {
  const messages = [
    ...history,
    { role: 'user', content: userMessage },
  ]

  const systemPrompt = `You are a patient, knowledgeable tutor walking a student through the research paper: "${paperTitle}".
Walk through the paper section by section in this order: Background & motivation, Key concepts, Methodology, Results, Why it matters.
Use analogies and plain language. Check for understanding. Answer questions in context.
When you have covered all sections of the paper, end your message with the phrase: "that covers the full paper"`

  return callAnthropic(messages, systemPrompt)
}
