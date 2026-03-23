import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  FileText,
  Download,
  Image,
  ChevronRight,
} from 'lucide-react';
import {
  Orb,
  GridBg,
  MonoLabel,
  DisplayHeading,
  BodyLg,
  BodyText,
  Spinner,
  ReportWrap,
  NavRow,
} from '../shared/DesignSystem';

// ═══════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════

export function SynthesisLoadingScreen() {
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
      <Orb size={400} opacity={0.2} />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <MonoLabel>analyzing your conversation</MonoLabel>
        <DisplayHeading>Building your report</DisplayHeading>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Spinner />
        </div>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#3A3835',
            marginTop: 24,
          }}
        >
          this takes about 45 seconds
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// STRENGTH REVEAL (full-screen animation)
// ═══════════════════════════════════════════════

export function StrengthRevealScreen({ strength, index, total, onContinue }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Orb size={400} opacity={0.2} />
      <GridBg opacity={0.03} />

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5C5955',
          zIndex: 1,
          opacity: 0,
          animation: 'rFade 0.6s ease 0.2s forwards',
        }}
      >
        strength_{String(index + 1).padStart(2, '0')} of{' '}
        {String(total).padStart(2, '0')}
      </div>

      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.6875rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#B8A9FF',
          margin: '24px 0',
          zIndex: 1,
          opacity: 0,
          animation: 'rFade 0.6s ease 0.5s forwards',
        }}
      >
        Your Signature Strength
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 0.95,
          letterSpacing: '-0.04em',
          color: '#F0EDE8',
          zIndex: 1,
          opacity: 0,
          animation: 'rSlideUp 1s ease 0.8s forwards',
        }}
      >
        {strength.name}
      </div>

      <div
        style={{
          width: 32,
          height: 2,
          background: '#B8A9FF',
          margin: '24px auto',
          zIndex: 1,
          opacity: 0,
          animation: 'rExpand 0.5s ease 1.4s forwards',
        }}
      />

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '1.0625rem',
          fontWeight: 300,
          lineHeight: 1.7,
          color: '#A8A4A0',
          maxWidth: 420,
          zIndex: 1,
          opacity: 0,
          animation: 'rFade 0.8s ease 1.7s forwards',
        }}
      >
        {strength.description}
      </div>

      <div
        style={{
          marginTop: 48,
          zIndex: 1,
          opacity: 0,
          animation: 'rFade 0.6s ease 2.2s forwards',
        }}
      >
        <button
          onClick={onContinue}
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
  );
}

// ═══════════════════════════════════════════════
// PROFILE OVERVIEW (always free)
// ═══════════════════════════════════════════════

export function ProfileScreen({ profile, onNext }) {
  return (
    <ReportWrap>
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 32,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#5C5955',
          }}
        >
          ai-generated insights to help you reflect
        </p>
      </div>

      <MonoLabel>your profile</MonoLabel>
      <DisplayHeading>{"Here's what we see in you"}</DisplayHeading>

      <div style={{ marginTop: 8 }}>
        {profile
          .split('\n')
          .filter((p) => p.trim())
          .map((p, i) => (
            <BodyLg key={i} style={{ marginBottom: 16 }}>
              {p}
            </BodyLg>
          ))}
      </div>

      <NavRow onNext={onNext} nextLabel="See Your Strengths" />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// STRENGTH DETAIL SCREEN (full card with formatting)
// Used for the 2 free strengths shown before paywall
// ═══════════════════════════════════════════════

