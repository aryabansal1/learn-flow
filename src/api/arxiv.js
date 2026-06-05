const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export async function searchArxiv(query) {
  const params = new URLSearchParams({ query })
  const res = await fetch(`${BACKEND_URL}/api/search?${params}`)
  if (!res.ok) throw new Error('arXiv search failed')
  return res.json()
}
