import React, { useState } from 'react'
import CodeProvisionModal from './CodeProvisionModal.jsx'

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const V = {
  pass:        { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#16a34a', label: 'PASS' },
  conditional: { bg: '#fefce8', border: '#fef08a', color: '#a16207', dot: '#ca8a04', label: 'CONDITIONAL' },
  fail:        { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#dc2626', label: 'FAIL' },
}

// ---------------------------------------------------------------------------
// Dimension metadata
// ---------------------------------------------------------------------------
const DIM_META = {
  fire_reaction:    { label: 'Fire reaction',        group: 'compliance' },
  fire_resistance:  { label: 'Fire resistance',      group: 'compliance' },
  thermal:          { label: 'Thermal performance',  group: 'compliance' },
  durability:       { label: 'Durability',           group: 'compliance' },
  carbon:           { label: 'Embodied carbon',      group: 'compliance' },
  compatibility:    { label: 'Compatibility',        group: 'compliance' },
  acoustic:         { label: 'Acoustic',             group: 'compliance' },
  moisture:         { label: 'Moisture',             group: 'compliance' },
  structural:       { label: 'Structural',           group: 'compliance' },
  biophilic_quality:'Biophilic quality',
  acoustic_quality: 'Acoustic quality',
  thermal_comfort:  'Thermal comfort',
  daylight_quality: 'Daylight quality',
}

const WELLBEING_DIMS = new Set([
  'biophilic_quality', 'acoustic_quality', 'thermal_comfort', 'daylight_quality'
])

// Sort order: fail first, then conditional, then pass
const VERDICT_ORDER = { fail: 0, conditional: 1, pass: 2 }

function sortedDims(dims) {
  return [...dims].sort((a, b) => {
    const ao = VERDICT_ORDER[a.verdict] ?? 3
    const bo = VERDICT_ORDER[b.verdict] ?? 3
    return ao - bo
  })
}

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function VerdictBadge({ verdict, large }) {
  const s = V[verdict] || V.conditional
  return (
    <span style={{
      display: 'inline-block',
      padding: large ? '4px 12px' : '2px 8px',
      fontSize: large ? 11 : 10,
      fontWeight: 500,
      letterSpacing: '0.08em',
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
    }}>
      {s.label}
    </span>
  )
}

function Dot({ verdict }) {
  const s = V[verdict] || V.conditional
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7,
      borderRadius: '50%',
      background: s.dot,
      flexShrink: 0,
      marginTop: 1,
    }} />
  )
}

