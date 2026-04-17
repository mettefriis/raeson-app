import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const C = {
  border:  '#E5E5E5',
  text:    '#0F0F0F',
  dim:     '#666666',
  muted:   '#AAAAAA',
}

const VERDICT_COLOR = { accepted: '#009767', conditional: '#ca8a04', fail: '#ef4444' }

export default function ProjectList({ onSelectProject, onNewProject }) {
  const { getToken } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/api/projects`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) setProjects(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ padding: '60px 0', textAlign: 'center', fontSize: 13, color: C.dim }}>
      Loading...
    </div>
  )

  return (
    <div>
      {/* Header — matches landing page index style */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '48px 0 40px' }}>
        <div>
          <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            Studio directory — {new Date().getFullYear()}
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', color: C.text, margin: 0 }}>
            Active Projects
          </h1>
        </div>
        <button
          onClick={onNewProject}
          style={{
            padding: '10px 22px', background: C.text, color: '#FFFFFF',
            fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
            border: 'none', borderRadius: 4, cursor: 'pointer',
          }}
        >
          + New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{ padding: '80px 0', textAlign: 'center', borderTop: `1px solid ${C.border}` }}>
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 24 }}>No projects yet.</p>
          <button onClick={onNewProject} style={{
            padding: '10px 22px', background: C.text, color: '#FFFFFF',
            fontSize: 12, fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase',
            border: 'none', borderRadius: 4, cursor: 'pointer',
          }}>
            Create your first project
          </button>
        </div>
      )}

      {/* Index-style table — identical to landing page */}
      {projects.length > 0 && (
        <div>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px',
            padding: '0 0 12px', borderBottom: `1px solid ${C.border}`,
            fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            <span>Project</span>
            <span>Location</span>
            <span>Assessments</span>
            <span style={{ textAlign: 'right' }}>Status</span>
          </div>

          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              onClick={() => onSelectProject(p)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 80px',
                padding: '18px 0',
                borderBottom: `1px solid ${C.border}`,
                cursor: 'pointer', alignItems: 'center',
                transition: 'opacity 0.12s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.65'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: 15, color: C.text, letterSpacing: '-0.02em' }}>
                {p.name}
              </span>
              <span style={{ fontSize: 13, color: C.dim }}>
                {[p.city, p.jurisdiction].filter(Boolean).join(', ') || '—'}
              </span>
              <span style={{ fontSize: 13, color: C.dim, fontVariantNumeric: 'tabular-nums' }}>
                {p.assessment_count}
              </span>
              <span style={{
                fontSize: 11, textAlign: 'right',
                color: p.assessment_count > 0 ? '#009767' : C.muted,
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {p.assessment_count > 0 ? 'Active' : 'New'}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
