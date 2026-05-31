export default function LessonSidebar({ curriculum, activeLessonId, onSelectLesson }) {
  const total = curriculum.lessons.length
  const complete = curriculum.lessons.filter(l => l.status === 'complete').length
  const pct = total ? Math.round((complete / total) * 100) : 0

  return (
    <div className="w-72 shrink-0 bg-white border-r border-gray-100 h-screen sticky top-0 flex flex-col overflow-y-auto">
      <div className="p-5 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 truncate">{curriculum.name}</h2>
        <p className="text-xs text-gray-400 mt-1 truncate">{curriculum.topic}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{pct}%</span>
        </div>
      </div>

      <ul className="flex-1 py-3">
        {curriculum.lessons.map(lesson => {
          const isActive = lesson.id === activeLessonId
          const isComplete = lesson.status === 'complete'

          return (
            <li key={lesson.id}>
              <button
                onClick={() => onSelectLesson(lesson.id)}
                className={`w-full text-left px-5 py-3 flex items-start gap-3 text-sm transition-colors
                  ${isActive ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}
                `}
              >
                <span className="shrink-0 mt-0.5 text-base">
                  {isComplete ? '✅' : isActive ? '▶' : '○'}
                </span>
                <div>
                  <div className={`font-medium leading-snug ${isComplete ? 'text-gray-400 line-through' : ''}`}>
                    {lesson.title}
                  </div>
                  <div className="text-xs capitalize text-gray-400 mt-0.5">{lesson.type}</div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
