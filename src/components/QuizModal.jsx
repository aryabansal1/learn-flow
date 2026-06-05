import { useState, useEffect } from 'react'
import { useCurriculum } from '../context/CurriculumContext'
import { generateQuiz } from '../api/anthropic'

export default function QuizModal({ lesson, curriculum, onClose, onPass }) {
  const { dispatch } = useCurriculum()
  const [questions, setQuestions] = useState(lesson.quiz?.questions || [])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase] = useState('question') // 'question' | 'results'
  const [loading, setLoading] = useState(questions.length === 0)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (questions.length === 0) loadQuiz()
  }, [])

  async function loadQuiz() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateQuiz(lesson.title, lesson.content?.explanation || lesson.title)
      setQuestions(result.questions)
    } catch (e) {
      setError(e.message || 'Failed to generate quiz.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(idx) {
    if (selected !== null) return
    setSelected(idx)
  }

  function handleNext() {
    const newAnswers = [...answers, selected]
    if (current + 1 < questions.length) {
      setAnswers(newAnswers)
      setCurrent(c => c + 1)
      setSelected(null)
    } else {
      // Score
      const correct = newAnswers.filter((a, i) => a === questions[i].correctIndex).length
      const passed = correct >= Math.ceil(questions.length * 0.7)
      dispatch({
        type: 'SAVE_QUIZ_RESULT',
        curriculumId: curriculum.id,
        lessonId: lesson.id,
        questions,
        userAnswers: newAnswers,
        passed,
      })
      setAnswers(newAnswers)
      setPhase('results')
    }
  }

  async function handleRetry() {
    setAnswers([])
    setCurrent(0)
    setSelected(null)
    setPhase('question')
    setQuestions([])
    setLoading(true)
    try {
      const result = await generateQuiz(lesson.title, lesson.content?.explanation || lesson.title)
      setQuestions(result.questions)
    } catch (e) {
      setError(e.message || 'Failed to generate quiz.')
    } finally {
      setLoading(false)
    }
  }

  const correct = answers.filter((a, i) => a === questions[i]?.correctIndex).length
  const passed = phase === 'results' && correct >= Math.ceil(questions.length * 0.7)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
        {loading ? (
          <div className="flex flex-col items-center py-12 gap-4">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-gray-500 text-sm">Generating quiz…</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={loadQuiz} className="text-indigo-600 underline text-sm">Try again</button>
          </div>
        ) : phase === 'question' && questions.length > 0 ? (
          <QuestionView
            question={questions[current]}
            questionIdx={current}
            total={questions.length}
            selected={selected}
            onSelect={handleSelect}
            onNext={handleNext}
          />
        ) : phase === 'results' ? (
          <ResultsView
            questions={questions}
            answers={answers}
            correct={correct}
            passed={passed}
            onClose={onClose}
            onRetry={handleRetry}
          />
        ) : null}
      </div>
    </div>
  )
}

function QuestionView({ question, questionIdx, total, selected, onSelect, onNext }) {
  const letters = ['A', 'B', 'C', 'D']
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Question {questionIdx + 1} of {total}</h3>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-6 rounded-full ${i <= questionIdx ? 'bg-indigo-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>

      <p className="text-gray-900 font-medium mb-6 leading-snug">{question.question}</p>

      <div className="flex flex-col gap-2 mb-6">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors
              ${selected === null ? 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50' : ''}
              ${selected === i && selected === question.correctIndex ? 'border-green-400 bg-green-50 text-green-800' : ''}
              ${selected === i && selected !== question.correctIndex ? 'border-red-400 bg-red-50 text-red-800' : ''}
              ${selected !== null && i === question.correctIndex && selected !== i ? 'border-green-300 bg-green-50 text-green-700' : ''}
              ${selected !== null && selected !== i && i !== question.correctIndex ? 'border-gray-100 text-gray-400' : ''}
            `}
          >
            <span className="font-semibold mr-2">{letters[i]}.</span>{opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <button
          onClick={onNext}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          {questionIdx + 1 < 5 ? 'Next Question' : 'See Results'}
        </button>
      )}
    </>
  )
}

function ResultsView({ questions, answers, correct, passed, onRetry, onClose }) {
  const total = questions.length
  return (
    <>
      <div className={`rounded-xl p-4 mb-6 text-center ${passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
        <p className="text-2xl font-bold mb-1">{correct}/{total}</p>
        <p className="font-medium">{passed ? 'Great work!' : 'Keep reviewing — you\'ll get it.'}</p>
      </div>

      <div className="flex flex-col gap-3 mb-6 max-h-64 overflow-y-auto">
        {questions.map((q, i) => {
          const wrong = answers[i] !== q.correctIndex
          if (!wrong) return null
          return (
            <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-800 mb-1">{q.question}</p>
              <p className="text-red-600 text-xs">Your answer: {q.options[answers[i]]}</p>
              <p className="text-green-700 text-xs">Correct: {q.options[q.correctIndex]}</p>
              <p className="text-gray-500 text-xs mt-1">{q.explanation}</p>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Back to Lesson
        </button>
        <button
          onClick={onRetry}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors"
        >
          Retry Quiz
        </button>
      </div>
    </>
  )
}
