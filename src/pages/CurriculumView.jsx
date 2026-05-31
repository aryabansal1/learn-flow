import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCurriculum } from '../context/CurriculumContext'
import LessonSidebar from '../components/LessonSidebar'
import ConceptLesson from '../components/lessons/ConceptLesson'
import PaperLesson from '../components/lessons/PaperLesson'
import ErrorBoundary from '../components/ErrorBoundary'

export default function CurriculumView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useCurriculum()
  const [activeLessonId, setActiveLessonId] = useState(null)

  const curriculum = state.curricula.find(c => c.id === id)

  useEffect(() => {
    if (!curriculum) return
    dispatch({ type: 'SET_ACTIVE', id })
    if (!activeLessonId) {
      const first = curriculum.lessons.find(l => l.status === 'active' || l.status === 'complete')
      if (first) setActiveLessonId(first.id)
    }
  }, [curriculum?.id])

  if (!curriculum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Curriculum not found.</p>
          <button onClick={() => navigate('/')} className="text-indigo-600 underline text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const activeLesson = curriculum.lessons.find(l => l.id === activeLessonId)
  const allComplete = curriculum.lessons.every(l => l.status === 'complete')

  function handleLessonComplete(lessonId) {
    dispatch({ type: 'COMPLETE_LESSON', curriculumId: id, lessonId })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LessonSidebar
        curriculum={curriculum}
        activeLessonId={activeLessonId}
        onSelectLesson={setActiveLessonId}
      />

      <main className={`flex-1 overflow-y-auto ${activeLesson?.type === 'paper' ? 'p-6' : 'p-8'}`}>
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {allComplete ? (
          <CompletionScreen name={curriculum.name} />
        ) : activeLesson ? (
          <ErrorBoundary key={activeLesson.id}>
            <LessonRenderer
              lesson={activeLesson}
              curriculum={curriculum}
              onComplete={() => handleLessonComplete(activeLesson.id)}
            />
          </ErrorBoundary>
        ) : (
          <div className="text-gray-400 text-center mt-24">Select a lesson to begin.</div>
        )}
      </main>
    </div>
  )
}

function CompletionScreen({ name }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">You've completed</h2>
      <p className="text-xl text-indigo-600 font-semibold mb-8">{name}</p>
      <button
        onClick={() => navigate('/')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

function LessonRenderer({ lesson, curriculum, onComplete }) {
  if (lesson.type === 'concept') return <ConceptLesson lesson={lesson} curriculum={curriculum} onComplete={onComplete} />
  if (lesson.type === 'paper') return <PaperLesson lesson={lesson} curriculum={curriculum} onComplete={onComplete} />
  return <p className="text-gray-400">Unknown lesson type: {lesson.type}</p>
}
