import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import CurriculumView from './pages/CurriculumView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/curriculum/:id" element={<CurriculumView />} />
      </Routes>
    </BrowserRouter>
  )
}
