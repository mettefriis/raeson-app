import React, { useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import MarketingApp from './marketing/MarketingApp.jsx';
import { C } from './shared.jsx';

// Clerk + auth-gated shell only loaded when user clicks sign in
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ─── Lazy-loaded auth shell ───────────────────────────────────────────────────
// Splits Clerk out of the initial bundle — marketing page needs zero auth
const AuthShell = lazy(() => import('./AuthShell.jsx'));

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {showAuth ? (
        <motion.div key="auth"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ minHeight: '100vh', background: C.bg }}>
          <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: C.muted }}>loading…</span>
            </div>
          }>
            <AuthShell publishableKey={PUBLISHABLE_KEY} onBack={() => setShowAuth(false)} />
          </Suspense>
        </motion.div>
      ) : (
        <motion.div key="marketing"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}>
          <MarketingApp onEnterApp={() => setShowAuth(true)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