function CodeRef({ reference, onClick }) {
  return (
    <button
      onClick={() => onClick(reference)}
      style={{
        background: 'none', border: 'none', padding: 0,
        fontSize: 11, color: '#111110', cursor: 'pointer',
        textDecoration: 'underline', textDecorationStyle: 'dotted',
        textUnderlineOffset: 2, fontFamily: 'inherit',
      }}
    >
      {reference}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Matrix row — compact summary, expands to full detail
// ---------------------------------------------------------------------------

function MatrixRow({ dim, onCodeClick }) {
  const [open, setOpen] = useState(false)
  const s = V[dim.verdict] || V.conditional
  const label = (typeof DIM_META[dim.dimension] === 'string'
    ? DIM_META[dim.dimension]
    : DIM_META[dim.dimension]?.label) || dim.dimension.replace(/_/g, ' ')

  // Brief value for collapsed view — use specified_value up to first newline / 40 chars
  const brief = (v) => v ? v.split('\n')[0].slice(0, 44) : '—'

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '9px 12px',
          background: open ? s.bg : 'transparent',
          border: 'none', borderBottom: '1px solid #f0f0ee',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
          transition: 'background 0.1s',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = '#fafaf9' }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Dot verdict={dim.verdict} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 400, color: '#111110', display: 'block' }}>
            {label}
          </span>
          {!open && (
            <span style={{
              fontSize: 11, color: '#9b9b99', fontWeight: 300,
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {brief(dim.specified_value)}
              {dim.proposed_value && dim.proposed_value !== dim.specified_value && (
                <> <span style={{ color: '#c5c5c3' }}>→</span> {brief(dim.proposed_value)}</>
              )}
            </span>
          )}
        </span>
        <VerdictBadge verdict={dim.verdict} />
      </button>

      {open && (
        <div style={{
          padding: '12px 16px 14px 29px',
          background: s.bg,
          borderBottom: '1px solid #f0f0ee',
          fontSize: 13,
        }}>
          <div style={{ color: '#9b9b99', fontWeight: 300, marginBottom: 8, fontSize: 12 }}>
            {dim.requirement}
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8,
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#9b9b99', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                Specified
              </div>
              <div style={{ fontWeight: 400, color: '#111110', fontSize: 12 }}>{dim.specified_value}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#9b9b99', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                Proposed
              </div>
              <div style={{ fontWeight: 400, color: '#111110', fontSize: 12 }}>{dim.proposed_value}</div>
            </div>
          </div>
          {dim.delta && (
            <div style={{
              fontSize: 12, color: s.color, lineHeight: 1.6,
              padding: '6px 10px', background: '#ffffff',
              border: `1px solid ${s.border}`,
              marginBottom: 8,
            }}>
              {dim.delta}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#9b9b99' }}>
            <CodeRef reference={dim.code_reference} onClick={onCodeClick} />
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dimension Matrix — two-pane: compliance | wellbeing
// ---------------------------------------------------------------------------

function DimensionMatrix({ dimensions, onCodeClick }) {
  const compliance = sortedDims(dimensions.filter(d => !WELLBEING_DIMS.has(d.dimension)))
  const wellbeing  = sortedDims(dimensions.filter(d =>  WELLBEING_DIMS.has(d.dimension)))

  const Section = ({ title, dims }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: 10, color: '#9b9b99', letterSpacing: '0.08em',
        textTransform: 'uppercase', padding: '0 12px 6px',
      }}>
        {title}
      </div>
      <div style={{ border: '1px solid #e5e5e3', background: '#ffffff' }}>
        {dims.length === 0
          ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#c5c5c3', fontWeight: 300 }}>No data</div>
          : dims.map((d, i) => <MatrixRow key={i} dim={d} onCodeClick={onCodeClick} />)
        }
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <Section title="Compliance" dims={compliance} />
      {wellbeing.length > 0 && <Section title="Wellbeing" dims={wellbeing} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score bar — visual pass/conditional/fail tally
// ---------------------------------------------------------------------------

function ScoreBar({ dimensions }) {
  const counts = { pass: 0, conditional: 0, fail: 0 }
  for (const d of dimensions) counts[d.verdict] = (counts[d.verdict] || 0) + 1
  const total = dimensions.length
  if (total === 0) return null

  const segments = [
    { key: 'fail',        color: '#dc2626', label: `${counts.fail} fail` },
    { key: 'conditional', color: '#ca8a04', label: `${counts.conditional} conditional` },
    { key: 'pass',        color: '#16a34a', label: `${counts.pass} pass` },
  ].filter(s => counts[s.key] > 0)

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', height: 4, gap: 1, marginBottom: 5 }}>
        {segments.map(s => (
          <div key={s.key} style={{
            flex: counts[s.key],
            background: s.color,
            height: '100%',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#9b9b99', fontWeight: 300 }}>
        {segments.map(s => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
        <span style={{ marginLeft: 'auto' }}>{total} dimensions checked</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || ''

const DECISIONS = [
  { value: 'approved',       label: 'Approve',           color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'info_requested', label: 'Request more info', color: '#a16207', bg: '#fefce8', border: '#fef08a' },
  { value: 'rejected',       label: 'Reject',            color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
]

export default function AssessmentResult({ data, queryText }) {
  const [activeProvision, setActiveProvision] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [showRecs, setShowRecs] = useState(true)
  const [decision, setDecision] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)

  async function handleDecision(value) {
    if (!data.assessment_id) return
    setSavingDecision(true)
    try {
      await fetch(`${API_BASE}/api/assess/${data.assessment_id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: value, decision_note: decisionNote || null }),
      })
      setDecision(value)
    } finally {
      setSavingDecision(false)
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await fetch('/api/assess/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `raeson_${data.specified_product}_to_${data.proposed_product}.pdf`
        .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '')
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to generate PDF: ' + e.message)
    } finally {
      setExportingPdf(false)
    }
  }

  const sv = V[data.overall_risk] || V.conditional

  return (
    <div>
      {activeProvision && (
        <CodeProvisionModal
          codeReference={activeProvision}
          onClose={() => setActiveProvision(null)}
        />
      )}

      {/* ── Header card ── */}
      <div style={{
        padding: '20px 24px', background: '#ffffff',
        border: '1px solid #e5e5e3', marginBottom: 12,
      }}>
        {/* Top row: title + overall verdict */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{
              fontSize: 10, color: '#9b9b99', marginBottom: 3,
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Substitution assessment
            </div>
            <div style={{ fontSize: 15, fontWeight: 400, color: '#111110', lineHeight: 1.4 }}>
              {data.specified_product}
              <span style={{ color: '#9b9b99', margin: '0 8px', fontWeight: 300 }}>→</span>
              {data.proposed_product}
            </div>
          </div>
          <VerdictBadge verdict={data.overall_risk} large />
        </div>

        {/* Context strip */}
        <div style={{
          display: 'flex', gap: 14, fontSize: 11, color: '#9b9b99',
          padding: '8px 0', borderTop: '1px solid #f0f0ee',
          borderBottom: '1px solid #f0f0ee', marginBottom: 12,
          flexWrap: 'wrap', fontWeight: 300,
        }}>
          <span><span style={{ color: '#c5c5c3' }}>Function </span>{data.building_function}</span>
          <span><span style={{ color: '#c5c5c3' }}>Class </span>{data.building_class}</span>
          <span><span style={{ color: '#c5c5c3' }}>Element </span>{data.building_element.replace(/_/g, ' ')}</span>
          {data.climate_zone && <span><span style={{ color: '#c5c5c3' }}>Climate </span>{data.climate_zone}</span>}
          <span><span style={{ color: '#c5c5c3' }}>Data </span>{data.data_completeness}</span>
        </div>

        {/* Score bar */}
        <ScoreBar dimensions={data.dimensions} />

        {/* Narrative */}
        <p style={{ fontSize: 14, lineHeight: 1.75, color: '#333', fontWeight: 300, margin: 0 }}>
          {data.risk_summary}
        </p>

        {/* Actions */}
        <div style={{
          display: 'flex', gap: 8, marginTop: 14,
          paddingTop: 12, borderTop: '1px solid #f0f0ee',
        }}>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 400,
              background: '#ffffff', border: '1px solid #e5e5e3',
              cursor: exportingPdf ? 'wait' : 'pointer',
              color: '#6b6b69', fontFamily: 'inherit', transition: 'all 0.1s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#111110'; e.currentTarget.style.color = '#111110' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#e5e5e3'; e.currentTarget.style.color = '#6b6b69' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            {exportingPdf ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* ── Decision record ── */}
      {data.assessment_id && (
        <div style={{ marginBottom: 24, padding: '16px 20px', border: '1px solid #e5e5e3', background: '#ffffff' }}>
          <p style={{ fontSize: 11, color: '#9b9b99', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            Decision
          </p>

          {decision ? (
            <div style={{
              padding: '10px 14px',
              background: DECISIONS.find(d => d.value === decision)?.bg,
              border: `1px solid ${DECISIONS.find(d => d.value === decision)?.border}`,
              color: DECISIONS.find(d => d.value === decision)?.color,
              fontSize: 13,
            }}>
              {DECISIONS.find(d => d.value === decision)?.label} — saved
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {DECISIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => { setShowNoteInput(true); handleDecision(d.value) }}
                    disabled={savingDecision}
                    style={{
                      padding: '7px 14px', fontSize: 12, fontFamily: 'inherit',
                      background: d.bg, border: `1px solid ${d.border}`,
                      color: d.color, cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Optional note..."
                  value={decisionNote}
                  onChange={e => setDecisionNote(e.target.value)}
                  style={{
                    flex: 1, padding: '7px 10px', border: '1px solid #e5e5e3',
                    fontSize: 12, fontFamily: 'inherit', color: '#111110',
                    background: '#f7f7f5', outline: 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Dimension matrix ── */}
      <DimensionMatrix dimensions={data.dimensions} onCodeClick={setActiveProvision} />

      {/* ── Recommendations ── */}
      {data.recommendations?.length > 0 && (
        <div style={{
          border: '1px solid #e5e5e3', borderLeft: '3px solid #111110',
          marginBottom: 12, background: '#ffffff',
        }}>
          <button
            onClick={() => setShowRecs(r => !r)}
            style={{
              width: '100%', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '12px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span style={{
              fontSize: 10, fontWeight: 400, color: '#111110',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              Recommendations ({data.recommendations.length})
            </span>
            <span style={{ fontSize: 11, color: '#9b9b99' }}>{showRecs ? '▲' : '▼'}</span>
          </button>
          {showRecs && (
            <ul style={{
              fontSize: 13, color: '#444', padding: '0 20px 14px 36px',
              fontWeight: 300, display: 'flex', flexDirection: 'column', gap: 7, margin: 0,
            }}>
              {data.recommendations.map((rec, i) => (
                <li key={i} style={{ lineHeight: 1.6 }}>{rec}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Alternatives ── */}
      {data.alternatives?.length > 0 && (
        <div style={{
          padding: '16px 20px', background: '#ffffff',
          border: '1px solid #e5e5e3', borderLeft: '3px solid #111110',
          marginBottom: 12,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 400, color: '#111110',
            marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Alternative products
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.alternatives.map((alt, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                gap: 12, alignItems: 'start',
                paddingBottom: i < data.alternatives.length - 1 ? 10 : 0,
                borderBottom: i < data.alternatives.length - 1 ? '1px solid #f0f0ee' : 'none',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 400, color: '#111110' }}>{alt.name}</span>
                    {alt.verdict === 'conditional' && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', letterSpacing: '0.06em',
                        background: '#fefce8', border: '1px solid #fef08a', color: '#a16207',
                      }}>CONDITIONAL</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#9b9b99', fontWeight: 300, marginBottom: 4 }}>
                    {alt.manufacturer} · {alt.product_type}
                  </div>
                  <div style={{
                    fontSize: 11, color: '#6b6b69', fontWeight: 300,
                    background: '#f7f7f5', padding: '3px 8px', display: 'inline-block',
                  }}>
                    {alt.why}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {alt.fire_euroclass && (
                    <div style={{ fontSize: 11, color: '#6b6b69', fontWeight: 300 }}>
                      <span style={{ color: '#9b9b99' }}>Fire </span>{alt.fire_euroclass}
                    </div>
                  )}
                  {alt.epd_co2_per_m2 != null && (
                    <div style={{ fontSize: 11, color: '#6b6b69', fontWeight: 300 }}>
                      <span style={{ color: '#9b9b99' }}>CO₂ </span>{alt.epd_co2_per_m2.toFixed(1)} kg/m²
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Data gaps ── */}
      {data.missing_data?.length > 0 && (
        <div style={{
          padding: '10px 14px', background: '#fefce8',
          border: '1px solid #fef08a', fontSize: 12,
          color: '#a16207', fontWeight: 300, marginBottom: 12,
        }}>
          <strong style={{ fontWeight: 500 }}>Data gaps: </strong>
          {data.missing_data.join(' | ')}
        </div>
      )}

      {/* ── Referenced codes ── */}
      {data.code_documents_referenced?.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#c5c5c3', fontWeight: 300 }}>
          Referenced: {data.code_documents_referenced.join(', ')}
        </div>
      )}
    </div>
  )
}
