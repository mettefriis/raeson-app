import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL || ''
const MONO = "'JetBrains Mono', monospace"

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
    <div style={{ padding: 40, textAlign: 'center', color: '#9b9b99', fontSize: 13 }}>
      Loading projects...
    </div>
  )

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 11, color: '#9b9b99', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
            Projects
          </p>
          <p style={{ fontSize: 13, color: '#6b6b69', fontWeight: 300 }}>
            Select a project to run an assessment
          </p>
        </div>
        <button
          onClick={onNewProject}
          style={{
            padding: '8px 16px', background: '#111110', color: '#f7f7f5',
            border: 'none', cursor: 'pointer', fontSize: 12,
            fontFamily: 'inherit', letterSpacing: '0.02em',
          }}
        >
          + New project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          border: '1px solid #e5e5e3', background: '#ffffff',
        }}>
          <p style={{ fontSize: 13, color: '#9b9b99', fontWeight: 300, marginBottom: 16 }}>
            No projects yet
          </p>
          <button
            onClick={onNewProject}
            style={{
              padding: '8px 16px', background: '#111110', color: '#f7f7f5',
              border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            }}
          >
            Create your first project
          </button>
        </div>
      )}

      {/* Project list */}
      {projects.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              style={{
                padding: '16px 20px', background: '#ffffff',
                border: '1px solid #e5e5e3', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'border-color 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#111110'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#e5e5e3'}
            >
              <div>
                <div style={{ fontSize: 13, color: '#111110', marginBottom: 4 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: '#9b9b99', display: 'flex', gap: 16 }}>
                  {p.project_number && <span>{p.project_number}</span>}
                  {p.city && <span>{p.city}</span>}
                  {p.building_type && <span>{p.building_type}</span>}
                  {p.jurisdiction && (
                    <span style={{
                      fontFamily: MONO, border: '1px solid #e5e5e3',
                      padding: '0px 4px', fontSize: 10,
                    }}>
                      {p.jurisdiction}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9b9b99' }}>
                  {p.assessment_count} assessment{p.assessment_count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
