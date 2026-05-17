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

/**
 * Stream audio analysis via SSE.
 * Calls onStatus(message) for progress events, onComplete(data) when done,
 * onError(Error) on failure. Throws on network errors.
 */
export async function analyzeAudioStream(file, { onStatus, onComplete, onError }) {
  const fd = new FormData()
  fd.append('file', file)

  let res
  try {
    res = await fetch(`${BASE}/api/gemini/analyze/stream`, {
      method: 'POST',
      body: fd,
    })
  } catch (err) {
    throw new Error('Network error: ' + err.message)
  }

  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {}
    throw new Error(detail)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    // SSE messages are separated by double newlines
    const parts = buffer.split('\n\n')
    buffer = parts.pop() // keep any incomplete trailing part

    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'status') onStatus?.(event.message)
        else if (event.type === 'complete') onComplete?.(event.data)
        else if (event.type === 'error') onError?.(new Error(event.message))
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}
