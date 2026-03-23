import React, { useState, useEffect, useCallback } from 'react';
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
  StrengthDetailScreen,
  PaywallScreen,
  DownloadsScreen,
} from '../components/synthesis/SynthesisScreens';
import { parseSynthesis } from '../lib/parsers';
import {
  callAPI,
  buildSynthesisPromptPart1,
  buildSynthesisPromptPart2,
} from '../lib/prompts';

// ═══════════════════════════════════════════════
// Candoor v5 — ROOT ORCHESTRATOR
//
// Screen flow:
//   landing → intro → consent → chat
//   → synthesis_loading → profile → reveal1 → strength1
//   → reveal2 → strength2 → paywall
//   → (payment) → downloads
// ═══════════════════════════════════════════════

export default function Candoor() {
  // ── Screen routing ──
  const [screen, setScreen] = useState('loading');

  // ── Chat state ──
  const [messages, setMessages] = useState([]);
  const [parsedMessages, setParsedMessages] = useState([]);
  const [chatComplete, setChatComplete] = useState(false);

  // ── Synthesis state ──
  const [synthesisContent, setSynthesisContent] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [synthesisGenerating, setSynthesisGenerating] = useState(false);

  // ── Reveal tracking ──
  const [revealStrength, setRevealStrength] = useState(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealNextScreen, setRevealNextScreen] = useState(null);

  // ── Payment / PDF ──
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // ═══════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════

  useEffect(() => {
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
            // If paid, go to downloads. Otherwise go to profile.
            if (localStorage.getItem('pl_payment') === 'true') {
              setPaymentCompleted(true);
              setScreen('downloads');
            } else {
              setScreen('profile');
            }
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

  // ── Persist ──
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
      setRevealStrength(null);
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
      setScreen('profile');
      return;
    }

    setSynthesisGenerating(true);
    setScreen('synthesis_loading');

    try {
      const transcript = messages
        .map(
          (m) =>
            `${m.role === 'user' ? 'THEM' : 'Candoor'}: ${m.content}`
        )
        .join('\n\n');

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
      setScreen('profile');
    } catch (e) {
      console.error('Synthesis error:', e);
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
      a.download = 'Candoor-career-report.pdf';
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
  // REVEAL HELPER — triggers animation then navigates
  // ═══════════════════════════════════════════════

  const triggerReveal = (strength, index, nextScreen) => {
    setRevealStrength(strength);
    setRevealIndex(index);
    setRevealNextScreen(nextScreen);
    setScreen('reveal');
  };

  // ═══════════════════════════════════════════════
  // SCREEN ROUTING
  // ═══════════════════════════════════════════════

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

  if (screen === 'landing') {
    return <LandingScreen onStart={() => setScreen('intro')} />;
  }

  if (screen === 'intro') {
    return (
      <IntroScreen
        onComplete={() => setScreen('consent')}
        onBack={() => setScreen('landing')}
      />
    );
  }

  if (screen === 'consent') {
    return <ConsentScreen onConsent={() => setScreen('chat')} />;
  }

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

  // Synthesis loading
  if (screen === 'synthesis_loading') {
    return <SynthesisLoadingScreen />;
  }

  // Strength reveal animation
  if (screen === 'reveal' && revealStrength) {
    return (
      <StrengthRevealScreen
        strength={revealStrength}
        index={revealIndex}
        total={5}
        onContinue={() => {
          setRevealStrength(null);
          setScreen(revealNextScreen);
        }}
      />
    );
  }

  // Profile (always free)
  if (screen === 'profile' && parsedData) {
    return (
      <ProfileScreen
        profile={parsedData.profile}
        onNext={() => {
          if (parsedData.superpowers[0]) {
            triggerReveal(parsedData.superpowers[0], 0, 'strength1');
          } else {
            setScreen('paywall');
          }
        }}
      />
    );
  }

  // Strength #1 detail (free)
  if (screen === 'strength1' && parsedData?.superpowers[0]) {
    return (
      <StrengthDetailScreen
        strength={parsedData.superpowers[0]}
        num={1}
        onBack={() => setScreen('profile')}
        onNext={() => {
          if (parsedData.superpowers[1]) {
            triggerReveal(parsedData.superpowers[1], 1, 'strength2');
          } else {
            setScreen('paywall');
          }
        }}
        nextLabel="Next Strength"
      />
    );
  }

  // Strength #2 detail (free)
  if (screen === 'strength2' && parsedData?.superpowers[1]) {
    return (
      <StrengthDetailScreen
        strength={parsedData.superpowers[1]}
        num={2}
        onBack={() => setScreen('strength1')}
        onNext={() => setScreen('paywall')}
        nextLabel="See Full Report"
      />
    );
  }

  // Paywall
  if (screen === 'paywall') {
    return (
      <PaywallScreen
        onPayment={handlePayment}
        onBack={() => setScreen('strength2')}
      />
    );
  }

  // Downloads (post-payment)
  if (screen === 'downloads' && paymentCompleted) {
    return (
      <DownloadsScreen
        onDownloadPDF={downloadPDF}
        pdfDownloading={pdfDownloading}
      />
    );
  }

  // Fallback
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
