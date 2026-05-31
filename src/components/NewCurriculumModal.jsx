import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useCurriculum } from '../context/CurriculumContext'
import { generateCurriculum, generateVideoTakeaways } from '../api/anthropic'

export default function NewCurriculumModal({ onClose }) {
  const navigate = useNavigate()
  const { dispatch } = useCurriculum()
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('beginner')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    if (!name.trim() || !topic.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const result = await generateCurriculum(topic, level)
      const id = uuidv4()
      const now = new Date().toISOString()

      // Generate video takeaways in parallel for all video lessons
      const rawLessons = result.lessons
      const takeawaysMap = {}
      await Promise.all(
        rawLessons
          .filter(l => l.type === 'video')
          .map(async l => {
            try {
              const r = await generateVideoTakeaways(l.title, level)
              takeawaysMap[l.title] = r.keyTakeaways
            } catch {
              takeawaysMap[l.title] = []
            }
          })
      )

      const lessons = rawLessons.map((l, i) => ({
        id: uuidv4(),
        type: l.type,
        title: l.title,
        description: l.description,
        status: 'active',
        order: i,
        content: {
          ...(l.type === 'video' ? { youtubeQuery: l.youtubeQuery, keyTakeaways: takeawaysMap[l.title] || [] } : {}),
          ...(l.type === 'paper' ? { arxivQuery: l.arxivQuery, arxivTitle: l.arxivTitle } : {}),
        },
        tutorHistory: [],
        quiz: { questions: [], userAnswers: [], passed: false, attempts: 0 },
      }))

      const curriculum = { id, name, topic, level, createdAt: now, lastVisitedAt: now, lessons }
      dispatch({ type: 'ADD_CURRICULUM', curriculum })
      onClose()
      navigate(`/curriculum/${id}`)
    } catch (e) {
      setError(e.message || 'Failed to generate curriculum. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">New Curriculum</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Curriculum name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Deep Learning Fundamentals"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. transformer architecture in LLMs"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your level</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="beginner">Beginner</option>
              <option value="some_background">Some background</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                'Generate Curriculum'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
