import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { motion } from 'motion/react'

const API_BASE = import.meta.env.VITE_API_URL || ''

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
    <div className="py-10 text-center text-muted text-13">
      Loading projects...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-10 pt-4">
        <div>
          <p className="text-[11px] font-medium text-muted mb-1.5 uppercase tracking-widest">
            Projects
          </p>
          <p className="text-sm text-subtle tracking-tight">
            Select a project to run an assessment.
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="px-4 py-2 text-white text-12 font-medium rounded-lg transition-opacity duration-150 hover:opacity-85"
          style={{ background: '#009767', letterSpacing: '-0.01em' }}
        >
          + New project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="py-16 text-center bg-surface rounded-2xl">
          <p className="text-sm text-muted mb-5">No projects yet.</p>
          <button
            onClick={onNewProject}
            className="px-4 py-2 text-white text-12 font-medium rounded-lg transition-opacity duration-150 hover:opacity-85"
            style={{ background: '#009767' }}
          >
            Create your first project
          </button>
        </div>
      )}

      {/* Project list */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.15, ease: 'easeOut' }}
              onClick={() => onSelectProject(p)}
              className="px-6 py-5 bg-surface rounded-2xl cursor-pointer flex items-center justify-between transition-colors duration-150"
              style={{ background: '#f5f5f5' }}
              onMouseOver={e => e.currentTarget.style.background = '#ebebeb'}
              onMouseOut={e => e.currentTarget.style.background = '#f5f5f5'}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink mb-1.5 tracking-tight">
                  {p.name}
                </div>
                <div className="text-xs text-muted flex gap-4 flex-wrap">
                  {p.project_number && <span>{p.project_number}</span>}
                  {p.city && <span>{p.city}</span>}
                  {p.building_type && <span>{p.building_type}</span>}
                  {p.jurisdiction && (
                    <span className="font-mono text-[10px]" style={{ letterSpacing: '0.02em' }}>
                      {p.jurisdiction}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-8 shrink-0">
                <div className="text-xs text-muted tabular-nums">
                  {p.assessment_count} assessment{p.assessment_count !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
