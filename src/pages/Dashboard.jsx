import { useState } from 'react'
import { useCurriculum } from '../context/CurriculumContext'
import CurriculumCard from '../components/CurriculumCard'
import NewCurriculumModal from '../components/NewCurriculumModal'

export default function Dashboard({ onClearKey }) {
  const { state } = useCurriculum()
  const [showModal, setShowModal] = useState(false)

  function handleChangeKey() {
    localStorage.removeItem('anthropic_api_key')
    onClearKey()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">LearnFlow</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleChangeKey}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Change API Key
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Curriculum
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {state.curricula.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-xl font-medium mb-2">No curricula yet</p>
            <p className="text-sm">Create your first one to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.curricula.map(c => (
              <CurriculumCard key={c.id} curriculum={c} />
            ))}
          </div>
        )}
      </main>

      {showModal && <NewCurriculumModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
