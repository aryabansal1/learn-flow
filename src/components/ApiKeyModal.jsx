import { useState } from 'react'

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('')
  const [error, setError] = useState(null)

  function handleSave() {
    if (!key.trim().startsWith('sk-ant-')) {
      setError('Key should start with sk-ant-')
      return
    }
    localStorage.setItem('anthropic_api_key', key.trim())
    onSave()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LearnFlow</h2>
        <p className="text-sm text-gray-500 mb-6">
          Paste your Anthropic API key to get started. It's stored only in your browser and never sent anywhere except Anthropic's API.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Anthropic API Key</label>
            <input
              type="password"
              value={key}
              onChange={e => { setKey(e.target.value); setError(null) }}
              placeholder="sk-ant-..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <p className="text-xs text-gray-400">
            Don't have a key?{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
              Get one at console.anthropic.com
            </a>
          </p>

          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  )
}
