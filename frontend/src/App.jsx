// ─── Root app — Clerk auth gate + marketing / product shell ──────────────────
import React, { useState } from 'react';
import { SignIn, SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import MarketingApp from './marketing/MarketingApp.jsx';
import { ProjectsPage, PROJECTS_SEED } from './pages/ProjectsPage.jsx';
import { ProjectDetail, SUBSTITUTIONS_BY_PROJECT } from './pages/ProjectDetail.jsx';
import { SubstitutionFlow } from './pages/SubstitutionFlow.jsx';
import { C } from './shared.jsx';

// ─── Top bar (signed-in) ─────────────────────────────────────────────────────
function TopBar({ view, activeProject, onGoProjects, onGoMarketing }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 52,
      background: 'rgba(246,244,238,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280, width: '100%', margin: '0 auto',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        {/* Logo */}
        <button
          onClick={onGoMarketing}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400,
            color: C.text, letterSpacing: '-0.04em',
          }}
        >
          ræson
        </button>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.dim }}>
          <button
            onClick={onGoProjects}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: view === 'projects' ? C.text : C.dim, fontSize: 13,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Projects
          </button>
          {activeProject && (
            <>
              <span style={{ color: C.muted }}>›</span>
              <span style={{ color: C.text, fontFamily: 'var(--font-sans)' }}>
                {activeProject.name}
              </span>
            </>
          )}
        </div>

        {/* Right: user */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          {user && (
            <span style={{ fontSize: 12, color: C.muted, fontFamily: 'var(--font-sans)' }}>
              {user.primaryEmailAddress?.emailAddress}
            </span>
          )}
          <button
            onClick={() => signOut()}
            style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 12px', fontSize: 12, cursor: 'pointer',
              color: C.dim, fontFamily: 'var(--font-sans)',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Product shell (signed-in) ────────────────────────────────────────────────
function AppShell({ onGoMarketing }) {
  const [view, setView] = useState('projects');
  const [activeProject, setActiveProject] = useState(null);
  const [activeSubstitution, setActiveSubstitution] = useState(null);

  // Seed projects from PROJECTS_SEED; in production these would come from the API
  const [projects] = useState(PROJECTS_SEED);

  function goProjects() {
    setView('projects');
    setActiveProject(null);
    setActiveSubstitution(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <TopBar
        view={view}
        activeProject={activeProject}
        onGoProjects={goProjects}
        onGoMarketing={onGoMarketing}
      />

      <main style={{ paddingTop: 52 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view + (activeProject?.id || '') + (activeSubstitution?.id || '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {view === 'projects' && (
              <ProjectsPage
                projects={projects}
                onOpenProject={p => { setActiveProject(p); setView('project'); }}
                onNewSubstitution={() => setView('flow')}
              />
            )}

            {view === 'project' && activeProject && (
              <ProjectDetail
                project={activeProject}
                onBack={goProjects}
                onOpenSubstitution={(p, s) => {
                  setActiveProject(p);
                  setActiveSubstitution(s);
                  setView('flow');
                }}
                onNewSubstitution={p => { setActiveProject(p); setView('flow'); }}
              />
            )}

            {view === 'flow' && (
              <SubstitutionFlow
                project={activeProject}
                substitution={activeSubstitution}
                onClose={() => activeProject ? setView('project') : setView('projects')}
                onComplete={() => activeProject ? setView('project') : setView('projects')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <SignedOut>
        <AnimatePresence mode="wait">
          {showSignIn ? (
            <motion.div key="signin"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
              <SignIn routing="hash" appearance={{
                variables: { colorBackground: '#FFFFFF', colorText: C.text },
              }} />
            </motion.div>
          ) : (
            <motion.div key="marketing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}>
              <MarketingApp onEnterApp={() => setShowSignIn(true)} />
            </motion.div>
          )}
        </AnimatePresence>
      </SignedOut>

      <SignedIn>
        <AppShell onGoMarketing={() => {}} />
      </SignedIn>
    </>
  );
}
