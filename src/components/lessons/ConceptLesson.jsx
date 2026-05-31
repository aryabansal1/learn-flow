import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useCurriculum } from '../../context/CurriculumContext'
import { generateConceptContent } from '../../api/anthropic'
import QuizModal from '../QuizModal'

export default function ConceptLesson({ lesson, curriculum, onComplete }) {
  const { dispatch } = useCurriculum()
  const [content, setContent] = useState(lesson.content?.explanation || '')
  const [loading, setLoading] = useState(!lesson.content?.explanation)
  const [error, setError] = useState(null)
  const [quizOpen, setQuizOpen] = useState(false)

  useEffect(() => {
    if (!lesson.content?.explanation) {
      loadContent()
    }
  }, [lesson.id])

  async function loadContent() {
    setLoading(true)
    setError(null)
    try {
      const explanation = await generateConceptContent(lesson.title, curriculum.level)
      setContent(explanation)
      dispatch({
        type: 'UPDATE_LESSON',
        curriculumId: curriculum.id,
        lessonId: lesson.id,
        updates: { content: { ...lesson.content, explanation } },
      })
    } catch (e) {
      setError(e.message || 'Failed to load lesson content.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LessonSkeleton />

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{lesson.title}</h1>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-700 text-sm">
          <p className="mb-3">{error}</p>
          <button onClick={loadContent} className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Regenerate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-2 text-xs font-medium text-indigo-500 uppercase tracking-wide">Concept</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{lesson.title}</h1>

      <div className="prose prose-gray max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div className="mt-10 pt-8 border-t border-gray-100 flex items-center gap-3">
        {lesson.status !== 'complete' ? (
          <>
            <button
              onClick={onComplete}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              ✓ Mark Complete
            </button>
            <button
              onClick={() => setQuizOpen(true)}
              className="border border-indigo-300 text-indigo-600 hover:bg-indigo-50 px-5 py-2.5 rounded-lg font-medium transition-colors"
            >
              Take Quiz (optional)
            </button>
          </>
        ) : (
          <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-medium">
            ✅ Lesson complete
          </div>
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

function LessonSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-20 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-2/3 mb-8" />
      <div className="space-y-3">
        {[100, 90, 95, 80, 88, 75].map((w, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  )
}
