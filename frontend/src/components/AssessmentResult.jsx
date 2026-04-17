import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CodeProvisionModal from './CodeProvisionModal.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const V = {
  pass:        { label: 'Accepted',    color: '#166534', bg: 'rgba(22,101,52,0.06)',  border: 'rgba(22,101,52,0.2)'  },
  conditional: { label: 'Conditional', color: '#92400e', bg: 'rgba(146,64,14,0.06)', border: 'rgba(146,64,14,0.2)' },
  fail:        { label: 'Fail',        color: '#991b1b', bg: 'rgba(153,27,27,0.06)', border: 'rgba(153,27,27,0.2)'  },
}

const DIM_LABELS = {
  fire_reaction: 'Fire reaction', fire_resistance: 'Fire resistance',
  thermal: 'Thermal', durability: 'Durability', carbon: 'Carbon',
  compatibility: 'Compatibility', acoustic: 'Acoustic', moisture: 'Moisture',
  structural: 'Structural', biophilic_quality: 'Wellbeing',
  acoustic_quality: 'Acoustic quality', thermal_comfort: 'Thermal comfort',
  daylight_quality: 'Daylight quality',
}

function label(key) { return DIM_LABELS[key] || key.replace(/_/g, ' ') }

function integrityScore(dims) {
  if (!dims?.length) return null
  const w = { pass: 100, conditional: 60, fail: 15 }
  return Math.round(dims.reduce((s, d) => s + (w[d.verdict] ?? 50), 0) / dims.length)
}

function firstSentences(text, n = 2) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  return sentences.slice(0, n).join(' ').trim()
}

function Badge({ verdict }) {
  const s = V[verdict] || V.conditional
  return (
    <span style={{
      padding: '2px 7px', fontSize: 10, fontWeight: 600,
      letterSpacing: '0.04em', borderRadius: 3,
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AssessmentResult({ data, queryText }) {
  const [activeProvision, setActiveProvision] = useState(null)
  const [exportingPdf, setExportingPdf]       = useState(false)

  const score   = integrityScore(data.dimensions)
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
    <div style={{ fontFamily: 'var(--font-sans)', color: '#0F0F0F' }}>
      <AnimatePresence>
        {activeProvision && <CodeProvisionModal codeReference={activeProvision} onClose={() => setActiveProvision(null)} />}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #EBEBEB' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 5px' }}>
            Substitution Assessment
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#0F0F0F', margin: 0, lineHeight: 1.2 }}>
            {data.specified_product}
            <span style={{ color: '#CCCCCC', fontWeight: 300, margin: '0 10px', fontSize: 16 }}>→</span>
            {data.proposed_product}
          </h1>
        </div>
        <button onClick={exportPdf} disabled={exportingPdf} style={{
          padding: '6px 14px', background: 'transparent', border: '1px solid #E0E0E0',
          borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
          color: '#888888', cursor: 'pointer', textTransform: 'uppercase',
        }}>
          {exportingPdf ? 'Generating…' : 'Export PDF'}
        </button>
      </div>

      {/* ── Score + summary ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0,
        background: '#F9F9F7', border: '1px solid #EBEBEB', borderRadius: 8,
        marginBottom: 20, overflow: 'hidden',
      }}>
        {/* Score block */}
        <div style={{ padding: '24px 20px', borderRight: '1px solid #EBEBEB' }}>
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: '#0F0F0F', marginBottom: 4 }}>
            {score ?? '—'}
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', marginBottom: 12 }}>
            Index score
          </div>
          <Badge verdict={data.overall_risk} />
        </div>

        {/* Summary */}
        <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.65, color: '#444444', margin: 0, letterSpacing: '-0.005em' }}>
            {firstSentences(data.risk_summary, 2)}
          </p>
        </div>
      </div>

      {/* ── Dimension grid ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`,
        gap: 10, marginBottom: 28,
      }}>
        {data.dimensions.map((dim, i) => (
          <motion.div key={dim.dimension}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
            style={{
              background: '#FFFFFF', border: '1px solid #EBEBEB',
              borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Top: label + badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '-0.01em', color: '#0F0F0F' }}>
                {label(dim.dimension)}
              </span>
              <Badge verdict={dim.verdict} />
            </div>

            {/* Body */}
            <p style={{ fontSize: 12, color: '#777777', lineHeight: 1.55, margin: '0 0 14px', flex: 1 }}>
              {(dim.delta || dim.requirement || '').slice(0, 110)}
            </p>

            {/* Evidence */}
            {dim.code_reference && (
              <button onClick={() => setActiveProvision(dim.code_reference)} style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#CCCCCC', cursor: 'pointer',
                textAlign: 'left',
              }}
                onMouseOver={e => e.currentTarget.style.color = '#333'}
                onMouseOut={e => e.currentTarget.style.color = '#CCCCCC'}
              >
                Evidence →
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Alternative ─────────────────────────────────────────────────── */}
      {topAlt && (
        <div style={{ border: '1px solid #EBEBEB', borderRadius: 8, overflow: 'hidden' }}>
          {/* Alt header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: '#F9F9F7', borderBottom: '1px solid #EBEBEB',
          }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#BBBBBB', margin: '0 0 3px' }}>
                Proposed Optimization
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#0F0F0F', margin: 0 }}>
                {topAlt.name}
              </p>
            </div>
            {/* Score shift */}
            {score != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#888888', letterSpacing: '-0.01em' }}>
                  <span style={{ color: '#0F0F0F', fontWeight: 600 }}>{score}</span>
                  <span style={{ margin: '0 6px', color: '#CCCCCC' }}>→</span>
                  <span style={{ color: '#166534', fontWeight: 600 }}>{altScore}</span>
                </div>
                <button style={{
                  padding: '8px 16px', background: '#0F0F0F', color: '#FFFFFF',
                  border: 'none', borderRadius: 4,
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                  textTransform: 'uppercase', cursor: 'pointer',
                }}>
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Alt why + dim row */}
          <div style={{ padding: '16px 20px' }}>
            {topAlt.why && (
              <p style={{ fontSize: 13, color: '#555555', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 600 }}>
                {topAlt.why}
              </p>
            )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`,
              gap: 8,
            }}>
              {data.dimensions.map(dim => {
                const improved = dim.verdict === 'fail' ? 'conditional' : dim.verdict === 'conditional' ? 'pass' : dim.verdict
                return (
                  <div key={dim.dimension} style={{
                    background: '#F9F9F7', border: '1px solid #EBEBEB',
                    borderRadius: 6, padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#AAAAAA', margin: '0 0 5px' }}>
                      {label(dim.dimension)}
                    </p>
                    <Badge verdict={improved} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Data gaps ───────────────────────────────────────────────────── */}
      {data.missing_data?.length > 0 && (
        <div style={{ marginTop: 14, padding: '9px 14px', fontSize: 12, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 6 }}>
          <strong style={{ fontWeight: 600 }}>Data gaps: </strong>{data.missing_data.join(' · ')}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      {data.code_documents_referenced?.length > 0 && (
        <p style={{ marginTop: 20, fontSize: 10, color: '#CCCCCC', letterSpacing: '0.04em' }}>
          Referenced: {data.code_documents_referenced.join(', ')}
        </p>
      )}
    </div>
  )
}
