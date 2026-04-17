import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const C = {
  bg:      '#0D0D0D',
  surface: '#161616',
  card:    '#1C1C1C',
  border:  '#252525',
  text:    '#FAFAFA',
  dim:     '#888888',
  muted:   '#444444',
}

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
    <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: C.dim }}>
      Loading projects...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 48, paddingTop: 8 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginBottom: 10,
            textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Studio directory — {new Date().getFullYear()}
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: C.text, letterSpacing: '-0.03em', margin: 0 }}>
            Active Projects
          </h1>
        </div>
        <button
          onClick={onNewProject}
          style={{
            padding: '10px 20px', background: C.text, color: C.bg,
            fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em',
            border: 'none', borderRadius: 6, cursor: 'pointer',
            marginTop: 24,
          }}
        >
          + Create New Project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{
          padding: '64px 0', textAlign: 'center',
          background: C.surface, borderRadius: 12,
          border: `1px solid ${C.border}`,
        }}>
          <p style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>No projects yet.</p>
          <button onClick={onNewProject} style={{
            padding: '10px 20px', background: C.text, color: C.bg,
            fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>
            Create your first project
          </button>
        </div>
      )}

      {/* Table */}
      {projects.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            padding: '10px 20px',
            borderBottom: `1px solid ${C.border}`,
            fontSize: 10, color: C.muted,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: C.surface,
          }}>
            <span>Name</span>
            <span>Status</span>
            <span>Assessments</span>
            <span>Location</span>
          </div>

          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
              onClick={() => onSelectProject(p)}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '16px 20px',
                borderBottom: i < projects.length - 1 ? `1px solid ${C.border}` : 'none',
                cursor: 'pointer',
                background: 'transparent',
                transition: 'background 0.12s',
                alignItems: 'center',
              }}
              onMouseOver={e => e.currentTarget.style.background = C.surface}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="0.5" y="3.5" width="13" height="10" rx="1" stroke={C.muted} strokeWidth="1"/>
                  <path d="M0.5 5.5h13" stroke={C.muted} strokeWidth="1"/>
                  <path d="M0.5 3.5l2-2h3.5l1 2" stroke={C.muted} strokeWidth="1" fill="none"/>
                </svg>
                <span style={{ fontSize: 13, color: C.text, letterSpacing: '-0.015em' }}>{p.name}</span>
              </div>
              <div>
                {p.assessment_count > 0 ? (
                  <span style={{
                    fontSize: 10, padding: '3px 8px',
                    background: 'rgba(0,151,103,0.1)',
                    border: '1px solid rgba(0,151,103,0.25)',
                    color: '#009767', borderRadius: 9999,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>Active</span>
                ) : (
                  <span style={{
                    fontSize: 10, padding: '3px 8px',
                    background: C.surface, border: `1px solid ${C.border}`,
                    color: C.muted, borderRadius: 9999,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>New</span>
                )}
              </div>
              <span style={{ fontSize: 13, color: C.dim, fontVariantNumeric: 'tabular-nums' }}>
                {p.assessment_count} assessment{p.assessment_count !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: 13, color: C.dim }}>
                {[p.city, p.jurisdiction].filter(Boolean).join(', ') || '—'}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
