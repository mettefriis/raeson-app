// ─── Marketing app — home + sub-pages ────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useTweaks, Nav, Footer, TweaksPanel, Grain } from './Shared.jsx';
import { MinimalHome, ProblemSection, HowItWorks, CtaBand } from './HomeSections.jsx';
import { DemoStage } from './DemoStage.jsx';
import { PlatformPage, PricingPage, AboutPage, JournalPage, ContactPage } from './Pages.jsx';

function Home({ C, tweaks, onNavigate }) {
  return (
    <div style={{ color: C.text, minHeight: '100vh', position: 'relative' }}>
      <Grain enabled={tweaks.grain} isDark={C.isDark} />
      <Nav C={C} current="home" onNavigate={onNavigate} />
      <MinimalHome C={C} onNavigate={onNavigate} />
      <ProblemSection C={C} />
      <HowItWorks C={C} />
      <CtaBand C={C} onNavigate={onNavigate} />
      <Footer C={C} onNavigate={onNavigate} />
    </div>
  );
}

function MarketingApp({ onEnterApp }) {
  const { tweaks, setTweaks, editMode, C } = useTweaks();
  const [page, setPage] = useState('home');

  // Sync body background to theme
  useEffect(() => {
    document.body.style.background = C.bg;
    document.body.style.color = C.text;
  }, [C]);

  const navigate = (key) => {
    if (key === 'app' || key === 'signin') {
      onEnterApp && onEnterApp();
      return;
    }
    setPage(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageProps = { C, onNavigate: navigate };

  return (
    <div style={{ color: C.text, minHeight: '100vh', position: 'relative' }}>
      {page !== 'home' && (
        <Nav C={C} current={page} onNavigate={navigate} />
      )}

      {page === 'home'     && <Home C={C} tweaks={tweaks} onNavigate={navigate} />}
      {page === 'platform' && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <PlatformPage {...pageProps} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}
      {page === 'pricing'  && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <PricingPage {...pageProps} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}
      {page === 'about'    && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <AboutPage {...pageProps} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}
      {page === 'journal'  && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <JournalPage {...pageProps} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}
      {page === 'contact'  && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <ContactPage {...pageProps} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}
      {page === 'demo'     && (
        <div style={{ color: C.text, minHeight: '100vh' }}>
          <DemoStage C={C} tweaks={tweaks} />
          <Footer C={C} onNavigate={navigate} />
        </div>
      )}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} C={C} visible={editMode} />
    </div>
  );
}

export default MarketingApp;
