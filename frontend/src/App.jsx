import React, { useState } from 'react'
import { SignIn, SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion } from 'motion/react'
import QueryForm from './components/QueryForm.jsx'
import AssessmentResult from './components/AssessmentResult.jsx'
import ProjectList from './components/ProjectList.jsx'
import ProjectForm from './components/ProjectForm.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const EXAMPLE_QUERIES = [
  {
    label: "Facade insulation swap (mineral wool → phenolic foam)",
    query: "Contractor proposes Kingspan Kooltherm K15 instead of specified Rockwool Duorock 040 for facade insulation on a residential apartment building (5 floors, klasse 2) in Amsterdam."
  },
  {
    label: "Facade cladding swap (HPL → fiber cement)",
    query: "We need to substitute Trespa Meteon HPL panels with Eternit Equitone tectiva fiber cement panels on the facade cladding of a residential building, building class 2, in Rotterdam."
  },
  {
    label: "Facade cladding swap (HPL → timber panel)",
    query: "Contractor requests to use Prodema ProdEX natural wood panels instead of specified Trespa Meteon for facade cladding on a 6-storey residential building in Utrecht."
  },
  {
    label: "Fire door material change",
    query: "Can we use a Swedoor timber fire door EI30 instead of the specified Schuco ADS 80 FR 30 aluminium fire door in the common corridors of a residential apartment building, klasse 2?"
  },
  {
    label: "Window glazing downgrade",
    query: "Contractor proposes Pilkington Suncool HR++ double glazing instead of specified AGC iplus Top 1.1 triple glazing for windows in a new residential building, klasse 2, Amsterdam."
  },
  {
    label: "Carbon impact: low-carbon swap (EPS → mineral wool)",
    query: "Contractor proposes Rockwool Duorock 040 mineral wool instead of Knauf Therm TR 032 EPS for floor insulation on a residential building klasse 1 in Amsterdam."
  },
  {
    label: "Coastal durability: wood cladding in coastal zone",
    query: "Contractor proposes Prodema ProdEX wood panels instead of Eternit Equitone tectiva fibre cement for facade cladding on a residential building klasse 2 in Vlissingen coastal zone."
  },
  {
    label: "Compatibility risk: zinc cladding next to copper pipes",
    query: "Can we use VMZINC Anthra-Zinc standing seam cladding instead of Rockpanel Woods stone wool panels for facade cladding on a residential building klasse 2 in Amsterdam? The building has exposed copper rainwater pipes on the facade."
  },
]

