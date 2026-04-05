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

  const dropBorder = dragging
    ? '1px dashed #111110'
    : file
      ? '1px dashed #15803d'
      : '1px dashed #c5c5c3'

  const dropBg = dragging
    ? '#f0fdf4'
    : file
      ? '#f0fdf4'
      : 'transparent'

  return (
    <form onSubmit={handleSubmit}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 400,
        color: '#6b6b69', marginBottom: 8,
        letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        Describe the substitution scenario
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="e.g., Contractor proposes Kingspan Kooltherm K15 instead of specified Rockwool Duorock 040 for facade insulation on a residential building (klasse 2) in Amsterdam."
        rows={4}
        style={{
          width: '100%', padding: '12px 14px',
          fontSize: 14, fontFamily: 'inherit', fontWeight: 300,
          border: '1px solid #e5e5e3',
          resize: 'vertical', outline: 'none',
          transition: 'border-color 0.1s',
          background: '#ffffff', color: '#111110',
          lineHeight: 1.7, boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#111110'}
        onBlur={e => e.target.style.borderColor = '#e5e5e3'}
      />

      {/* Floor plan drop zone */}
      <div
        onClick={() => !file && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          marginTop: 8,
          padding: '10px 14px',
          border: dropBorder,
          background: dropBg,
          cursor: file ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          transition: 'all 0.1s',
          minHeight: 38,
        }}
      >
        {file ? (
          <>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" rx="0" stroke="#15803d" strokeWidth="1.5"/>
              <polyline points="3.5,7 6,9.5 10.5,4.5" stroke="#15803d" strokeWidth="1.5" fill="none" strokeLinecap="square"/>
            </svg>
            <span style={{ fontSize: 12, color: '#15803d', flex: 1, fontWeight: 300 }}>
              {file.name}
              <span style={{ color: '#9b9b99', marginLeft: 6 }}>
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
            </span>
            <button
              type="button"
              onClick={removeFile}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9b9b99', fontSize: 16, padding: '0 2px', lineHeight: 1,
                fontFamily: 'inherit',
              }}
              title="Remove file"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="12" height="12" stroke="#c5c5c3" strokeWidth="1.5"/>
              <line x1="7" y1="4" x2="7" y2="10" stroke="#c5c5c3" strokeWidth="1.5"/>
              <line x1="4" y1="7" x2="10" y2="7" stroke="#c5c5c3" strokeWidth="1.5"/>
            </svg>
            <span style={{ fontSize: 12, color: '#9b9b99', fontWeight: 300 }}>
              Drop floor plan here for daylight assessment
              <span style={{ marginLeft: 6, color: '#c5c5c3' }}>
                — JPG, PNG, or IFC
              </span>
            </span>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.ifc"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !value.trim()}
        style={{
          marginTop: 10, padding: '10px 24px',
          fontSize: 13, fontWeight: 400,
          background: loading || !value.trim() ? '#9b9b99' : '#111110',
          color: '#ffffff', border: 'none',
          cursor: loading ? 'wait' : !value.trim() ? 'default' : 'pointer',
          transition: 'background 0.1s',
          letterSpacing: '0.01em',
          fontFamily: 'inherit',
        }}
      >
        {loading ? 'Assessing...' : 'Assess substitution'}
      </button>
    </form>
  )
}
