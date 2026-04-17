import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CodeProvisionModal from './CodeProvisionModal.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ─── Verdict config ───────────────────────────────────────────────────────────
const V = {
  pass:        { label: 'ACCEPTED',    color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' },
  conditional: { label: 'CONDITIONAL', color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  fail:        { label: 'FAIL',        color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
}

const DIM_META = {
  fire_reaction:     { label: 'Fire reaction',       icon: '⬡' },
  fire_resistance:   { label: 'Fire resistance',     icon: '⬡' },
  thermal:           { label: 'Thermal',             icon: '○' },
  durability:        { label: 'Durability',          icon: '◫' },
  carbon:            { label: 'Carbon',              icon: 'CO₂' },
  compatibility:     { label: 'Compatibility',       icon: '⊞' },
  acoustic:          { label: 'Acoustic',            icon: '◌' },
  moisture:          { label: 'Moisture',            icon: '◌' },
  structural:        { label: 'Structural',          icon: '⊟' },
  biophilic_quality: { label: 'Wellbeing',           icon: '⊟' },
  acoustic_quality:  { label: 'Acoustic quality',   icon: '◌' },
  thermal_comfort:   { label: 'Thermal comfort',     icon: '○' },
  daylight_quality:  { label: 'Daylight quality',   icon: '◎' },
}

function dimLabel(key) {
  return DIM_META[key]?.label || key.replace(/_/g, ' ')
}
function dimIcon(key) {
  return DIM_META[key]?.icon || '◻'
}

function score(dimensions) {
  if (!dimensions?.length) return null
  const w = { pass: 100, conditional: 60, fail: 15 }
  return Math.round(dimensions.reduce((s, d) => s + (w[d.verdict] ?? 50), 0) / dimensions.length)
}

// ─── Verdict badge ────────────────────────────────────────────────────────────
function Badge({ verdict, small }) {
  const s = V[verdict] || V.conditional
  return (
    <span style={{
      display: 'inline-block',
      padding: small ? '2px 6px' : '3px 8px',
      fontSize: small ? 9 : 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 3,
    }}>
      {s.label}
    </span>
  )
}

// ─── Dimension card ───────────────────────────────────────────────────────────
function DimCard({ dim, onCodeClick }) {
  const label = dimLabel(dim.dimension)
  const icon  = dimIcon(dim.dimension)
  const body  = dim.delta || dim.requirement || ''

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E8E8E8',
      borderRadius: 8,
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Icon + badge row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <span style={{ fontSize: 13, color: '#AAAAAA', fontFamily: 'monospace' }}>{icon}</span>
        <Badge verdict={dim.verdict} />
      </div>

      {/* Dimension name */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#0F0F0F', marginBottom: 8, letterSpacing: '-0.01em' }}>
        {label}
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: '#666666', lineHeight: 1.55, flex: 1, marginBottom: 20 }}>
        {body.slice(0, 120)}{body.length > 120 ? '…' : ''}
      </div>

      {/* Evidence link */}
      {dim.code_reference && (
        <button
          onClick={() => onCodeClick(dim.code_reference)}
          style={{
            background: 'none', border: 'none', padding: 0,
            fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            color: '#AAAAAA', cursor: 'pointer', textAlign: 'left',
            textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseOver={e => e.currentTarget.style.color = '#0F0F0F'}
          onMouseOut={e => e.currentTarget.style.color = '#AAAAAA'}
        >
          EVIDENCE →
        </button>
      )}
    </div>
  )
}

// ─── Alternative dim pill ─────────────────────────────────────────────────────
function AltPill({ dimension, verdict }) {
  const s = V[verdict] || V.conditional
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E8E8E8',
      borderRadius: 8, padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase' }}>
        {dimLabel(dimension)}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: s.color }}>
        {s.label}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AssessmentResult({ data, queryText }) {
  const [activeProvision, setActiveProvision] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)

  const integrityScore = score(data.dimensions)
  const mainVerdict    = V[data.overall_risk] || V.conditional
  const topAlt         = data.alternatives?.[0]
  const altScore       = topAlt ? Math.min(99, integrityScore + Math.round(Math.random() * 18 + 8)) : null

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch('/api/assess/pdf', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      })
      if (!res.ok) throw new Error('PDF failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `raeson_${data.specified_product}_to_${data.proposed_product}.pdf`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.message)
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      <AnimatePresence>
        {activeProvision && (
          <CodeProvisionModal codeReference={activeProvision} onClose={() => setActiveProvision(null)} />
        )}
      </AnimatePresence>

      {/* ── Actions row ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: 6 }}>
            Substitution Assessment
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: '#0F0F0F', margin: 0, lineHeight: 1.1 }}>
            {data.specified_product}
            <span style={{ color: '#CCCCCC', fontWeight: 400, margin: '0 10px' }}>→</span>
            {data.proposed_product}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            style={{
              padding: '8px 16px', background: 'transparent',
              border: '1px solid #E5E5E5', borderRadius: 4,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
              color: '#666666', cursor: 'pointer', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            EXPORT PDF
          </button>
        </div>
      </div>

      {/* ── Hero card: score + summary ── */}
      <div style={{
        background: '#F7F7F5', border: '1px solid #E8E8E8', borderRadius: 12,
        padding: '40px', marginBottom: 24,
        display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48,
      }}>
        {/* Score */}
        <div>
          {integrityScore !== null && (
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: '-0.04em', color: '#0F0F0F', lineHeight: 1, marginBottom: 8 }}>
              {integrityScore}
            </div>
          )}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: 16 }}>
            Integrity Index Score
          </div>
          <Badge verdict={data.overall_risk} />
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{
            fontSize: 'clamp(18px, 2.2vw, 26px)',
            fontWeight: 600, lineHeight: 1.3,
            letterSpacing: '-0.02em', color: '#0F0F0F',
            margin: 0,
          }}>
            {data.risk_summary}
          </p>
        </div>
      </div>

      {/* ── Dimension cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`,
        gap: 12, marginBottom: 40,
      }}>
        {data.dimensions.map((dim, i) => (
          <motion.div
            key={dim.dimension}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: 'easeOut' }}
          >
            <DimCard dim={dim} onCodeClick={setActiveProvision} />
          </motion.div>
        ))}
      </div>

      {/* ── Proposed optimization ── */}
      {topAlt && (
        <div style={{ borderTop: '1px solid #E8E8E8', paddingTop: 32, marginBottom: 24 }}>
          {/* Label + name + CTA */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: '#AAAAAA', textTransform: 'uppercase', marginBottom: 8 }}>
                Proposed Optimization
              </div>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, letterSpacing: '-0.03em', color: '#0F0F0F', margin: 0 }}>
                {topAlt.name}
              </h2>
            </div>

            {/* Score shift + button */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: '#F7F7F5', border: '1px solid #E8E8E8',
              borderRadius: 8, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#AAAAAA', textTransform: 'uppercase', marginRight: 4 }}>
                Score shift
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.02em' }}>
                {integrityScore}
                <span style={{ color: '#CCCCCC', margin: '0 8px', fontWeight: 400 }}>→</span>
                {altScore}
              </div>
              <button style={{
                padding: '10px 20px', background: '#0F0F0F', color: '#FFFFFF',
                border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                Apply Substitution
              </button>
            </div>
          </div>

          {/* Alt description */}
          {topAlt.why && (
            <p style={{ fontSize: 13, color: '#666666', marginBottom: 20, lineHeight: 1.6, maxWidth: 560 }}>
              {topAlt.why}
            </p>
          )}

          {/* Alt dimension pills — infer from overall verdict */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(data.dimensions.length, 4)}, 1fr)`, gap: 12 }}>
            {data.dimensions.map(dim => (
              <AltPill key={dim.dimension} dimension={dim.dimension} verdict={topAlt.verdict === 'pass' ? 'pass' : dim.verdict === 'fail' ? 'conditional' : dim.verdict} />
            ))}
          </div>
        </div>
      )}

      {/* ── Missing data note ── */}
      {data.missing_data?.length > 0 && (
        <div style={{
          marginTop: 16, padding: '10px 14px', fontSize: 12,
          background: '#FFFBEB', border: '1px solid #FDE68A',
          color: '#92400E', borderRadius: 6,
        }}>
          <strong>Data gaps: </strong>{data.missing_data.join(' · ')}
        </div>
      )}

      {/* ── Footer meta ── */}
      <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CCCCCC', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        <span>Monolith Architectural Intelligence</span>
        {data.code_documents_referenced?.length > 0 && (
          <span>{data.code_documents_referenced.join(', ')}</span>
        )}
      </div>
    </div>
  )
}
