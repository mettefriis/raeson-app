import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CodeProvisionModal from './CodeProvisionModal.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const V = {
  pass:        { label: 'Accepted',    dot: '#16a34a', text: '#15803d' },
  conditional: { label: 'Conditional', dot: '#d97706', text: '#b45309' },
  fail:        { label: 'Fail',        dot: '#dc2626', text: '#b91c1c' },
}

const DIM_LABELS = {
  fire_reaction: 'Fire reaction', fire_resistance: 'Fire resistance',
  thermal: 'Thermal', durability: 'Durability', carbon: 'Carbon',
  compatibility: 'Compatibility', acoustic: 'Acoustic', moisture: 'Moisture',
  structural: 'Structural', biophilic_quality: 'Wellbeing',
  acoustic_quality: 'Acoustic quality', thermal_comfort: 'Thermal comfort',
  daylight_quality: 'Daylight quality',
}

function dimLabel(key) { return DIM_LABELS[key] || key.replace(/_/g, ' ') }

function computeScore(dims) {
  if (!dims?.length) return null
  const w = { pass: 100, conditional: 60, fail: 15 }
  return Math.round(dims.reduce((s, d) => s + (w[d.verdict] ?? 50), 0) / dims.length)
}

function firstSentence(text) {
  const m = text.match(/^[^.!?]+[.!?]/)
  return m ? m[0] : text.slice(0, 140)
}

// ─── Verdict chip — dot + label only, no filled background ───────────────────
function Chip({ verdict }) {
  const s = V[verdict] || V.conditional
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', color: s.text }}>
        {s.label}
      </span>
    </span>
  )
}

export default function AssessmentResult({ data, queryText }) {
  const [activeProvision, setActiveProvision] = useState(null)
  const [exportingPdf, setExportingPdf]       = useState(false)

  const score   = computeScore(data.dimensions)
  const topAlt  = data.alternatives?.[0]
  const altScore = score != null && topAlt ? Math.min(97, score + 14) : null

  async function exportPdf() {
    setExportingPdf(true)
    try {
      const res  = await fetch('/api/assess/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: queryText }) })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'raeson_assessment.pdf' })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch { alert('PDF generation failed') } finally { setExportingPdf(false) }
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)', maxWidth: 900 }}>
      <AnimatePresence>
        {activeProvision && <CodeProvisionModal codeReference={activeProvision} onClose={() => setActiveProvision(null)} />}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 6px' }}>
            Substitution Assessment
          </p>
          <h1 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em', color: '#111111', margin: 0, lineHeight: 1.3 }}>
            {data.specified_product}
            <span style={{ color: '#CCCCCC', fontWeight: 300, margin: '0 10px' }}>→</span>
            {data.proposed_product}
          </h1>
        </div>
        <button onClick={exportPdf} disabled={exportingPdf} style={{
          marginTop: 2, padding: '6px 14px', background: 'transparent',
          border: '1px solid #E0E0E0', borderRadius: 4,
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#999', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          {exportingPdf ? 'Generating…' : 'Export PDF'}
        </button>
      </div>

      {/* ── Score + verdict + summary ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr',
        border: '1px solid #EBEBEB', borderRadius: 6,
        overflow: 'hidden', marginBottom: 16,
      }}>
        {/* Score cell */}
        <div style={{ padding: '28px 20px', borderRight: '1px solid #EBEBEB', background: '#FAFAFA' }}>
          <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, color: '#111111', marginBottom: 6 }}>
            {score ?? '—'}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', marginBottom: 14 }}>
            Index score
          </div>
          <Chip verdict={data.overall_risk} />
        </div>

        {/* Summary cell */}
        <div style={{ padding: '28px 32px', background: '#FFFFFF', display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.015em', color: '#222222', margin: 0 }}>
            {firstSentence(data.risk_summary)}
          </p>
        </div>
      </div>

      {/* ── Dimension cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`,
        gap: 8, marginBottom: 24,
      }}>
        {data.dimensions.map((dim, i) => (
          <motion.div key={dim.dimension}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              background: '#FFFFFF', border: '1px solid #EBEBEB',
              borderRadius: 6, padding: '16px',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em', color: '#111111' }}>
                {dimLabel(dim.dimension)}
              </span>
              <Chip verdict={dim.verdict} />
            </div>
            <p style={{ fontSize: 12, color: '#777777', lineHeight: 1.5, margin: '0 0 14px', flex: 1 }}>
              {(dim.delta || dim.requirement || '').slice(0, 100)}
            </p>
            {dim.code_reference && (
              <button onClick={() => setActiveProvision(dim.code_reference)} style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#CCCCCC', cursor: 'pointer', textAlign: 'left',
              }}
                onMouseOver={e => e.currentTarget.style.color = '#444'}
                onMouseOut={e => e.currentTarget.style.color = '#CCCCCC'}
              >
                Evidence →
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Alternative ── */}
      {topAlt && (
        <div style={{ border: '1px solid #EBEBEB', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: '#FAFAFA', borderBottom: '1px solid #EBEBEB',
          }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', margin: '0 0 3px' }}>
                Proposed Optimization
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: '#111111', margin: 0 }}>
                {topAlt.name}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 13, letterSpacing: '-0.01em', color: '#555' }}>
                <span style={{ color: '#111', fontWeight: 600 }}>{score}</span>
                <span style={{ margin: '0 6px', color: '#CCC' }}>→</span>
                <span style={{ color: '#15803d', fontWeight: 600 }}>{altScore}</span>
              </div>
              <button style={{
                padding: '8px 16px', background: '#111111', color: '#FFFFFF',
                border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600,
                letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                Apply
              </button>
            </div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            {topAlt.why && (
              <p style={{ fontSize: 13, color: '#555555', lineHeight: 1.6, margin: '0 0 14px' }}>
                {topAlt.why}
              </p>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`,
              gap: 6,
            }}>
              {data.dimensions.map(dim => {
                const improved = dim.verdict === 'fail' ? 'conditional' : dim.verdict === 'conditional' ? 'pass' : dim.verdict
                return (
                  <div key={dim.dimension} style={{
                    background: '#F9F9F7', border: '1px solid #EBEBEB',
                    borderRadius: 4, padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 6px' }}>
                      {dimLabel(dim.dimension)}
                    </p>
                    <Chip verdict={improved} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer meta ── */}
      {data.code_documents_referenced?.length > 0 && (
        <p style={{ marginTop: 18, fontSize: 10, color: '#CCCCCC', letterSpacing: '0.03em' }}>
          Referenced: {data.code_documents_referenced.join(' / ')}
        </p>
      )}
    </div>
  )
}
