import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Lock, Check } from 'lucide-react';
import {
  Orb,
  GridBg,
  MonoLabel,
  DisplayHeading,
  BodyLg,
  BodyText,
} from './DesignSystem';

// ═══════════════════════════════════════════════
// SCREEN 1: LANDING
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
          Candoor
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
          The career conversation you've been avoiding.
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
            Walk through the door <ArrowRight size={16} />
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
          20 minutes · private · radically honest
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SCREEN 2: HOW IT WORKS + WHAT YOU GET (merged)
// ═══════════════════════════════════════════════

export function IntroScreen({ onComplete, onBack }) {
  const steps = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8A9FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      title: 'Not a quiz. A conversation.',
      sub: "An AI that cares about what's true, not what sounds good.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8A9FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      title: 'Radical honesty in, radical clarity out.',
      sub: 'Energy, drains, strengths, wins, direction\u2009—\u2009in 20 minutes.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8A9FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="7 3 21 3 21 17" />
          <line x1="3" y1="21" x2="21" y2="3" />
        </svg>
      ),
      title: 'You walk away with proof.',
      sub: 'Your first 2 strengths and a career overview are free. Unlock the full report when you\u2019re ready.',
    },
  ];

  const deliverables = [
    'Five signature strengths\u2009—\u2009named, sharp, and specific to you',
    'Non-negotiables you should stop compromising on',
    'Role territories that match how you actually operate',
    'A career narrative you can use immediately',
    'Strength cards you\u2019ll want to share',
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
      <Orb size={450} opacity={0.08} />
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
        {/* ─── How Candoor Works ─── */}
        <MonoLabel>how candoor works</MonoLabel>
        <DisplayHeading>20 minutes of radical honesty.</DisplayHeading>

        {/* Vertical stepper */}
        <div style={{ marginTop: 40 }}>
          {steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 20,
                position: 'relative',
                paddingBottom: i < steps.length - 1 ? 32 : 0,
                opacity: 0,
                animation: `staggerFadeUp 0.5s ease ${0.2 + i * 0.15}s forwards`,
              }}
            >
              {/* Vertical connector line */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: 32,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(184,169,255,0.15)',
                  }}
                />
              )}

              {/* Icon */}
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {step.icon}
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '1.0625rem',
                    fontWeight: 600,
                    color: '#F0EDE8',
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.9375rem',
                    fontWeight: 300,
                    color: '#A8A4A0',
                    lineHeight: 1.55,
                  }}
                >
                  {step.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Divider ─── */}
        <div
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.06)',
            margin: '40px 0',
          }}
        />

        {/* ─── What You Get ─── */}
        <MonoLabel>what's on the other side</MonoLabel>

        <div style={{ marginTop: 16 }}>
          {deliverables.map((text, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: '14px 0',
                borderBottom:
                  i < deliverables.length - 1
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                opacity: 0,
                animation: `staggerFadeUp 0.4s ease ${0.7 + i * 0.08}s forwards`,
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
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9375rem',
                  fontWeight: 300,
                  lineHeight: 1.55,
                  color: '#A8A4A0',
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* ─── Callout ─── */}
        <div
          style={{
            background: 'rgba(184,169,255,0.06)',
            border: '1px solid rgba(184,169,255,0.2)',
            borderRadius: 12,
            padding: 24,
            marginTop: 36,
          }}
        >
          <p
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1rem',
              fontWeight: 600,
              color: '#B8A9FF',
              marginBottom: 8,
            }}
          >
            Treat this like it costs $5,000.
          </p>
          <BodyText style={{ color: '#A8A4A0' }}>
            Because that's what this conversation replaces. Pop your phone
            on silent. 20 minutes. Depth in, depth out.
          </BodyText>
        </div>

        {/* ─── Navigation ─── */}
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={onBack}
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
            Open the door <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SCREEN 3: CONSENT
// ═══════════════════════════════════════════════

export function ConsentScreen({ onConsent }) {
  const [checks, setChecks] = useState({
    terms: false,
    age: false,
    data: false,
  });
  const allChecked = checks.terms && checks.age && checks.data;

  const toggle = (key) =>
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    {
      key: 'terms',
      text: 'I understand Candoor is a self-reflection tool, not professional career advice, and I agree to the Terms of Service',
    },
    {
      key: 'age',
      text: 'I am 18 years of age or older',
    },
    {
      key: 'data',
      text: 'I understand my responses will be processed by AI to generate my report',
    },
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
              One last thing
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
              your words stay yours
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
            Nothing is stored on our servers. Your responses live on your
            device only, processed by AI to build your report, then yours
            to keep or delete.
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
                  checks[item.key]
                    ? '#B8A9FF'
                    : 'rgba(255,255,255,0.1)'
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
            {allChecked
              ? 'Start the conversation'
              : 'Please agree to all items'}
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
