import { useState, useEffect, useRef } from 'react'
import { useCurriculum } from '../../context/CurriculumContext'
import { sendTutorMessage } from '../../api/anthropic'
import QuizModal from '../QuizModal'

export default function PaperLesson({ lesson, curriculum, onComplete }) {
  const { dispatch } = useCurriculum()
  const [history, setHistory] = useState(lesson.tutorHistory || [])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [paperFinished, setPaperFinished] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const bottomRef = useRef(null)

  const paperTitle = lesson.content?.arxivTitle || lesson.title
  const arxivUrl = lesson.content?.arxivUrl

  useEffect(() => {
    if (history.length === 0) {
      sendMessage("Start walking me through this paper")
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  async function sendMessage(userText) {
    const userMsg = { role: 'user', content: userText }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setSending(true)

    try {
      const reply = await sendTutorMessage(paperTitle, userText, history)
      const assistantMsg = { role: 'assistant', content: reply }
      const finalHistory = [...newHistory, assistantMsg]
      setHistory(finalHistory)

      // Save to context/localStorage
      dispatch({ type: 'SAVE_TUTOR_MESSAGE', curriculumId: curriculum.id, lessonId: lesson.id, message: userMsg })
      dispatch({ type: 'SAVE_TUTOR_MESSAGE', curriculumId: curriculum.id, lessonId: lesson.id, message: assistantMsg })

      if (reply.toLowerCase().includes('that covers the full paper')) {
        setPaperFinished(true)
      }
    } catch (e) {
      const errMsg = { role: 'assistant', content: `Error: ${e.message || 'Something went wrong.'}` }
      setHistory(h => [...h, errMsg])
    } finally {
      setSending(false)
    }
  }

  function handleSend() {
    if (!input.trim() || sending) return
    sendMessage(input.trim())
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="max-w-2xl flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
      <div className="mb-2 text-xs font-medium text-amber-500 uppercase tracking-wide">Paper Walkthrough</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{lesson.title}</h1>
      {arxivUrl ? (
        <a
          href={arxivUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:underline mb-4 inline-block"
        >
          {paperTitle} — arXiv ↗
        </a>
      ) : (
        <p className="text-sm text-gray-400 mb-4 italic">{paperTitle}</p>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-col gap-4 mb-4">
        {history.filter(m => m.role !== 'user' || history.indexOf(m) !== 0).map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Action bar */}
      {lesson.status !== 'complete' ? (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ✓ Mark Complete
          </button>
          <button
            onClick={() => setQuizOpen(true)}
            className="border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Take Quiz (optional)
          </button>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-medium mb-3">
          ✅ Lesson complete
        </div>
      )}

      {/* Input */}
      {lesson.status !== 'complete' && (
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or continue the conversation…"
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-xl font-medium transition-colors"
          >
            Send
          </button>
        </div>
      )}

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
