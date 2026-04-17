import React, { useState, useEffect } from 'react'
import { SignIn, SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react'
import { AnimatePresence, motion, useScroll, useTransform } from 'motion/react'
import QueryForm from './components/QueryForm.jsx'
import AssessmentResult from './components/AssessmentResult.jsx'
import ProjectList from './components/ProjectList.jsx'
import ProjectForm from './components/ProjectForm.jsx'
import LandingPage from './pages/LandingPage.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

const C = {
  bg:      '#FFFFFF',
  surface: '#F5F5F5',
  card:    '#FFFFFF',
  border:  '#E5E5E5',
  text:    '#0F0F0F',
  dim:     '#666666',
  muted:   '#AAAAAA',
}

const EXAMPLE_QUERIES = [
  { label: 'Facade insulation swap (mineral wool → phenolic foam)', query: 'Contractor proposes Kingspan Kooltherm K15 instead of specified Rockwool Duorock 040 for facade insulation on a residential apartment building (5 floors, klasse 2) in Amsterdam.' },
  { label: 'Facade cladding swap (HPL → fiber cement)', query: 'We need to substitute Trespa Meteon HPL panels with Eternit Equitone tectiva fiber cement panels on the facade cladding of a residential building, building class 2, in Rotterdam.' },
  { label: 'Facade cladding swap (HPL → timber panel)', query: 'Contractor requests to use Prodema ProdEX natural wood panels instead of specified Trespa Meteon for facade cladding on a 6-storey residential building in Utrecht.' },
  { label: 'Fire door material change', query: 'Can we use a Swedoor timber fire door EI30 instead of the specified Schuco ADS 80 FR 30 aluminium fire door in the common corridors of a residential apartment building, klasse 2?' },
  { label: 'Window glazing downgrade', query: 'Contractor proposes Pilkington Suncool HR++ double glazing instead of specified AGC iplus Top 1.1 triple glazing for windows in a new residential building, klasse 2, Amsterdam.' },
  { label: 'Carbon impact: low-carbon swap (EPS → mineral wool)', query: 'Contractor proposes Rockwool Duorock 040 mineral wool instead of Knauf Therm TR 032 EPS for floor insulation on a residential building klasse 1 in Amsterdam.' },
  { label: 'Coastal durability: wood cladding in coastal zone', query: 'Contractor proposes Prodema ProdEX wood panels instead of Eternit Equitone tectiva fibre cement for facade cladding on a residential building klasse 2 in Vlissingen coastal zone.' },
  { label: 'Compatibility risk: zinc cladding next to copper pipes', query: 'Can we use VMZINC Anthra-Zinc standing seam cladding instead of Rockpanel Woods stone wool panels for facade cladding on a residential building klasse 2 in Amsterdam? The building has exposed copper rainwater pipes on the facade.' },
]

function RaesonMark({ size = 14, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 23 23" width={size} height={size} fill="none"
      style={{ display: 'block', flexShrink: 0 }} aria-hidden="true">
      <rect x="0" y="0" width="3" height="20" fill={color} />
      <rect x="0" y="0" width="12" height="3" fill={color} />
      <rect x="9" y="0" width="3" height="12" fill={color} />
      <rect x="0" y="9" width="12" height="3" fill={color} />
      <line x1="12" y1="12" x2="21" y2="21" stroke={color} strokeWidth="3" strokeLinecap="square" />
    </svg>
  )
}

// ─── Product nav ─────────────────────────────────────────────────────────────
function AppNav({ activeProject, onGoProjects, onGoLanding }) {
  const { scrollY } = useScroll()
  const logoScale = useTransform(scrollY, [0, 80], [1, 0.8])

  return (
    <motion.header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(13,13,13,0.9)',
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <nav style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 32px',
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <motion.button
          onClick={onGoLanding}
          style={{
            scale: logoScale, transformOrigin: 'left center',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          }}
        >
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600,
            color: C.text, letterSpacing: '-0.04em',
          }}>ræson</span>
        </motion.button>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['Projects', 'Library', 'Archive'].map(tab => (
            <button
              key={tab}
              onClick={tab === 'Projects' ? onGoProjects : undefined}
              style={{
                padding: '6px 14px',
                background: 'none', border: 'none',
                fontSize: 13, cursor: 'pointer',
                color: tab === 'Projects' ? C.text : C.dim,
                letterSpacing: '-0.01em',
                borderBottom: tab === 'Projects' ? `1px solid ${C.text}` : '1px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right: breadcrumb + user */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {activeProject && (
            <span style={{ fontSize: 12, color: C.dim, letterSpacing: '-0.01em' }}>
              <button onClick={onGoProjects}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: C.dim, fontSize: 12 }}>
                Projects
              </button>
              <span style={{ margin: '0 6px', color: C.muted }}>›</span>
              <span style={{ color: C.text }}>{activeProject.name}</span>
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
    </motion.header>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────
function AppShell({ onGoLanding }) {
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
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
      let res
      if (file) {
        const formData = new FormData()
        formData.append('query', query)
        formData.append('file', file)
        res = await fetch(`${API_BASE}/api/assess/with-plan`, { method: 'POST', headers: { ...authHeader }, body: formData })
      } else {
        res = await fetch(`${API_BASE}/api/assess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ query }),
        })
      }
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Assessment failed') }
      setResult(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function goProjects() {
    setView('projects'); setActiveProject(null); setResult(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <AppNav activeProject={activeProject} onGoProjects={goProjects} onGoLanding={onGoLanding} />

      <SignedOut>
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.bg,
        }}>
          <SignIn routing="hash" appearance={{
            variables: { colorBackground: C.card, colorText: C.text, colorInputBackground: C.surface, colorInputText: C.text },
          }} />
        </div>
      </SignedOut>

      <SignedIn>
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 40px 80px' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view + (activeProject?.id || '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {view === 'projects' && (
                <ProjectList
                  onSelectProject={p => { setActiveProject(p); setView('assessment'); setResult(null) }}
                  onNewProject={() => setView('new-project')}
                />
              )}

              {view === 'new-project' && (
                <ProjectForm
                  onCreated={p => { setActiveProject(p); setView('assessment'); setResult(null) }}
                  onCancel={goProjects}
                />
              )}

              {view === 'assessment' && activeProject && (
                <div>
                  {/* Project context strip */}
                  <div style={{
                    padding: '12px 16px', background: C.surface,
                    borderRadius: 8, marginBottom: 24,
                    display: 'flex', gap: 20, flexWrap: 'wrap',
                    fontSize: 12, color: C.dim,
                    border: `1px solid ${C.border}`,
                  }}>
                    {activeProject.building_type && <span><span style={{ color: C.muted }}>Type </span>{activeProject.building_type}</span>}
                    {activeProject.building_class && <span><span style={{ color: C.muted }}>Class </span>{activeProject.building_class}</span>}
                    {activeProject.climate_zone  && <span><span style={{ color: C.muted }}>Climate </span>{activeProject.climate_zone}</span>}
                    {activeProject.jurisdiction  && <span><span style={{ color: C.muted }}>Code </span>{activeProject.jurisdiction}</span>}
                    {activeProject.architect_name && <span><span style={{ color: C.muted }}>Architect </span>{activeProject.architect_name}</span>}
                  </div>

                  <QueryForm value={queryText} onChange={setQueryText} onSubmit={handleSubmit} loading={loading} />

                  {/* Example scenarios */}
                  <div style={{ marginTop: 16, marginBottom: 40 }}>
                    <p style={{ fontSize: 10, fontWeight: 500, color: C.muted, marginBottom: 10,
                      textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Try a scenario
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {EXAMPLE_QUERIES.map((ex, i) => (
                        <button key={i}
                          onClick={() => { setQueryText(ex.query); handleSubmit(ex.query, null) }}
                          disabled={loading}
                          style={{
                            fontSize: 11, padding: '5px 12px',
                            background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: 9999, color: C.dim, cursor: 'pointer',
                            transition: 'border-color 0.15s, color 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = C.dim; e.currentTarget.style.color = C.text }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim }}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444',
                      fontSize: 13, marginBottom: 24, borderRadius: 8 }}>
                      {error}
                    </div>
                  )}

                  {loading && (
                    <motion.p
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: C.dim }}
                    >
                      {loadingMsg}
                    </motion.p>
                  )}

                  <AnimatePresence>
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      >
                        <AssessmentResult data={result} queryText={queryText} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer style={{
            marginTop: 64, paddingTop: 20,
            borderTop: `1px solid ${C.border}`,
            fontSize: 11, color: C.muted, letterSpacing: '0.02em',
          }}>
            ræson — compliance intelligence for architects.
          </footer>
        </main>
      </SignedIn>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() =>
    window.location.pathname.startsWith('/app') ? 'app' : 'landing'
  )

  useEffect(() => {
    const handler = () =>
      setPage(window.location.pathname.startsWith('/app') ? 'app' : 'landing')
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  function goApp() {
    window.history.pushState({}, '', '/app')
    setPage('app')
  }

  function goLanding() {
    window.history.pushState({}, '', '/')
    setPage('landing')
  }

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' ? (
        <motion.div key="landing"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <LandingPage onEnter={goApp} />
        </motion.div>
      ) : (
        <motion.div key="app"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}>
          <AppShell onGoLanding={goLanding} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
