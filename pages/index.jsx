import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spinner } from '../components/shared/DesignSystem';
import {
  LandingScreen,
  IntroScreen,
  ConsentScreen,
} from '../components/shared/PreChatScreens';
import ChatScreen from '../components/chat/ChatScreen';
import {
  SynthesisLoadingScreen,
  StrengthRevealScreen,
  ProfileScreen,
  StrengthsScreen,
  CombinationsScreen,
  DealBreakersScreen,
  TerritoriesScreen,
  CareerNarrativeScreen,
} from '../components/synthesis/SynthesisScreens';
import { parseSynthesis } from '../lib/parsers';
import {
  callAPI,
  buildSynthesisPromptPart1,
  buildSynthesisPromptPart2,
} from '../lib/prompts';

// ═══════════════════════════════════════════════
// PATHLIGHT v5 — ROOT ORCHESTRATOR
//
// Owns: screen routing, core state, localStorage,
//       synthesis generation, payment, PDF download
// Delegates: all UI to child components
// ═══════════════════════════════════════════════

export default function Pathlight() {
  // ── Screen routing ──
  const [screen, setScreen] = useState('loading');

  // ── Chat state (lifted — shared with ChatScreen) ──
  const [messages, setMessages] = useState([]);
  const [parsedMessages, setParsedMessages] = useState([]);
  const [chatComplete, setChatComplete] = useState(false);

  // ── Synthesis state ──
  const [synthesisContent, setSynthesisContent] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [synthesisScreen, setSynthesisScreen] = useState(0);
  const [synthesisGenerating, setSynthesisGenerating] = useState(false);

  // ── Strength reveal ──
  const [revealStrength, setRevealStrength] = useState(null);
  const [revealIndex, setRevealIndex] = useState(0);

  // ── Payment / PDF ──
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // ── Refs ──
  // Prevent synthesis from being generated twice (double-click,
  // accidental refresh during the 45s wait, re-mount, etc.)
  // Each full synthesis run costs ~15k tokens, so this matters.
  const synthesisLockRef = useRef(false);

  // ═══════════════════════════════════════════════
  // INITIALIZATION — localStorage restore + payment check
  // ═══════════════════════════════════════════════

  useEffect(() => {
    // Check for payment return
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('payment') === 'success' ||
      params.get('unlock') === 'true'
    ) {
      setPaymentCompleted(true);
      try {
        localStorage.setItem('pl_payment', 'true');
      } catch (e) {}
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Restore from localStorage
    try {
      const saved = localStorage.getItem('pl_state');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.messages?.length > 0) {
          setMessages(state.messages);
          setParsedMessages(state.parsedMessages || []);
          setChatComplete(state.chatComplete || false);
          setSynthesisContent(state.synthesisContent || null);

          if (state.synthesisContent) {
            setParsedData(parseSynthesis(state.synthesisContent));
            setScreen('synthesis');
          } else {
            setScreen('chat');
          }
        } else {
          setScreen('landing');
        }
      } else {
        setScreen('landing');
      }

      if (localStorage.getItem('pl_payment') === 'true') {
        setPaymentCompleted(true);
      }
    } catch (e) {
      setScreen('landing');
    }
  }, []);

  // ── Persist state to localStorage ──
  useEffect(() => {
    if (screen === 'loading') return;
    try {
      localStorage.setItem(
        'pl_state',
        JSON.stringify({
          messages,
          parsedMessages,
          chatComplete,
          synthesisContent,
        })
      );
    } catch (e) {}
  }, [messages, parsedMessages, chatComplete, synthesisContent, screen]);

  // ═══════════════════════════════════════════════
  // RESET
  // ═══════════════════════════════════════════════

  const resetProgress = () => {
    if (confirm('Start fresh? All progress will be cleared.')) {
      setMessages([]);
      setParsedMessages([]);
      setChatComplete(false);
      setSynthesisContent(null);
      setParsedData(null);
      setPaymentCompleted(false);
      setSynthesisScreen(0);
      setRevealStrength(null);
      synthesisLockRef.current = false;
      setScreen('landing');
      try {
        localStorage.removeItem('pl_state');
        localStorage.removeItem('pl_payment');
      } catch (e) {}
    }
  };

  // ═══════════════════════════════════════════════
  // SYNTHESIS GENERATION
  // ═══════════════════════════════════════════════

  const generateSynthesis = useCallback(async () => {
    if (synthesisContent) {
      setParsedData(parseSynthesis(synthesisContent));
      return;
    }

    // Hard lock — prevents double-firing under any circumstance
    // (double-click, remount, concurrent calls, etc.)
    if (synthesisLockRef.current) return;
    synthesisLockRef.current = true;

    setSynthesisGenerating(true);
    setScreen('synthesis');

    try {
      const transcript = messages
        .map(
          (m) =>
            `${m.role === 'user' ? 'THEM' : 'PATHLIGHT'}: ${m.content}`
        )
        .join('\n\n');

      // Part 1: Profile + Strengths + Combinations
      const part1 = await callAPI(
        [
          {
            role: 'user',
            content:
              'Create my profile, signature strengths, and strength combinations.',
          },
        ],
        buildSynthesisPromptPart1(transcript),
        4000
      );

      // Part 2: Deal-breakers + Territories + Narrative
      const part2 = await callAPI(
        [
          {
            role: 'user',
            content:
              'Create my deal-breakers, role territories, and career narrative.',
          },
        ],
        buildSynthesisPromptPart2(transcript, part1),
        3500
      );

      const full = part1 + '\n\n' + part2;
      setSynthesisContent(full);
      setParsedData(parseSynthesis(full));
    } catch (e) {
      console.error('Synthesis error:', e);
      // Release lock on failure so the user can retry
      synthesisLockRef.current = false;
    } finally {
      setSynthesisGenerating(false);
    }
  }, [messages, synthesisContent]);

  // ═══════════════════════════════════════════════
  // PAYMENT + PDF
  // ═══════════════════════════════════════════════

  const handlePayment = async () => {
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      window.location.href = data.url;
    } catch (e) {
      alert('Payment failed. Please try again.');
    }
  };

  const downloadPDF = async () => {
    if (!synthesisContent) return;
    setPdfDownloading(true);

    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ synthesisContent }),
      });
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pathlight-career-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('PDF generation failed. Please try again.');
    } finally {
      setPdfDownloading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // SCREEN ROUTING
  // ═══════════════════════════════════════════════

  // ─── Loading ───
  if (screen === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0A0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner />
      </div>
    );
  }

  // ─── Landing ───
  if (screen === 'landing') {
    return (
      <LandingScreen
        onStart={() => setScreen('intro')}
      />
    );
  }

  // ─── Intro ───
  if (screen === 'intro') {
    return (
      <IntroScreen
        onComplete={() => setScreen('consent')}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // ─── Consent ───
  if (screen === 'consent') {
    return (
      <ConsentScreen
        onConsent={() => setScreen('chat')}
      />
    );
  }

  // ─── Chat ───
  if (screen === 'chat') {
    return (
      <ChatScreen
        messages={messages}
        setMessages={setMessages}
        parsedMessages={parsedMessages}
        setParsedMessages={setParsedMessages}
        chatComplete={chatComplete}
        setChatComplete={setChatComplete}
        onGenerateReport={generateSynthesis}
        resetProgress={resetProgress}
      />
    );
  }

  // ─── Strength Reveal ───
  if (screen === 'reveal' && revealStrength) {
    return (
      <StrengthRevealScreen
        strength={revealStrength}
        index={revealIndex}
        total={5}
        onContinue={() => {
          setRevealStrength(null);
          setSynthesisScreen(1);
          setScreen('synthesis');
        }}
      />
    );
  }

  // ─── Synthesis ───
  if (screen === 'synthesis') {
    // Loading
    if (synthesisGenerating || (!parsedData && !synthesisContent)) {
      return <SynthesisLoadingScreen />;
    }

    // Parse if needed
    if (synthesisContent && !parsedData) {
      setParsedData(parseSynthesis(synthesisContent));
      return null;
    }

    if (!parsedData) return null;

    // Screen 0: Profile
    if (synthesisScreen === 0) {
      return (
        <ProfileScreen
          profile={parsedData.profile}
          onNext={() => {
            if (parsedData.superpowers[0]) {
              setRevealStrength(parsedData.superpowers[0]);
              setRevealIndex(0);
              setScreen('reveal');
            } else {
              setSynthesisScreen(1);
            }
          }}
        />
      );
    }

    // Screen 1: Strengths
    if (synthesisScreen === 1) {
      return (
        <StrengthsScreen
          superpowers={parsedData.superpowers}
          superpowersSummary={parsedData.superpowersSummary}
          paymentCompleted={paymentCompleted}
          onBack={() => setSynthesisScreen(0)}
          onNext={() => setSynthesisScreen(2)}
          onPayment={handlePayment}
        />
      );
    }

    // Screen 2: Combinations (paid only)
    if (synthesisScreen === 2 && paymentCompleted) {
      return (
        <CombinationsScreen
          combos={parsedData.strengthCombos}
          rarestCombo={parsedData.rarestCombo}
          onBack={() => setSynthesisScreen(1)}
          onNext={() => setSynthesisScreen(3)}
        />
      );
    }

    // Screen 3: Deal-breakers (paid only)
    if (synthesisScreen === 3 && paymentCompleted) {
      return (
        <DealBreakersScreen
          dealbreakers={parsedData.dealbreakers}
          onBack={() => setSynthesisScreen(2)}
          onNext={() => setSynthesisScreen(4)}
        />
      );
    }

    // Screen 4: Territories (paid only)
    if (synthesisScreen === 4 && paymentCompleted) {
      return (
        <TerritoriesScreen
          territories={parsedData.territories}
          onBack={() => setSynthesisScreen(3)}
          onNext={() => setSynthesisScreen(5)}
        />
      );
    }

    // Screen 5: Career Narrative + PDF (paid only)
    if (synthesisScreen === 5 && paymentCompleted) {
      return (
        <CareerNarrativeScreen
          careerNarrative={parsedData.careerNarrative}
          shortIntro={parsedData.shortIntro}
          onBack={() => setSynthesisScreen(4)}
          onDownloadPDF={downloadPDF}
          pdfDownloading={pdfDownloading}
        />
      );
    }
  }

  // ─── Fallback ───
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#5C5955',
      }}
    >
      <p>
        Something went wrong.{' '}
        <button
          onClick={resetProgress}
          style={{
            color: '#B8A9FF',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Reset
        </button>
      </p>
    </div>
  );
}
