import { useState } from 'react'
import QuizModal from '../QuizModal'

export default function VideoLesson({ lesson, curriculum, onComplete }) {
  const [quizOpen, setQuizOpen] = useState(false)
  const query = lesson.content?.youtubeQuery || lesson.title
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  const takeaways = lesson.content?.keyTakeaways || []

  return (
    <div className="max-w-2xl">
      <div className="mb-2 text-xs font-medium text-purple-500 uppercase tracking-wide">Video</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{lesson.title}</h1>

      <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6 flex items-center justify-center aspect-video">
        <div className="text-center text-white px-8">
          <div className="text-5xl mb-4">▶</div>
          <p className="text-sm text-gray-300 mb-4">Search YouTube for this lesson's video</p>
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Open YouTube Search →
          </a>
        </div>
      </div>

      {takeaways.length > 0 && (
        <div className="bg-indigo-50 rounded-xl p-6 mb-8">
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
