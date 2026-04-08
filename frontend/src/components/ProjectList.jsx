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
    <div className="py-10 text-center text-muted text-13 font-light">
      Loading projects...
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-ink font-semibold mb-1.5" style={{ fontSize: 28, letterSpacing: '-0.3px', lineHeight: 1.14 }}>
            Projects
          </h1>
          <p className="text-15 text-subtle">
            Select a project to run an assessment.
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="px-5 py-2.5 text-white text-13 font-medium rounded-lg transition-opacity duration-150 hover:opacity-85"
          style={{ background: '#009767', letterSpacing: '-0.01em' }}
        >
          + New project
        </button>
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="py-16 text-center border border-rule bg-surface rounded-lg">
          <p className="text-13 text-muted mb-5">No projects yet.</p>
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
        <div className="flex flex-col gap-2">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.15, ease: 'easeOut' }}
              onClick={() => onSelectProject(p)}
              className="px-6 py-5 bg-white border border-rule rounded-lg cursor-pointer flex items-center justify-between group hover:border-ink transition-colors duration-150"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' }}
            >
              <div className="min-w-0">
                <div className="text-15 font-medium text-ink mb-1.5" style={{ letterSpacing: '-0.2px' }}>
                  {p.name}
                </div>
                <div className="text-13 text-muted flex gap-4 flex-wrap">
                  {p.project_number && <span>{p.project_number}</span>}
                  {p.city && <span>{p.city}</span>}
                  {p.building_type && <span>{p.building_type}</span>}
                  {p.jurisdiction && (
                    <span className="font-mono border border-rule px-1.5 py-px rounded text-11" style={{ letterSpacing: '0.02em' }}>
                      {p.jurisdiction}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right ml-8 shrink-0">
                <div className="text-12 text-muted">
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
