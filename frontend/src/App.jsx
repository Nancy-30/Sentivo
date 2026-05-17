import { useState, useCallback } from 'react'
import AudioInput from './components/AudioInput'
import AudioPlayer from './components/AudioPlayer'
import TranscriptTab from './components/TranscriptTab'
import AnalysisTab from './components/AnalysisTab'
import { analyzeAudioStream } from './api'

const TABS = [
  { id: 'transcript', label: 'Transcript' },
  { id: 'analysis', label: 'Analysis' },
]

function MicIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  )
}

function LoadingView({ fileName, statusMessage }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-indigo-100 rounded-full" />
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MicIcon className="w-5 h-5 text-indigo-400" />
        </div>
      </div>
      <div className="text-center max-w-sm px-4">
        <p className="text-slate-800 font-semibold text-lg">Analyzing with Gemini</p>
        <p className="text-slate-400 text-sm mt-1 truncate">{fileName}</p>
        <p className="text-slate-400 text-xs mt-3 min-h-[1rem] transition-all duration-300">
          {statusMessage || 'Connecting…'}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [stage, setStage] = useState('input')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [audioUrl, setAudioUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('transcript')
  const [statusMessage, setStatusMessage] = useState('')

  const handleAnalyze = useCallback(async (file) => {
    setFileName(file.name)
    setAudioUrl(URL.createObjectURL(file))
    setError(null)
    setStatusMessage('')
    setStage('loading')

    try {
      await analyzeAudioStream(file, {
        onStatus: setStatusMessage,
        onComplete: (data) => {
          setResult(data)
          setActiveTab('transcript')
          setStage('result')
        },
        onError: (err) => {
          setError(err.message)
          setStage('input')
        },
      })
    } catch (err) {
      setError(err.message)
      setStage('input')
    }
  }, [])

  const handleReset = useCallback(() => {
    setStage('input')
    setResult(null)
    setError(null)
    setFileName('')
    setStatusMessage('')
    setAudioUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
  }, [])

  if (stage === 'loading') return <LoadingView fileName={fileName} statusMessage={statusMessage} />

  if (stage === 'result' && result) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            New analysis
          </button>
          <span className="text-slate-200">|</span>
          <span className="text-slate-700 font-medium text-sm truncate max-w-xs">{fileName}</span>
        </header>

        {/* Audio player */}
        {audioUrl && (
          <AudioPlayer
            src={audioUrl}
            fileName={fileName}
            speakersDetected={result.transcript.speakers_detected}
            durationSeconds={result.transcript.duration_seconds}
          />
        )}

        {/* Tab bar */}
        <nav className="bg-white border-b border-slate-200 px-5 flex shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <main className="flex-1 min-h-0">
          {activeTab === 'transcript' && <TranscriptTab transcript={result.transcript} />}
          {activeTab === 'analysis' && <AnalysisTab intent={result.intent} sentiment={result.sentiment} />}
        </main>
      </div>
    )
  }

  // Input stage
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <header className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
          <MicIcon className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sentivo</h1>
        <p className="text-slate-500 mt-2">Upload or record a call — get intent & sentiment in seconds</p>
      </header>

      {error && (
        <div className="mb-5 w-full max-w-lg bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <AudioInput onAnalyze={handleAnalyze} />
    </div>
  )
}
