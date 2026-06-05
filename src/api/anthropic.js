const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 1000

function getApiKey() {
  return localStorage.getItem('anthropic_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY
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

export async function generateCurriculum(topic, level, paperCount = 2) {
  const levelLabel = { beginner: 'Beginner', some_background: 'Some background', technical: 'Technical' }[level] || level

  const prompt = `Generate a structured lesson plan for learning about: "${topic}"
Student level: ${levelLabel}

Guidelines:
- Start with concept lessons to build intuition and foundational understanding
- End with exactly ${paperCount} paper lesson${paperCount > 1 ? 's' : ''} that go deep on the topic with real research
- No video lessons — only concept and paper types
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
  const levelInstructions = {
    beginner: `- Assume zero prior knowledge. Avoid all jargon; if a technical term is unavoidable, define it in the same sentence.
- Analogies should come from everyday life (cooking, sports, commuting).
- The "how it works" section should build from the analogy, not introduce new abstractions.`,

    some_background: `- Assume the reader knows basic concepts in the field but hasn't gone deep.
- You can use field-specific terms without defining common ones, but explain anything non-obvious.
- Analogies can reference adjacent technical ideas they likely know.`,

    technical: `- Assume the reader is a practitioner. Skip motivational framing — get to the mechanism quickly.
- Analogies should reference other technical systems or patterns (e.g. "like a hash map, but...").
- The "how it works" section can use precise terminology and reference tradeoffs.`,
  }[level] || ''

  const prompt = `Write a concept explainer for: "${lessonTitle}"

RULES:
- Total length: 400-500 words maximum. Never exceed this.
- Each section must be 2-4 sentences. Cut any sentence that doesn't add new understanding.
- One analogy only — vivid and specific. State it once, then use it once more to reinforce a key point.
- No filler openers like "Here's where things get interesting." Start every section with the substance itself.

Level-specific instructions:
${levelInstructions}

Use exactly this structure:
## The problem
What gap does this concept fill? (2-3 sentences)

## The analogy
One crisp real-world comparison. (1-2 sentences)

## How it works
The core mechanism, using the analogy to ground it. (3-4 sentences)

## Why it matters
One concrete example of what becomes possible. (2-3 sentences)

## Common misconception
One thing learners get wrong. (2 sentences)`

  return callAnthropic(
    [{ role: 'user', content: prompt }],
    'You are an expert teacher. Write clear, concise explanations. Never exceed 500 words total.'
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