export function StrengthDetailScreen({ strength, num, onBack, onNext, nextLabel }) {
  return (
    <ReportWrap>
      <MonoLabel>
        strength {String(num).padStart(2, '0')} of 05
      </MonoLabel>

      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: '#F0EDE8',
          marginBottom: 16,
          lineHeight: 1.1,
        }}
      >
        {strength.name}
      </h2>

      <BodyLg style={{ marginBottom: 32 }}>
        {strength.description}
      </BodyLg>

      {/* What makes this valuable */}
      {strength.valuable && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFB88C',
              marginBottom: 8,
            }}
          >
            What makes this valuable
          </div>
          <BodyText>{strength.valuable}</BodyText>
        </div>
      )}

      {/* How to deploy this */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#B8A9FF',
            marginBottom: 12,
          }}
        >
          How to deploy this
        </div>

        {strength.thisWeek && (
          <div
            style={{
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                color: '#B8A9FF',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              This week
            </span>
            <BodyText style={{ marginTop: 4 }}>
              {strength.thisWeek}
            </BodyText>
          </div>
        )}

        {strength.inInterviews && (
          <div
            style={{
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                color: '#B8A9FF',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              In interviews
            </span>
            <BodyText style={{ marginTop: 4, fontStyle: 'italic' }}>
              {strength.inInterviews}
            </BodyText>
          </div>
        )}

        {strength.bestRoles && (
          <div
            style={{
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '14px 18px',
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.625rem',
                color: '#B8A9FF',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Best roles for this
            </span>
            <BodyText style={{ marginTop: 4 }}>
              {strength.bestRoles}
            </BodyText>
          </div>
        )}
      </div>

      {/* Watch out */}
      {strength.watchOut && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FF8F8F',
              marginBottom: 8,
            }}
          >
            Watch out
          </div>
          <div
            style={{
              background: 'rgba(255,143,143,0.06)',
              border: '1px solid rgba(255,143,143,0.15)',
              borderRadius: 8,
              padding: '14px 18px',
            }}
          >
            <BodyText>{strength.watchOut}</BodyText>
          </div>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextLabel={nextLabel} />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// PAYWALL SCREEN (standalone)
// ═══════════════════════════════════════════════

export function PaywallScreen({ onPayment, onBack }) {
  const features = [
    'All 5 bespoke strengths with deployment guides',
    'Rare strength combinations',
    'Deal-breakers checklist',
    '5 role territories to explore',
    'Career narrative for LinkedIn',
    'Downloadable PDF report',
    'Shareable strength cards for LinkedIn and Instagram',
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
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          background:
            'radial-gradient(ellipse, rgba(184,169,255,0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <GridBg opacity={0.02} />

      <div
        style={{
          maxWidth: 480,
          width: '100%',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          animation: 'slideUp 0.7s ease forwards',
        }}
      >
        <MonoLabel>2 of 5 strengths revealed</MonoLabel>

        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#F0EDE8',
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          {"There's more to"}
          <br />
          your story
        </h2>

        <BodyText style={{ maxWidth: 380, margin: '0 auto 40px' }}>
          Your full report reveals the complete picture — the patterns,
          the rare combinations, and where to take them next.
        </BodyText>

        {/* Feature list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 340,
            margin: '0 auto 40px',
            textAlign: 'left',
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                color: '#A8A4A0',
                fontWeight: 300,
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#B8A9FF',
                  flexShrink: 0,
                }}
              />
              {f}
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{ marginBottom: 28 }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '3.5rem',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              color: '#F0EDE8',
            }}
          >
            $39
          </span>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.6875rem',
              color: '#5C5955',
              marginLeft: 4,
              verticalAlign: 'super',
            }}
          >
            AUD
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onPayment}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '16px 40px',
            background: '#B8A9FF',
            color: '#0A0A0B',
            fontFamily: "'Inter', sans-serif",
            fontSize: '1rem',
            fontWeight: 500,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'all 350ms',
          }}
        >
          Unlock Full Report <ArrowRight size={16} />
        </button>

        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#3A3835',
            marginTop: 24,
          }}
        >
          encrypted payment via stripe · data stays on your device
        </p>

        {/* Back */}
        <div style={{ marginTop: 40 }}>
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
            ← Back to strengths
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DOWNLOADS PAGE (post-payment)
// ═══════════════════════════════════════════════

export function DownloadsScreen({ onDownloadPDF, pdfDownloading }) {
  return (
    <ReportWrap>
      <MonoLabel>your full report</MonoLabel>
      <DisplayHeading>Everything you need</DisplayHeading>
      <BodyText style={{ marginBottom: 40 }}>
        Download your assets below. Bookmark this page — you can come back
        anytime.
      </BodyText>

      {/* PDF Report */}
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(184,169,255,0.3)',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              'linear-gradient(90deg, transparent, #B8A9FF, transparent)',
          }}
        />
        <FileText
          size={28}
          style={{ color: '#B8A9FF', marginBottom: 12 }}
        />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#F0EDE8',
            marginBottom: 4,
          }}
        >
          Career Clarity Report
        </div>
        <BodyText style={{ marginBottom: 16 }}>
          Your complete report — strengths, combinations, deal-breakers,
          role territories, and career narrative.
        </BodyText>
        <button
          onClick={onDownloadPDF}
          disabled={pdfDownloading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: '#B8A9FF',
            color: '#0A0A0B',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
            fontWeight: 500,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            opacity: pdfDownloading ? 0.5 : 1,
          }}
        >
          {pdfDownloading ? (
            'Generating...'
          ) : (
            <>
              <Download size={16} /> Download PDF
            </>
          )}
        </button>
      </div>

      {/* Strength Cards */}
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Image size={22} style={{ color: '#FFB88C' }} />
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: '#F0EDE8',
              }}
            >
              Strength Cards
            </div>
            <BodyText>
              5 shareable cards for LinkedIn and Instagram
            </BodyText>
          </div>
        </div>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'transparent',
            color: '#F0EDE8',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8125rem',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            cursor: 'pointer',
            opacity: 0.4,
          }}
          disabled
        >
          Coming soon
        </button>
      </div>

      {/* Combination Cards */}
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Image size={22} style={{ color: '#8CCFB8' }} />
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.0625rem',
                fontWeight: 600,
                color: '#F0EDE8',
              }}
            >
              Combination Cards
            </div>
            <BodyText>
              3 combo cards + your rarest combination
            </BodyText>
          </div>
        </div>
        <button
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'transparent',
            color: '#F0EDE8',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8125rem',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            cursor: 'pointer',
            opacity: 0.4,
          }}
          disabled
        >
          Coming soon
        </button>
      </div>

      {/* Feedback */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          marginTop: 32,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1rem',
            fontWeight: 500,
            color: '#F0EDE8',
            marginBottom: 8,
          }}
        >
          Help improve Candoor
        </div>
        <a
          href="https://forms.gle/fUaxKWAMbQZdbXNk7"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: 'transparent',
            color: '#F0EDE8',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.8125rem',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            textDecoration: 'none',
            marginTop: 8,
          }}
        >
          Take 2-Min Survey
        </a>
      </div>
    </ReportWrap>
  );
}
