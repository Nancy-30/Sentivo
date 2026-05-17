import { useState, useRef, useEffect } from 'react'

function fmt(s) {
  if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function AudioPlayer({ src, fileName, speakersDetected, durationSeconds }) {
  const audioRef = useRef()
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationSeconds || 0)

  // Reset player state when a new file is loaded
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
  }, [src])

  const toggle = () => {
    if (!audioRef.current) return
    playing ? audioRef.current.pause() : audioRef.current.play()
  }

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  return (
    <div className="bg-slate-900 px-5 py-3 flex items-center gap-4 shrink-0">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
      />

      {/* Play / Pause */}
      <button
        onClick={toggle}
        className="w-8 h-8 shrink-0 bg-indigo-500 hover:bg-indigo-400 text-white rounded-full flex items-center justify-center transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Current / total time */}
      <span className="text-xs text-slate-400 tabular-nums shrink-0 w-24">
        {fmt(currentTime)} / {fmt(duration)}
      </span>

      {/* Seek bar — custom two-layer slider */}
      <div className="flex-1 relative flex items-center h-5 group">
        {/* Track */}
        <div className="absolute inset-x-0 h-1 bg-slate-700 rounded-full pointer-events-none">
          <div
            className="h-full bg-indigo-500 rounded-full transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Thumb dot */}
        <div
          className="absolute w-3 h-3 bg-white rounded-full shadow pointer-events-none -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${pct}%` }}
        />
        {/* Transparent range input for interaction */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label="Seek"
        />
      </div>

      {/* File name */}
      <span className="text-xs text-slate-400 max-w-[140px] truncate shrink-0">{fileName}</span>

      {/* Speakers badge */}
      <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full shrink-0 font-medium">
        {speakersDetected} speaker{speakersDetected !== 1 ? 's' : ''}
      </span>
    </div>
  )
}
