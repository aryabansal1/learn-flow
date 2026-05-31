import { useNavigate } from 'react-router-dom'
import { useCurriculum } from '../context/CurriculumContext'

export default function CurriculumCard({ curriculum }) {
  const navigate = useNavigate()
  const { handleDelete } = useCurriculum()

  const total = curriculum.lessons?.length || 0
  const complete = curriculum.lessons?.filter(l => l.status === 'complete').length || 0
  const pct = total ? Math.round((complete / total) * 100) : 0
  const lastVisited = curriculum.lastVisitedAt
    ? new Date(curriculum.lastVisitedAt).toLocaleDateString()
    : 'Never'

  function onDelete() {
    if (window.confirm(`Delete "${curriculum.name}"?`)) {
      handleDelete(curriculum.id)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 truncate">{curriculum.name}</h3>
        <p className="text-sm text-gray-500 mt-1 truncate">{curriculum.topic}</p>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{complete} of {total} lessons complete</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400">Last visited: {lastVisited}</p>

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => navigate(`/curriculum/${curriculum.id}`)}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Resume
        </button>
        <button
          onClick={onDelete}
          className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
