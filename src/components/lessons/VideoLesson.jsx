import { useState } from 'react'
import { useCurriculum } from '../../context/CurriculumContext'
import QuizModal from '../QuizModal'

function extractVideoId(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
  } catch {}
  return null
}

export default function VideoLesson({ lesson, curriculum, onComplete }) {
  const { dispatch } = useCurriculum()
  const [quizOpen, setQuizOpen] = useState(false)
  const [embedError, setEmbedError] = useState(false)

  const videoId = extractVideoId(lesson.content?.youtubeUrl)
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.content?.youtubeQuery || lesson.title)}`
  const takeaways = lesson.content?.keyTakeaways || []

  return (
    <div className="max-w-2xl">
      <div className="mb-2 text-xs font-medium text-purple-500 uppercase tracking-wide">Video</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{lesson.title}</h1>

      <div className="rounded-2xl overflow-hidden mb-2 aspect-video bg-gray-900">
        {embedUrl && !embedError ? (
          <iframe
            src={embedUrl}
            title={lesson.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setEmbedError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white gap-4 px-8 text-center">
            <div className="text-4xl">▶</div>
            <p className="text-sm text-gray-300">Video unavailable — search YouTube instead</p>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Search YouTube →
            </a>
          </div>
        )}
      </div>

      {embedUrl && !embedError && (
        <a
          href={lesson.content.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-600 mb-6 inline-block"
        >
          Open in YouTube ↗
        </a>
      )}

      {takeaways.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-6 mb-8 mt-4">
          <h3 className="font-semibold text-indigo-900 mb-3">Key Takeaways</h3>
          <ul className="space-y-2">
            {takeaways.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                <span className="text-indigo-400 mt-0.5">•</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-6 border-t border-gray-100 flex items-center gap-3">
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
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-medium">
              ✅ Lesson complete
            </div>
            <button
              onClick={() => dispatch({ type: 'UPDATE_LESSON', curriculumId: curriculum.id, lessonId: lesson.id, updates: { status: 'active' } })}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Unmark
            </button>
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
