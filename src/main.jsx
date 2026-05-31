import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { CurriculumProvider } from './context/CurriculumContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CurriculumProvider>
      <App />
    </CurriculumProvider>
  </React.StrictMode>,
)
