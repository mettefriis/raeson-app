import React, { useState } from 'react'
import QueryForm from './components/QueryForm.jsx'
import AssessmentResult from './components/AssessmentResult.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const EXAMPLE_QUERIES = [
  // Existing scenarios
  {
    label: "Facade insulation swap (mineral wool → phenolic foam)",
    query: "Contractor proposes Kingspan Kooltherm K15 instead of specified Rockwool Duorock 040 for facade insulation on a residential apartment building (5 floors, klasse 2) in Amsterdam."
  },
  {
    label: "Facade cladding swap (HPL → fiber cement)",
    query: "We need to substitute Trespa Meteon HPL panels with Eternit Equitone tectiva fiber cement panels on the facade cladding of a residential building, building class 2, in Rotterdam."
  },
  {
    label: "Facade cladding swap (HPL → timber panel)",
    query: "Contractor requests to use Prodema ProdEX natural wood panels instead of specified Trespa Meteon for facade cladding on a 6-storey residential building in Utrecht."
  },
  {
    label: "Fire door material change",
    query: "Can we use a Swedoor timber fire door EI30 instead of the specified Schuco ADS 80 FR 30 aluminium fire door in the common corridors of a residential apartment building, klasse 2?"
  },
  {
    label: "Window glazing downgrade",
    query: "Contractor proposes Pilkington Suncool HR++ double glazing instead of specified AGC iplus Top 1.1 triple glazing for windows in a new residential building, klasse 2, Amsterdam."
  },
  // New scenarios showing 3-layer value
  {
    label: "Carbon impact: low-carbon swap (EPS → mineral wool)",
    query: "Contractor proposes Rockwool Duorock 040 mineral wool instead of Knauf Therm TR 032 EPS for floor insulation on a residential building klasse 1 in Amsterdam."
  },
  {
    label: "Coastal durability: wood cladding in coastal zone",
    query: "Contractor proposes Prodema ProdEX wood panels instead of Eternit Equitone tectiva fibre cement for facade cladding on a residential building klasse 2 in Vlissingen coastal zone."
  },
  {
    label: "Compatibility risk: zinc cladding next to copper pipes",
    query: "Can we use VMZINC Anthra-Zinc standing seam cladding instead of Rockpanel Woods stone wool panels for facade cladding on a residential building klasse 2 in Amsterdam? The building has exposed copper rainwater pipes on the facade."
  },
]

const MONO = "'JetBrains Mono', monospace"

function RaesonMark({ size = 14, color = 'currentColor' }) {
  // s=3 stroke unit, 6×6 counter, 12×12 bowl, stem extends 8 below bowl
  return (
    <svg
      viewBox="0 0 23 23"
      width={size}
      height={size}
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* Left stem — full height */}
      <rect x="0" y="0" width="3" height="20" fill={color} />
      {/* Top bar */}
      <rect x="0" y="0" width="12" height="3" fill={color} />
      {/* Right side of bowl */}
      <rect x="9" y="0" width="3" height="12" fill={color} />
      {/* Bottom bar of bowl */}
      <rect x="0" y="9" width="12" height="3" fill={color} />
      {/* Diagonal leg */}
      <line x1="12" y1="12" x2="21" y2="21"
        stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

export default function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Running compliance checks...')
  const [error, setError] = useState(null)
  const [queryText, setQueryText] = useState('')

  async function handleSubmit(query, file) {
    setLoading(true)
    setLoadingMsg(file ? 'Reading floor plan...' : 'Running compliance checks...')
    setError(null)
    setResult(null)

    try {
      let res
      if (file) {
        // Multipart: text query + floor plan file
        const formData = new FormData()
        formData.append('query', query)
        formData.append('file', file)
        res = await fetch(`${API_BASE}/api/assess/with-plan`, {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch(`${API_BASE}/api/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Assessment failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f5', color: '#111110' }}>
      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(247,247,245,0.85)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5e5e3',
      }}>
        <nav style={{
          maxWidth: 800, margin: '0 auto', padding: '0 24px',
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RaesonMark size={14} color="#111110" />
            <span style={{
              fontFamily: MONO, fontWeight: 400,
              fontSize: 13, color: '#111110', letterSpacing: '-0.01em',
            }}>
              ræson
            </span>
            <span style={{
              fontFamily: MONO, fontSize: 10, color: '#9b9b99',
              border: '1px solid #e5e5e3', padding: '1px 6px',
              letterSpacing: '0.04em',
            }}>
              demo
            </span>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '88px 24px 80px' }}>

        {/* Query input */}
        <QueryForm
          value={queryText}
          onChange={setQueryText}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {/* Example scenarios */}
        <div style={{ marginTop: 14, marginBottom: 40 }}>
          <p style={{
            fontSize: 11, color: '#9b9b99', marginBottom: 8,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Try a scenario
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLE_QUERIES.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setQueryText(ex.query)
                  handleSubmit(ex.query, null)
                }}
                disabled={loading}
                style={{
                  fontSize: 11, padding: '4px 10px',
                  background: '#f7f7f5', border: '1px solid #e5e5e3',
                  cursor: 'pointer', color: '#6b6b69',
                  transition: 'all 0.1s', fontFamily: 'inherit',
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = '#111110'
                  e.currentTarget.style.color = '#111110'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = '#e5e5e3'
                  e.currentTarget.style.color = '#6b6b69'
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b', fontSize: 13, marginBottom: 24,
            fontWeight: 300,
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9b9b99' }}>
            <div style={{
              width: 20, height: 20, border: '1.5px solid #e5e5e3',
              borderTopColor: '#111110',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ fontSize: 13, fontWeight: 300, letterSpacing: '0.02em' }}>
              {loadingMsg}
            </p>
          </div>
        )}

        {/* Results */}
        {result && <AssessmentResult data={result} queryText={queryText} />}

        {/* Footer */}
        <footer style={{
          marginTop: 60, paddingTop: 20,
          borderTop: '1px solid #e5e5e3',
          fontSize: 11, color: '#c5c5c3', fontWeight: 300,
          letterSpacing: '0.02em',
        }}>
          ræson demo — Dutch building code (Bbl) compliance engine.
          Data is illustrative. Not for production use.
        </footer>
      </main>
    </div>
  )
}
