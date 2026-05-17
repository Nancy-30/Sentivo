import { useState } from 'react'

const SENTIMENT_STYLES = {
  positive: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  negative: {
    badge: 'bg-red-100 text-red-800 border-red-200',
    dot: 'bg-red-400',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-300',
  },
}

function sentimentStyle(s) {
  return SENTIMENT_STYLES[s?.toLowerCase()] || SENTIMENT_STYLES.neutral
}

function SentimentBadge({ sentiment, score }) {
  const styles = sentimentStyle(sentiment)
  const label = sentiment
    ? sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase()
    : '—'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles.badge}`}>
      {label}
      {score !== undefined && (
        <span className="opacity-60 text-xs font-normal">
          {score > 0 ? '+' : ''}{score.toFixed(2)}
        </span>
      )}
    </span>
  )
}

function ConfidenceBar({ value }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full"
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  )
}

function confidenceLabel(v) {
  if (v >= 0.75) return { text: 'High', cls: 'text-emerald-600' }
  if (v >= 0.45) return { text: 'Medium', cls: 'text-amber-600' }
  return { text: 'Low', cls: 'text-red-500' }
}

function SentimentTimeline({ progression }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  if (!progression.length) return null

  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Conversation mood over time
      </h3>

      <div className="flex gap-px h-6 rounded-lg overflow-visible relative">
        {progression.map((p, i) => {
          const styles = sentimentStyle(p.sentiment)
          const isHovered = hoveredIdx === i
          return (
            <div
              key={i}
              className={`relative flex-1 ${styles.dot} cursor-default transition-opacity ${isHovered ? 'opacity-80' : ''}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {isHovered && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                    <p className="font-semibold capitalize">{p.sentiment}</p>
                    <p className="text-slate-300 mt-0.5">
                      {p.speaker} · {p.score > 0 ? '+' : ''}{p.score.toFixed(2)}
                    </p>
                    {p.text_snippet && (
                      <p className="text-slate-400 mt-1 max-w-[200px] truncate">"{p.text_snippet}"</p>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-slate-400">Start</span>
        <div className="flex items-center gap-4">
          {['positive', 'neutral', 'negative'].map(s => {
            const st = sentimentStyle(s)
            return (
              <span key={s} className="flex items-center gap-1 text-xs text-slate-500 capitalize">
                <span className={`w-2.5 h-2.5 rounded-sm ${st.dot}`} />
                {s}
              </span>
            )
          })}
        </div>
        <span className="text-xs text-slate-400">End</span>
      </div>
    </div>
  )
}

export default function AnalysisTab({ intent, sentiment }) {
  const hasSummary = intent.summary || sentiment.summary

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 space-y-5">

        {/* Summary — full width */}
        {hasSummary && (
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">Summary</h2>
                <p className="text-xs text-slate-400">What happened on this call</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-4">
              {intent.summary && (
                <p className="text-sm text-slate-700 leading-relaxed">{intent.summary}</p>
              )}
              {sentiment.summary && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-400 font-medium shrink-0">Emotional Arc</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{sentiment.summary}</p>
                </>
              )}
            </div>
          </section>
        )}

        {/* Intent + Sentiment side by side */}
        <div className="grid grid-cols-2 gap-5 items-start">

          {/* Intent card */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 text-sm">Intent</h2>
                <p className="text-xs text-slate-400">What this call is about</p>
              </div>
            </div>
            <div className="px-5 pt-3 pb-1">
              <span className="inline-block bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                {intent.primary_intent}
              </span>
            </div>

            {intent.intents.length > 0 && (
              <div className="px-5 pb-4 space-y-4">
                {intent.intents.map((item, i) => {
                  const { text: levelText, cls: levelCls } = confidenceLabel(item.confidence)
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{item.intent}</span>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          <span className={`text-xs font-medium ${levelCls}`}>{levelText}</span>
                          <span className="text-xs text-slate-400 tabular-nums">{item.confidence.toFixed(2)}</span>
                        </div>
                      </div>
                      <ConfidenceBar value={item.confidence} />
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Sentiment card */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 text-sm">Sentiment</h2>
                <p className="text-xs text-slate-400">Emotional tone of the call</p>
              </div>
            </div>
            <div className="px-5 pt-3 pb-1">
              <div className="mb-4">
                <SentimentBadge
                  sentiment={sentiment.overall_sentiment}
                  score={sentiment.overall_score}
                />
              </div>
            </div>

            <div className="px-5 pb-4 space-y-5">
              {sentiment.speaker_sentiments.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">By Speaker</h3>
                  <div className="space-y-3">
                    {sentiment.speaker_sentiments.map((ss, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-sm font-medium text-slate-600 w-24 shrink-0 pt-0.5">{ss.speaker}</span>
                        <div className="flex-1 min-w-0">
                          <SentimentBadge sentiment={ss.sentiment} score={ss.score} />
                          {ss.key_phrases.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {ss.key_phrases.map((phrase, j) => (
                                <span key={j} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                  "{phrase}"
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <SentimentTimeline progression={sentiment.progression} />
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
