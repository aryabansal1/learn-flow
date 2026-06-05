import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CurriculumView from './pages/CurriculumView'
import ApiKeyModal from './components/ApiKeyModal'

export default function App() {
  const [hasKey, setHasKey] = useState(
    () => !!(localStorage.getItem('anthropic_api_key') || import.meta.env.VITE_ANTHROPIC_API_KEY)
  )

  return (
    <BrowserRouter>
      {!hasKey && <ApiKeyModal onSave={() => setHasKey(true)} />}
      <Routes>
        <Route path="/" element={<Dashboard onClearKey={() => setHasKey(false)} />} />
        <Route path="/curriculum/:id" element={<CurriculumView />} />
      </Routes>
    </BrowserRouter>
  )
}
