import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CodeProvisionModal from './CodeProvisionModal.jsx'

// Verdict config
const V = {
  pass:        { bg: '#f0fdf4', border: '#bbf7d0', color: '#009767', dot: '#009767', label: 'PASS' },
  conditional: { bg: 'rgba(161,98,7,0.06)', border: '#a16207', color: '#a16207', dot: '#ca8a04', label: 'CONDITIONAL' },
  fail:        { bg: 'rgba(239,68,68,0.06)', border: '#ef4444', color: '#ef4444', dot: '#ef4444', label: 'FAIL' },
}

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
  biophilic_quality: 'Biophilic quality',
  acoustic_quality:  'Acoustic quality',
  thermal_comfort:   'Thermal comfort',
  daylight_quality:  'Daylight quality',
}

const WELLBEING_DIMS = new Set([
  'biophilic_quality', 'acoustic_quality', 'thermal_comfort', 'daylight_quality'
])

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
    <span
      className="inline-block font-medium"
      style={{
        padding: large ? '4px 12px' : '2px 8px',
        fontSize: large ? 11 : 10,
        letterSpacing: '0.06em',
        borderRadius: 9999,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
      }}
    >
      {s.label}
    </span>
  )
}


function CodeRef({ reference, onClick }) {
  return (
    <button
      onClick={() => onClick(reference)}
      className="text-11 text-ink bg-transparent border-none p-0 cursor-pointer underline decoration-dotted underline-offset-2"
    >
      {reference}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Matrix row — compact summary, expands with smooth animation
// ---------------------------------------------------------------------------

function MatrixRow({ dim, onCodeClick }) {
  const [open, setOpen] = useState(false)
  const s = V[dim.verdict] || V.conditional
  const label = (typeof DIM_META[dim.dimension] === 'string'
    ? DIM_META[dim.dimension]
    : DIM_META[dim.dimension]?.label) || dim.dimension.replace(/_/g, ' ')

  const brief = (v) => v ? v.split('\n')[0].slice(0, 44) : '—'

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-0 px-4 py-2.5 border-none text-left transition-colors duration-150"
        style={{
          background: open ? s.bg : 'transparent',
          borderBottom: '1px solid #e5e5e5',
          cursor: 'pointer',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = '#f5f5f5' }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <span className="flex-1 min-w-0">
          <span className="text-12 font-medium text-ink block" style={{ letterSpacing: '-0.015em' }}>{label}</span>
          {!open && (
            <span className="text-11 text-muted block overflow-hidden text-ellipsis whitespace-nowrap">
              {brief(dim.specified_value)}
              {dim.proposed_value && dim.proposed_value !== dim.specified_value && (
                <> <span className="text-dim">→</span> {brief(dim.proposed_value)}</>
              )}
            </span>
          )}
        </span>
        <VerdictBadge verdict={dim.verdict} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-4 text-13"
              style={{
                background: s.bg,
                borderBottom: '1px solid #e5e5e5',
              }}
            >
              <div className="text-muted mb-2 text-12 pt-3">{dim.requirement}</div>
              <div className="grid grid-cols-2 gap-2.5 mb-2">
                <div>
                  <div className="text-10 text-muted mb-0.5 font-normal" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Specified
                  </div>
                  <div className="font-normal text-ink text-12">{dim.specified_value}</div>
                </div>
                <div>
                  <div className="text-10 text-muted mb-0.5 font-normal" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Proposed
                  </div>
                  <div className="font-normal text-ink text-12">{dim.proposed_value}</div>
                </div>
              </div>
              {dim.delta && (
                <div
                  className="text-12 leading-relaxed px-2.5 py-1.5 bg-white rounded mb-2"
                  style={{ color: s.color, border: `1px solid ${s.border}` }}
                >
                  {dim.delta}
                </div>
              )}
              <div className="text-11 text-muted">
                <CodeRef reference={dim.code_reference} onClick={onCodeClick} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dimension Matrix
// ---------------------------------------------------------------------------

function DimensionMatrix({ dimensions, onCodeClick }) {
  const compliance = sortedDims(dimensions.filter(d => !WELLBEING_DIMS.has(d.dimension)))
  const wellbeing  = sortedDims(dimensions.filter(d =>  WELLBEING_DIMS.has(d.dimension)))

  const Section = ({ title, dims }) => (
    <div className="flex-1 min-w-0">
      <div className="text-10 text-muted px-3 pb-1.5 font-normal" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div className="border border-rule bg-white rounded-lg overflow-hidden">
        {dims.length === 0
          ? <div className="px-3 py-2.5 text-12 text-dim">No data</div>
          : dims.map((d, i) => <MatrixRow key={i} dim={d} onCodeClick={onCodeClick} />)
        }
      </div>
    </div>
  )

  return (
    <div className="flex gap-3 mb-4">
      <Section title="Compliance" dims={compliance} />
      {wellbeing.length > 0 && <Section title="Wellbeing" dims={wellbeing} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score bar
// ---------------------------------------------------------------------------

function ScoreBar({ dimensions }) {
  const counts = { pass: 0, conditional: 0, fail: 0 }
  for (const d of dimensions) counts[d.verdict] = (counts[d.verdict] || 0) + 1
  const total = dimensions.length
  if (total === 0) return null

  const parts = [
    counts.fail > 0        && <span key="fail"        style={{ color: '#ef4444' }}>{counts.fail} fail</span>,
    counts.conditional > 0 && <span key="conditional" style={{ color: '#a16207' }}>{counts.conditional} conditional</span>,
    counts.pass > 0        && <span key="pass"        style={{ color: '#009767' }}>{counts.pass} pass</span>,
  ].filter(Boolean)

  return (
    <p className="text-12 text-muted mb-3.5">
      {total} dimensions —{' '}
      {parts.map((p, i) => <React.Fragment key={i}>{p}{i < parts.length - 1 ? ' · ' : ''}</React.Fragment>)}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || ''

const DECISIONS = [
  { value: 'approved',       label: 'Approve',           color: '#009767', bg: '#f0fdf4', border: '#bbf7d0' },
  { value: 'info_requested', label: 'Request more info', color: '#a16207', bg: 'rgba(161,98,7,0.06)', border: '#a16207' },
  { value: 'rejected',       label: 'Reject',            color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: '#ef4444' },
]

export default function AssessmentResult({ data, queryText }) {
  const [activeProvision, setActiveProvision] = useState(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [showRecs, setShowRecs] = useState(true)
  const [decision, setDecision] = useState(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [savingDecision, setSavingDecision] = useState(false)

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

  return (
    <div>
      {/* Modal */}
      <AnimatePresence>
        {activeProvision && (
          <CodeProvisionModal
            codeReference={activeProvision}
            onClose={() => setActiveProvision(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Header card ── */}
      <div className="px-6 py-5 bg-white border border-rule rounded-lg mb-3">
        {/* Title + overall verdict */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-10 text-muted mb-0.5 font-normal" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Substitution assessment
            </div>
            <div className="text-15 font-semibold text-ink leading-snug" style={{ letterSpacing: '-0.025em' }}>
              {data.specified_product}
              <span className="text-muted mx-2 font-normal">→</span>
              {data.proposed_product}
            </div>
          </div>
          <VerdictBadge verdict={data.overall_risk} large />
        </div>

        {/* Context strip */}
        <div className="flex gap-3.5 text-11 text-muted py-2 border-y border-row mb-3 flex-wrap">
          <span><span className="text-dim">Function </span>{data.building_function}</span>
          <span><span className="text-dim">Class </span>{data.building_class}</span>
          <span><span className="text-dim">Element </span>{data.building_element.replace(/_/g, ' ')}</span>
          {data.climate_zone && <span><span className="text-dim">Climate </span>{data.climate_zone}</span>}
          <span><span className="text-dim">Data </span>{data.data_completeness}</span>
        </div>

        {/* Score bar */}
        <ScoreBar dimensions={data.dimensions} />

        {/* Narrative */}
        <p className="text-14 leading-7 text-subtle m-0">{data.risk_summary}</p>

        {/* Actions */}
        <div className="flex gap-2 mt-3.5 pt-3 border-t border-row">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-12 font-normal bg-surface border border-rule rounded-lg text-subtle hover:border-ink hover:text-ink transition-colors duration-150"
            style={{ cursor: exportingPdf ? 'wait' : 'pointer' }}
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
        <div className="mb-6 px-5 py-4 border border-rule bg-white rounded-lg">
          <p className="text-11 text-muted font-normal mb-3" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Decision
          </p>

          {decision ? (
            <div
              className="px-3.5 py-2.5 text-13"
              style={{
                background: DECISIONS.find(d => d.value === decision)?.bg,
                border: `1px solid ${DECISIONS.find(d => d.value === decision)?.border}`,
                color: DECISIONS.find(d => d.value === decision)?.color,
              }}
            >
              {DECISIONS.find(d => d.value === decision)?.label} — saved
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2">
                {DECISIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => handleDecision(d.value)}
                    disabled={savingDecision}
                    className="px-3.5 py-1.5 text-12 font-medium rounded-lg disabled:opacity-50"
                    style={{
                      background: d.bg,
                      border: `1px solid ${d.border}`,
                      color: d.color,
                      cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <input
                placeholder="Optional note..."
                value={decisionNote}
                onChange={e => setDecisionNote(e.target.value)}
                className="px-3 py-1.5 border border-rule text-12 text-ink bg-white rounded-lg"
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Dimension matrix ── */}
      <DimensionMatrix dimensions={data.dimensions} onCodeClick={setActiveProvision} />

      {/* ── Recommendations ── */}
      {data.recommendations?.length > 0 && (
        <div
          className="mb-3 bg-white border border-rule rounded-lg overflow-hidden"
          style={{ borderLeft: '3px solid #009767' }}
        >
          <button
            onClick={() => setShowRecs(r => !r)}
            className="w-full flex justify-between items-center px-4 py-3 bg-transparent border-none cursor-pointer"
          >
            <span className="text-10 font-normal text-ink" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Recommendations ({data.recommendations.length})
            </span>
            <span className="text-11 text-muted">{showRecs ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence initial={false}>
            {showRecs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <ul className="text-13 text-subtle pl-9 pr-5 pb-3.5 flex flex-col gap-1.5 m-0" style={{ listStyle: 'disc' }}>
                  {data.recommendations.map((rec, i) => (
                    <li key={i} className="leading-relaxed">{rec}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Alternatives ── */}
      {data.alternatives?.length > 0 && (
        <div
          className="px-5 py-4 bg-white border border-rule rounded-lg mb-3 overflow-hidden"
          style={{ borderLeft: '3px solid #009767' }}
        >
          <div className="text-10 font-normal text-ink mb-3" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Alternative products
          </div>
          <div className="flex flex-col gap-2.5">
            {data.alternatives.map((alt, i) => (
              <div
                key={i}
                className="grid gap-3 items-start"
                style={{
                  gridTemplateColumns: '1fr auto',
                  paddingBottom: i < data.alternatives.length - 1 ? 10 : 0,
                  borderBottom: i < data.alternatives.length - 1 ? '1px solid #e5e5e5' : 'none',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-13 font-normal text-ink">{alt.name}</span>
                    {alt.verdict === 'conditional' && (
                      <span
                        className="text-[9px] px-1.5 py-px font-medium rounded-full"
                        style={{ letterSpacing: '0.06em', background: 'rgba(161,98,7,0.06)', border: '1px solid #a16207', color: '#a16207' }}
                      >
                        CONDITIONAL
                      </span>
                    )}
                  </div>
                  <div className="text-11 text-muted mb-1">
                    {alt.manufacturer} · {alt.product_type}
                  </div>
                  <div className="text-11 text-subtle bg-surface px-2 py-0.5 inline-block rounded">{alt.why}</div>
                </div>
                <div className="text-right shrink-0">
                  {alt.fire_euroclass && (
                    <div className="text-11 text-subtle">
                      <span className="text-muted">Fire </span>{alt.fire_euroclass}
                    </div>
                  )}
                  {alt.epd_co2_per_m2 != null && (
                    <div className="text-11 text-subtle">
                      <span className="text-muted">CO₂ </span>{alt.epd_co2_per_m2.toFixed(1)} kg/m²
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
        <div className="px-3.5 py-2.5 bg-warn-light border border-warn-edge text-12 text-warn rounded-lg mb-3">
          <strong className="font-medium">Data gaps: </strong>
          {data.missing_data.join(' | ')}
        </div>
      )}

      {/* ── Referenced codes ── */}
      {data.code_documents_referenced?.length > 0 && (
        <div className="mt-2 text-11 text-dim">
          Referenced: {data.code_documents_referenced.join(', ')}
        </div>
      )}
    </div>
  )
}
