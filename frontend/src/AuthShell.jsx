import React, { useState } from 'react';
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import { ProjectsPage, PROJECTS_SEED } from './pages/ProjectsPage.jsx';
import { ProjectDetail } from './pages/ProjectDetail.jsx';
import { SubstitutionFlow } from './pages/SubstitutionFlow.jsx';
import { C } from './shared.jsx';

// ─── Top bar ─────────────────────────────────────────────────────────────────
function TopBar({ view, activeProject, onGoProjects }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const initials = user?.fullName
    ? user.fullName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 52,
      background: 'rgba(246,244,238,0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280, width: '100%', margin: '0 auto',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 400, color: C.text, letterSpacing: '-0.04em' }}>
          ræson
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.dim }}>
          <button onClick={onGoProjects} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            color: view === 'projects' ? C.text : C.dim, fontSize: 13,
            fontFamily: 'var(--font-sans)',
          }}>Projects</button>
          {activeProject && (
            <>
              <span style={{ color: C.muted }}>›</span>
              <span style={{ color: C.text }}>{activeProject.name}</span>
            </>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: C.text, color: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          }}>{initials}</div>
          <button onClick={() => signOut()} style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11, color: C.muted,
            letterSpacing: '0.04em',
          }}
            onMouseOver={e => e.currentTarget.style.color = C.text}
            onMouseOut={e => e.currentTarget.style.color = C.muted}
          >sign out ↗</button>
        </div>
      </div>
    </header>
  );
}

// ─── App shell (signed-in) ────────────────────────────────────────────────────
function AppShell() {
  const [view, setView] = useState('projects');
  const [activeProject, setActiveProject] = useState(null);
  const [activeSubstitution, setActiveSubstitution] = useState(null);
  const [projects] = useState(PROJECTS_SEED);

  function goProjects() {
    setView('projects');
    setActiveProject(null);
    setActiveSubstitution(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text }}>
      <TopBar view={view} activeProject={activeProject} onGoProjects={goProjects} />
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
                onOpenSubstitution={(p, s) => { setActiveProject(p); setActiveSubstitution(s); setView('flow'); }}
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

// ─── Auth shell — wraps Clerk so it's only loaded on demand ──────────────────
export default function AuthShell({ publishableKey, onBack }) {
  if (!publishableKey) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 20 }}>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: C.dim }}>
          Auth not configured — set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in Vercel env vars.
        </p>
        <button onClick={onBack} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
          ← back to site
        </button>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SignedOut>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bg, gap: 20 }}>
          <SignIn routing="hash" appearance={{ variables: { colorBackground: '#FFFFFF', colorText: C.text } }} />
          <button onClick={onBack} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            ← back to site
          </button>
        </div>
      </SignedOut>
      <SignedIn>
        <AppShell />
      </SignedIn>
    </ClerkProvider>
  );
}
