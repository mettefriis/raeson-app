import React, { useRef, useState } from 'react'

export default function QueryForm({ value, onChange, onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  function handleSubmit(e) {
    e.preventDefault()
    if (value.trim()) onSubmit(value.trim(), file || null)
  }

  function acceptFile(f) {
    if (!f) return
    const ok = /\.(jpe?g|png|webp|ifc)$/i.test(f.name)
    if (ok) setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    acceptFile(f)
  }

  function handleFileInput(e) {
    acceptFile(e.target.files[0])
  }

  function removeFile(e) {
    e.stopPropagation()
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="block text-[11px] text-muted mb-3 font-medium uppercase tracking-widest">
        Describe the substitution scenario
      </label>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Contractor proposes Kingspan Kooltherm K15 instead of specified Rockwool Duorock 040 for facade insulation on a residential building (klasse 2) in Amsterdam."
        rows={4}
        className="w-full px-0 py-3 text-sm bg-transparent text-ink border-0 border-b border-rule resize-none outline-none transition-colors duration-150 leading-relaxed placeholder:text-muted"
        style={{ borderRadius: 0 }}
        onFocus={e => e.target.style.borderBottomColor = '#171717'}
        onBlur={e => e.target.style.borderBottomColor = '#e5e5e5'}
      />

      {/* Floor plan drop zone */}
      <div
        onClick={() => !file && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className="mt-3 px-0 py-2.5 flex items-center gap-2.5 transition-all duration-150 min-h-[38px] border-b"
        style={{
          borderColor: dragging ? '#171717' : file ? '#009767' : '#e5e5e5',
          background: 'transparent',
          cursor: file ? 'default' : 'pointer',
        }}
      >
        {file ? (
          <>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" stroke="#009767" strokeWidth="1.5" rx="2"/>
              <polyline points="3.5,7 6,9.5 10.5,4.5" stroke="#009767" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
            <span className="text-12 text-pass flex-1">
              {file.name}
              <span className="text-muted ml-1.5">({(file.size / 1024).toFixed(0)} KB)</span>
            </span>
            <button
              type="button"
              onClick={removeFile}
              className="text-muted hover:text-ink transition-colors text-base leading-none px-0.5"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" stroke="#c4c4c4" strokeWidth="1.5"/>
              <line x1="7" y1="4" x2="7" y2="10" stroke="#c4c4c4" strokeWidth="1.5"/>
              <line x1="4" y1="7" x2="10" y2="7" stroke="#c4c4c4" strokeWidth="1.5"/>
            </svg>
            <span className="text-12 text-muted">
              Drop floor plan here for daylight assessment
              <span className="text-dim ml-1.5">— JPG, PNG, or IFC</span>
            </span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.ifc"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="mt-2.5 px-6 py-2.5 text-13 font-medium text-white rounded-lg transition-opacity duration-150 disabled:cursor-default"
        style={{
          background: loading || !value.trim() ? '#a3a3a3' : '#009767',
          letterSpacing: '-0.01em',
        }}
      >
        {loading ? 'Assessing...' : 'Assess substitution'}
      </button>
    </form>
  )
}