function RaesonMark({ size = 14, color = 'currentColor' }) {
  return (
    <svg
      viewBox="0 0 23 23"
      width={size}
      height={size}
      fill="none"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="3" height="20" fill={color} />
      <rect x="0" y="0" width="12" height="3" fill={color} />
      <rect x="9" y="0" width="3" height="12" fill={color} />
      <rect x="0" y="9" width="12" height="3" fill={color} />
      <line x1="12" y1="12" x2="21" y2="21"
        stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

export default function App() {
  const { getToken } = useAuth()

  const [view, setView] = useState('projects')
  const [activeProject, setActiveProject] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Running compliance checks...')
  const [error, setError] = useState(null)
  const [queryText, setQueryText] = useState('')

  async function handleSubmit(query, file) {
    setLoading(true)
    setLoadingMsg(file ? 'Reading floor plan...' : 'Running compliance checks...')
    setError(null)
    setResult(null)

    try {
      const token = await getToken()
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}

      let res
      if (file) {
        const formData = new FormData()
        formData.append('query', query)
        formData.append('file', file)
        res = await fetch(`${API_BASE}/api/assess/with-plan`, {
          method: 'POST',
          headers: { ...authHeader },
          body: formData,
        })
      } else {
        res = await fetch(`${API_BASE}/api/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ query }),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Assessment failed')
      }

      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function goProjects() {
    setView('projects')
    setActiveProject(null)
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-rule"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
        <nav className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <RaesonMark size={14} color="#171717" />
            <span className="font-mono text-13 text-ink font-medium" style={{ letterSpacing: '-0.025em' }}>ræson</span>
            <span className="font-mono text-10 text-muted border border-rule px-1.5 py-px rounded" style={{ letterSpacing: '0.04em' }}>
              demo
            </span>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-12 text-muted" style={{ letterSpacing: '-0.01em' }}>
            <button
              onClick={goProjects}
              className="hover:text-ink transition-colors duration-150"
            >
              Projects
            </button>
            {activeProject && (
              <>
                <span className="text-dim">›</span>
                <span className="text-ink">{activeProject.name}</span>
              </>
            )}
          </div>

          <UserButton afterSignOutUrl="/" />
        </nav>
      </header>

      {/* Sign-in gate */}
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <SignIn routing="hash" />
        </div>
      </SignedOut>

      <SignedIn>
        <main className="max-w-2xl mx-auto px-6 pb-20" style={{ paddingTop: 88 }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view + (activeProject?.id || '')}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {/* VIEW: Project list */}
              {view === 'projects' && (
                <ProjectList
                  onSelectProject={p => { setActiveProject(p); setView('assessment'); setResult(null) }}
                  onNewProject={() => setView('new-project')}
                />
              )}

              {/* VIEW: New project form */}
              {view === 'new-project' && (
                <ProjectForm
                  onCreated={p => { setActiveProject(p); setView('assessment'); setResult(null) }}
                  onCancel={goProjects}
                />
              )}

              {/* VIEW: Assessment */}
              {view === 'assessment' && activeProject && (
                <div>
                  {/* Project context strip */}
                  <div className="px-3.5 py-2.5 bg-surface border border-rule rounded-lg mb-6 flex gap-5 flex-wrap text-11 text-subtle">
                    {activeProject.building_type && (
                      <span><span className="text-muted">Type </span>{activeProject.building_type}</span>
                    )}
                    {activeProject.building_class && (
                      <span><span className="text-muted">Class </span>{activeProject.building_class}</span>
                    )}
                    {activeProject.climate_zone && (
                      <span><span className="text-muted">Climate </span>{activeProject.climate_zone}</span>
                    )}
                    {activeProject.jurisdiction && (
                      <span><span className="text-muted">Code </span>{activeProject.jurisdiction}</span>
                    )}
                    {activeProject.architect_name && (
                      <span><span className="text-muted">Architect </span>{activeProject.architect_name}</span>
                    )}
                  </div>

                  <QueryForm
                    value={queryText}
                    onChange={setQueryText}
                    onSubmit={handleSubmit}
                    loading={loading}
                  />

                  {/* Example scenarios */}
                  <div className="mt-3.5 mb-10">
                    <p className="text-11 text-muted mb-2" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Try a scenario
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_QUERIES.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => { setQueryText(ex.query); handleSubmit(ex.query, null) }}
                          disabled={loading}
                          className="text-11 px-2.5 py-1 bg-white border border-rule rounded-md text-subtle hover:border-ink hover:text-ink transition-colors duration-150 disabled:opacity-40"
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="px-4 py-3 bg-fail-light border border-fail-edge text-fail text-13 mb-6 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="py-10 text-center text-muted">
                      <div
                        className="w-5 h-5 border-2 border-rule border-t-accent animate-spin mx-auto mb-3 rounded-full"
                      />
                      <p className="text-13" style={{ letterSpacing: '0.02em' }}>{loadingMsg}</p>
                    </div>
                  )}

                  {/* Results */}
                  <AnimatePresence>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <AssessmentResult data={result} queryText={queryText} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-16 pt-5 border-t border-rule text-11 text-dim" style={{ letterSpacing: '0.02em' }}>
            ræson — compliance intelligence for architects.
          </footer>
        </main>
      </SignedIn>
    </div>
  )
}
