import { useState, useRef, useCallback, useEffect } from 'react'

const ACCEPTED_EXTENSIONS = /\.(mp3|wav|ogg|webm|flac|m4a|aac|mp4)$/i
const ACCEPTED_MIME = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/webm', 'audio/ogg', 'audio/flac', 'audio/mp4',
  'audio/aac', 'audio/x-m4a',
])

function formatTime(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function isAudioFile(f) {
  return ACCEPTED_MIME.has(f.type) || ACCEPTED_EXTENSIONS.test(f.name)
}

export default function AudioInput({ onAnalyze }) {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  const [recError, setRecError] = useState(null)

  const fileInputRef = useRef()
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => () => clearInterval(timerRef.current), [])

  const selectFile = (f) => {
    if (!f) return
    if (!isAudioFile(f)) {
      alert('Please select an audio file (MP3, WAV, WebM, OGG, FLAC, M4A)')
      return
    }
    setFile(f)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    selectFile(e.dataTransfer.files[0])
  }, [])

  const startRecording = async () => {
    setRecError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        const cleanMime = mimeType.split(';')[0]
        const blob = new Blob(chunksRef.current, { type: cleanMime })
        const ext = cleanMime === 'audio/webm' ? 'webm' : 'ogg'
        setFile(new File([blob], `recording.${ext}`, { type: cleanMime }))
        setRecording(false)
        setRecTime(0)
      }

      mr.start(1000)
      setRecording(true)
      setRecTime(0)
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
    } catch {
      setRecError('Microphone access denied. Please allow microphone permissions and try again.')
    }
  }

  const stopRecording = () => mediaRecorderRef.current?.stop()

  return (
    <div className="w-full max-w-lg space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer select-none transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : file
              ? 'border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => selectFile(e.target.files[0])}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-slate-800 font-medium text-sm max-w-xs truncate">{file.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {(file.size / 1024 / 1024).toFixed(1)} MB · click to change
              </p>
            </div>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-slate-600 font-medium">Drop audio file here</p>
            <p className="text-slate-400 text-sm mt-1">MP3, WAV, WebM, OGG, FLAC, M4A — up to 100 MB</p>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Record / recording controls */}
      {recording ? (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-red-700 font-medium text-sm">Recording — {formatTime(recTime)}</span>
          </div>
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Stop
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3.5 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Record from microphone
        </button>
      )}

      {recError && (
        <p className="text-red-600 text-sm text-center">{recError}</p>
      )}

      {/* Analyze button */}
      <button
        onClick={() => file && onAnalyze(file)}
        disabled={!file}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
      >
        Analyze with Gemini →
      </button>
    </div>
  )
}
