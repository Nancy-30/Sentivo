import { useState } from 'react'

// Speaker 1 → right side (indigo, like "you")
// Speaker 2 → left side (slate, like "them")
// Any additional speakers fall back to left with their own color
const SPEAKER_STYLES = {
  right: {
    avatar: 'bg-indigo-600',
    bubble: 'bg-indigo-600 text-white',
    label: 'text-indigo-600',
    timestamp: 'text-indigo-300',
  },
  left: {
    avatar: 'bg-slate-500',
    bubble: 'bg-white border border-slate-200 text-slate-800',
    label: 'text-slate-500',
    timestamp: 'text-slate-300',
  },
}

function formatTime(s) {
  if (!s && s !== 0) return ''
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// Determine which speaker is "Speaker 1" (right) by finding the first speaker
// whose name contains "1" or is the first unique speaker encountered
function buildSideMap(segments) {
  const order = []
  for (const seg of segments) {
    if (!order.includes(seg.speaker)) order.push(seg.speaker)
  }
  // Speaker 1 (or whichever appears first) goes on the right
  const map = {}
  order.forEach((speaker, i) => {
    map[speaker] = i === 0 ? 'right' : 'left'
  })
  return map
}

export default function TranscriptTab({ transcript }) {
  const { segments, full_text, speakers_detected } = transcript
  const [copied, setCopied] = useState(false)
  const sideMap = buildSideMap(segments)

  const handleCopy = () => {
    navigator.clipboard.writeText(full_text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — chat view */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-5 space-y-3">
        {/* Legend */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-xs text-slate-500 font-medium">
              {Object.entries(sideMap).find(([, side]) => side === 'left')?.[0] ?? 'Speaker 2'}
            </span>
          </div>
          <span className="text-xs text-slate-300">
            {segments.length} turns · {speakers_detected} speaker{speakers_detected !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-600 font-medium">
              {Object.entries(sideMap).find(([, side]) => side === 'right')?.[0] ?? 'Speaker 1'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          </div>
        </div>

        {segments.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">No segments available.</p>
        ) : (
          segments.map((seg, i) => {
            const side = sideMap[seg.speaker] ?? 'left'
            const styles = SPEAKER_STYLES[side]
            const isRight = side === 'right'
            const initial = seg.speaker.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase() || '?'
            const showTimestamp = seg.start > 0 || seg.end > 0

            return (
              <div key={i} className={`flex items-end gap-2.5 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${styles.avatar}`}>
                  {initial}
                </div>

                {/* Bubble + meta */}
                <div className={`flex flex-col max-w-[72%] ${isRight ? 'items-end' : 'items-start'}`}>
                  {/* Speaker name + timestamp */}
                  <div className={`flex items-baseline gap-1.5 mb-1 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`text-xs font-semibold ${styles.label}`}>{seg.speaker}</span>
                    {showTimestamp && (
                      <span className={`text-xs ${styles.timestamp}`}>{formatTime(seg.start)}</span>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${styles.bubble} ${
                    isRight ? 'rounded-br-sm' : 'rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{seg.text}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Right — full transcript */}
      <div className="w-72 lg:w-80 xl:w-96 shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Transcript</h2>
          <button
            onClick={handleCopy}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {full_text ? (
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{full_text}</p>
          ) : (
            <p className="text-slate-400 text-sm">No transcript available.</p>
          )}
        </div>
      </div>
    </div>
  )
}
