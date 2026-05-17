const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzeAudio(file) {
  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch(`${BASE}/api/gemini/analyze`, {
    method: 'POST',
    body: fd,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {}
    throw new Error(detail)
  }

  return res.json()
}
