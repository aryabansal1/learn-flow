export async function searchArxiv(query) {
  const params = new URLSearchParams({ query })
  const res = await fetch(`http://localhost:8000/api/search?${params}`)
  if (!res.ok) throw new Error('arXiv search failed')
  return res.json() // { arxivId, title, abstract }
}
