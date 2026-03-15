import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Check } from 'lucide-react';
import {
  Orb,
  GridBg,
  MonoLabel,
  DisplayHeading,
  BodyLg,
  BodyText,
} from '../shared/DesignSystem';

// ═══════════════════════════════════════════════
// LANDING
// ═══════════════════════════════════════════════

export function LandingScreen({ onStart }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Orb size={600} opacity={0.12} />
      <GridBg opacity={0.025} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(3rem, 9vw, 6rem)',
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            color: '#F0EDE8',
            animation: 'fadeIn 1s ease forwards',
          }}
        >
          Pathlight
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '1.0625rem',
            fontWeight: 300,
            color: '#A8A4A0',
            marginTop: 24,
            opacity: 0,
            animation: 'fadeIn 1s ease 0.3s forwards',
          }}
        >
          Find clarity in your career
        </p>

        <div
          style={{
            marginTop: 48,
            opacity: 0,
            animation: 'fadeIn 1s ease 0.6s forwards',
          }}
        >
          <button
            onClick={onStart}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: '#F0EDE8',
              color: '#0A0A0B',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 350ms',
            }}
          >
            Begin <ArrowRight size={16} />
          </button>
        </div>

        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#5C5955',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 16,
            opacity: 0,
            animation: 'fadeIn 1s ease 0.9s forwards',
          }}
        >
          20 minutes · private · ai-powered
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// INTRO (2 pages)
// ═══════════════════════════════════════════════

export function IntroScreen({ onComplete, onBack }) {
  const [page, setPage] = useState(0);

  if (page === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0A0A0B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <GridBg opacity={0.015} />

        <div
          style={{
            maxWidth: 560,
            width: '100%',
            position: 'relative',
            zIndex: 1,
            animation: 'slideUp 0.7s ease forwards',
          }}
        >
          <MonoLabel>before we start</MonoLabel>
          <DisplayHeading>
            You're here because something isn't quite right.
          </DisplayHeading>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              marginTop: 32,
            }}
          >
            {[
              "Maybe you feel stuck in a role that doesn't fit anymore.",
              "Maybe you lack direction.",
              "Maybe you're ready for something bigger but don't know what.",
            ].map((text, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.0625rem',
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: '#A8A4A0',
                  opacity: 0,
                  animation: `staggerFadeUp 0.6s ease ${0.3 + i * 0.15}s forwards`,
                }}
              >
                {text}
              </p>
            ))}
          </div>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.0625rem',
              fontWeight: 300,
              lineHeight: 1.7,
              color: '#F0EDE8',
              marginTop: 32,
              opacity: 0,
              animation: 'staggerFadeUp 0.6s ease 0.75s forwards',
            }}
          >
            That's okay. You're in the right place.
          </p>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: 24,
              marginTop: 32,
              backdropFilter: 'blur(20px)',
              opacity: 0,
              animation: 'staggerFadeUp 0.6s ease 0.9s forwards',
            }}
          >
            <BodyText>
              This works like a conversation with a sharp friend who sees your
              blind spots. The more honest and specific you are, the more useful
              your report will be. Give yourself 20 minutes somewhere quiet.
            </BodyText>
          </div>

          <div
            style={{
              marginTop: 48,
              paddingTop: 32,
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setPage(1)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 28px',
                background: '#F0EDE8',
                color: '#0A0A0B',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Page 2
  const items = [
    'Five signature strengths — uniquely named and actionable',
    'Deal-breakers you should never compromise on',
    'Role territories that fit how you actually work',
    'A career narrative ready for LinkedIn',
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GridBg opacity={0.015} />

      <div
        style={{
          maxWidth: 560,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          animation: 'slideUp 0.7s ease forwards',
        }}
      >
        <MonoLabel>after one conversation</MonoLabel>
        <DisplayHeading>What you'll walk away with</DisplayHeading>

        {items.map((text, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              padding: '20px 0',
              borderBottom:
                i < items.length - 1
                  ? '1px solid rgba(255,255,255,0.06)'
                  : 'none',
              opacity: 0,
              animation: `staggerFadeUp 0.5s ease ${0.2 + i * 0.12}s forwards`,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                color: '#B8A9FF',
                minWidth: 24,
                paddingTop: 4,
              }}
            >
              0{i + 1}
            </span>
            <BodyLg>{text}</BodyLg>
          </div>
        ))}

        <div
          style={{
            marginTop: 48,
            paddingTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setPage(0)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: '#5C5955',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={onComplete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: '#F0EDE8',
              color: '#0A0A0B',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.8125rem',
              fontWeight: 500,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Let's start <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// CONSENT
// ═══════════════════════════════════════════════

export function ConsentScreen({ onConsent }) {
  const [checks, setChecks] = useState({ terms: false, age: false, data: false });
  const allChecked = checks.terms && checks.age && checks.data;

  const toggle = (key) => setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    {
      key: 'terms',
      text: 'I agree to the Terms of Service and understand this is a self-reflection tool, not professional career advice',
    },
    { key: 'age', text: 'I am 18 years of age or older' },
    { key: 'data', text: 'I understand my responses will be processed by AI' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <GridBg opacity={0.015} />

      <div
        style={{
          maxWidth: 520,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          animation: 'slideUp 0.7s ease forwards',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
          }}
        >
          <Lock size={20} style={{ color: '#5C5955' }} />
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#F0EDE8',
              }}
            >
              Before we begin
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                color: '#5C5955',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              your privacy is protected
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <BodyText>
            Your data stays on your device. Responses are processed by AI to
            generate insights. We don't store your information on our servers.
          </BodyText>
        </div>

        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => toggle(item.key)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              cursor: 'pointer',
              padding: 16,
              borderRadius: 8,
              border: `1px solid ${
                checks[item.key]
                  ? 'rgba(184,169,255,0.3)'
                  : 'rgba(255,255,255,0.06)'
              }`,
              background: checks[item.key]
                ? 'rgba(184,169,255,0.06)'
                : '#111113',
              transition: 'all 150ms',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                minWidth: 20,
                borderRadius: 4,
                marginTop: 2,
                border: `2px solid ${
                  checks[item.key] ? '#B8A9FF' : 'rgba(255,255,255,0.1)'
                }`,
                background: checks[item.key] ? '#B8A9FF' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms',
              }}
            >
              {checks[item.key] && <Check size={12} color="#0A0A0B" />}
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem',
                fontWeight: 300,
                color: '#A8A4A0',
                lineHeight: 1.5,
              }}
            >
              {item.text}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 32 }}>
          <button
            onClick={allChecked ? onConsent : undefined}
            disabled={!allChecked}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 36px',
              background: allChecked ? '#B8A9FF' : '#1A1A1D',
              color: allChecked ? '#0A0A0B' : '#3A3835',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9375rem',
              fontWeight: 500,
              border: 'none',
              borderRadius: 4,
              cursor: allChecked ? 'pointer' : 'not-allowed',
              transition: 'all 350ms',
            }}
          >
            {allChecked ? 'Start the conversation' : 'Please agree to all items'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                color: '#3A3835',
              }}
            >
              <a href="/privacy" style={{ color: '#5C5955' }}>
                privacy
              </a>
              {' · '}
              <a href="/terms" style={{ color: '#5C5955' }}>
                terms
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
