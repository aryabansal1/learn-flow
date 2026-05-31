import { useState, useEffect, useRef } from 'react'
import { useCurriculum } from '../../context/CurriculumContext'
import { sendTutorMessage } from '../../api/anthropic'
import QuizModal from '../QuizModal'

export default function PaperLesson({ lesson, curriculum, onComplete }) {
  const { dispatch } = useCurriculum()
  const [history, setHistory] = useState(lesson.tutorHistory || [])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [embedError, setEmbedError] = useState(false)
  const bottomRef = useRef(null)

  const arxivId = lesson.content?.arxivId
  const paperTitle = lesson.content?.arxivTitle || lesson.title
  const abstract = lesson.content?.abstract || null
  const pdfUrl = lesson.content?.pdfLink || (arxivId ? `https://arxiv.org/pdf/${arxivId}` : null)
  const embedUrl = pdfUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : null
  const abstractUrl = arxivId ? `https://arxiv.org/abs/${arxivId}` : null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    const userMsg = { role: 'user', content: text }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setSending(true)

    try {
      const reply = await sendTutorMessage(paperTitle, arxivId, text, history, abstract)
      const assistantMsg = { role: 'assistant', content: reply }
      const finalHistory = [...newHistory, assistantMsg]
      setHistory(finalHistory)
      dispatch({ type: 'UPDATE_LESSON', curriculumId: curriculum.id, lessonId: lesson.id, updates: { tutorHistory: finalHistory } })
    } catch (e) {
      const errMsg = { role: 'assistant', content: `Error: ${e.message || 'Something went wrong.'}` }
      setHistory(h => [...h, errMsg])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 7rem)' }}>

      {/* Left: Paper embed */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-medium text-amber-500 uppercase tracking-wide">Paper</span>
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{lesson.title}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {abstractUrl && (
              <a href={abstractUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-500 hover:underline">
                arXiv ↗
              </a>
            )}
            {lesson.status !== 'complete' ? (
              <button onClick={onComplete}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                ✓ Mark Complete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg font-medium">✅ Complete</span>
                <button
                  onClick={() => dispatch({ type: 'UPDATE_LESSON', curriculumId: curriculum.id, lessonId: lesson.id, updates: { status: 'active' } })}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">
                  Unmark
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {embedUrl && !embedError ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              title={paperTitle}
              onError={() => setEmbedError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center px-8">
              <p className="text-gray-500 text-sm">
                {arxivId
                  ? 'PDF preview unavailable — open the paper directly.'
                  : 'No arXiv ID found for this paper.'}
              </p>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Open PDF ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: AI Chat */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paper Assistant</p>
          <p className="text-xs text-gray-400 mt-0.5">Ask anything as you read</p>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-gray-100 p-3 flex flex-col gap-3 mb-3">
          {history.length === 0 && (
            <div className="text-xs text-gray-400 text-center mt-4 px-2">
              I've read this paper. Ask me about any concept, equation, or section as you go through it.
            </div>
          )}
          {history.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-xl rounded-bl-sm px-3 py-2 shadow-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 rounded-xl text-xs font-medium transition-colors"
          >
            Send
          </button>
        </div>

        {lesson.status !== 'complete' && (
          <button
            onClick={() => setQuizOpen(true)}
            className="mt-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Take Quiz (optional)
          </button>
        )}
      </div>

      {quizOpen && (
        <QuizModal
          lesson={lesson}
          curriculum={curriculum}
          onClose={() => setQuizOpen(false)}
          onPass={onComplete}
        />
      )}
    </div>
  )
}
