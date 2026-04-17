import React, { useRef, useState } from 'react'

const C = {
  bg:      '#FFFFFF',
  surface: '#F5F5F5',
  card:    '#FFFFFF',
  border:  '#E5E5E5',
  borderFocus: '#0F0F0F',
  text:    '#0F0F0F',
  dim:     '#666666',
  muted:   '#AAAAAA',
}

export default function QueryForm({ value, onChange, onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
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
    acceptFile(e.dataTransfer.files[0])
  }

  function removeFile(e) {
    e.stopPropagation()
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Main input card */}
      <div style={{
        background: C.card,
        border: `1px solid ${focused ? C.borderFocus : C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        marginBottom: 12,
      }}>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe your material substitution…"
          rows={5}
          style={{
            width: '100%', padding: '20px 24px',
            background: 'transparent', color: C.text,
            border: 'none', resize: 'none', outline: 'none',
            fontSize: 15, lineHeight: 1.65,
            letterSpacing: '-0.01em',
            fontFamily: 'var(--font-sans)',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.shiftKey) && value.trim()) {
              e.preventDefault()
              onSubmit(value.trim(), file || null)
            }
          }}
        />

        {/* Bottom toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: `1px solid ${C.border}`,
          background: C.surface,
        }}>
          {/* File drop */}
          <div
            onClick={() => !file && fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: file ? 'default' : 'pointer',
            }}
          >
            {file ? (
              <>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" stroke="#009767" strokeWidth="1.5" rx="2"/>
                  <polyline points="3.5,7 6,9.5 10.5,4.5" stroke="#009767" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 11, color: '#009767' }}>
                  {file.name}
                  <span style={{ color: C.muted, marginLeft: 6 }}>({(file.size / 1024).toFixed(0)} KB)</span>
                </span>
                <button type="button" onClick={removeFile}
                  style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '0 2px', fontSize: 14 }}>
                  ×
                </button>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" stroke={dragging ? C.dim : C.muted} strokeWidth="1.5"/>
                  <line x1="7" y1="4" x2="7" y2="10" stroke={dragging ? C.dim : C.muted} strokeWidth="1.5"/>
                  <line x1="4" y1="7" x2="10" y2="7" stroke={dragging ? C.dim : C.muted} strokeWidth="1.5"/>
                </svg>
                <span style={{ fontSize: 11, color: C.muted }}>
                  Reference — <span style={{ color: C.muted, opacity: 0.6 }}>JPG, PNG, or IFC</span>
                </span>
              </>
            )}
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.ifc"
              style={{ display: 'none' }} onChange={e => acceptFile(e.target.files[0])} />
          </div>

          {/* Status + submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {loading ? '● Analysing' : '● A.I. Engine ready'}
            </span>
            <button
              type="submit"
              disabled={loading || !value.trim()}
              style={{
                padding: '7px 18px',
                background: loading || !value.trim() ? C.surface : C.text,
                color: loading || !value.trim() ? C.muted : C.bg,
                border: `1px solid ${loading || !value.trim() ? C.border : C.text}`,
                fontSize: 12, fontWeight: 500,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                borderRadius: 4, cursor: loading || !value.trim() ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loading ? 'Analysing...' : 'Analyse'}
            </button>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.04em' }}>
        Shift+Enter or ⌘+Enter to submit
      </p>
    </form>
  )
}
