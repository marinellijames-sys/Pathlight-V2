import React, { useState } from 'react';
import {
  ArrowRight,
  Lock,
  FileText,
  Download,
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
        strength_{String(index + 1).padStart(2, '0')} of {String(total).padStart(2, '0')}
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
      <DisplayHeading>Here's what we see in you</DisplayHeading>

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
// STRENGTH CARD (full — used post-payment + first 2 free)
// ═══════════════════════════════════════════════

function StrengthCard({ pw, num, showDetails }) {
  return (
    <div
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: 24,
          borderBottom: showDetails ? '1px solid rgba(255,255,255,0.06)' : 'none',
          display: 'flex',
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#B8A9FF',
            paddingTop: 4,
          }}
        >
          {String(num).padStart(2, '0')}
        </span>
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(1.375rem, 3vw, 1.75rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#F0EDE8',
              marginBottom: 4,
            }}
          >
            {pw.name}
          </div>
          <BodyText>{pw.description}</BodyText>
        </div>
      </div>

      {showDetails && (
        <div style={{ padding: 24, display: 'grid', gap: 20 }}>
          {pw.valuable && (
            <div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FFB88C',
                  marginBottom: 4,
                }}
              >
                What makes this valuable
              </div>
              <BodyText>{pw.valuable}</BodyText>
            </div>
          )}

          <div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#B8A9FF',
                marginBottom: 8,
              }}
            >
              How to deploy this
            </div>
            {pw.thisWeek && (
              <BodyText style={{ marginBottom: 8 }}>
                <strong style={{ color: '#F0EDE8', fontWeight: 500 }}>
                  This week:
                </strong>{' '}
                {pw.thisWeek}
              </BodyText>
            )}
            {pw.inInterviews && (
              <BodyText style={{ marginBottom: 8 }}>
                <strong style={{ color: '#F0EDE8', fontWeight: 500 }}>
                  In interviews:
                </strong>{' '}
                {pw.inInterviews}
              </BodyText>
            )}
            {pw.bestRoles && (
              <BodyText>
                <strong style={{ color: '#F0EDE8', fontWeight: 500 }}>
                  Best roles:
                </strong>{' '}
                {pw.bestRoles}
              </BodyText>
            )}
          </div>

          {pw.watchOut && (
            <div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.6875rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#FF8F8F',
                  marginBottom: 4,
                }}
              >
                Watch out
              </div>
              <BodyText>{pw.watchOut}</BodyText>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// LOCKED CARD (blurred teaser)
// ═══════════════════════════════════════════════

function LockedCard({ pw, num }) {
  return (
    <div
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          filter: 'blur(6px)',
          opacity: 0.25,
          userSelect: 'none',
          display: 'flex',
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#B8A9FF',
          }}
        >
          {String(num).padStart(2, '0')}
        </span>
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#F0EDE8',
              marginBottom: 4,
            }}
          >
            {pw.name}
          </div>
          <BodyText>{pw.description?.substring(0, 60)}...</BodyText>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 20px',
            background: '#1A1A1D',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#5C5955',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <Lock size={12} /> unlock full report
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// STRENGTHS SCREEN (free + paid views)
// ═══════════════════════════════════════════════

export function StrengthsScreen({
  superpowers,
  superpowersSummary,
  paymentCompleted,
  onBack,
  onNext,
  onPayment,
}) {
  return (
    <ReportWrap>
      <MonoLabel>signature strengths</MonoLabel>
      <DisplayHeading>What you've been bringing to the table</DisplayHeading>
      <BodyText style={{ marginBottom: 32 }}>
        Strengths you undervalue because they come naturally.
      </BodyText>

      {paymentCompleted ? (
        <>
          {superpowers.slice(0, 5).map((pw, i) => (
            <StrengthCard key={i} pw={pw} num={i + 1} showDetails />
          ))}

          {superpowersSummary.whyTogether && (
            <div style={{ marginTop: 32 }}>
              <MonoLabel>why these matter together</MonoLabel>
              <BodyLg style={{ marginTop: 8 }}>
                {superpowersSummary.whyTogether}
              </BodyLg>
            </div>
          )}

          {superpowersSummary.valueProp && (
            <div
              style={{
                background: '#111113',
                border: '1px solid rgba(184,169,255,0.3)',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                marginTop: 24,
                position: 'relative',
                overflow: 'hidden',
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
              <p
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  color: '#F0EDE8',
                  fontStyle: 'italic',
                }}
              >
                "{superpowersSummary.valueProp}"
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {superpowers.slice(0, 2).map((pw, i) => (
            <StrengthCard key={i} pw={pw} num={i + 1} showDetails />
          ))}
          {superpowers.slice(2, 5).map((pw, i) => (
            <LockedCard key={i} pw={pw} num={i + 3} />
          ))}
          <PaywallCard onPayment={onPayment} />
        </>
      )}

      <NavRow
        onBack={onBack}
        onNext={paymentCompleted ? onNext : null}
        nextLabel="Strength Combinations"
      />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// PAYWALL CARD (inline within strengths screen)
// ═══════════════════════════════════════════════

function PaywallCard({ onPayment }) {
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
        background: '#0A0A0B',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '64px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 32,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          height: 300,
          background:
            'radial-gradient(ellipse, rgba(184,169,255,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <GridBg opacity={0.02} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <MonoLabel>2 of 5 strengths revealed</MonoLabel>

        <h3
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
          There's more to
          <br />
          your story
        </h3>

        <BodyText style={{ maxWidth: 380, margin: '0 auto 32px' }}>
          Your full report reveals the complete picture — the patterns, the rare
          combinations, and where to take them next.
        </BodyText>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            maxWidth: 300,
            margin: '0 auto 32px',
            textAlign: 'left',
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                color: '#A8A4A0',
                fontWeight: 300,
              }}
            >
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#B8A9FF',
                  flexShrink: 0,
                }}
              />
              {f}
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
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

        <button
          onClick={onPayment}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 36px',
            background: '#B8A9FF',
            color: '#0A0A0B',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            fontWeight: 500,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
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
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// COMBINATIONS SCREEN
// ═══════════════════════════════════════════════

export function CombinationsScreen({ combos, rarestCombo, onBack, onNext }) {
  return (
    <ReportWrap>
      <MonoLabel>strength combinations</MonoLabel>
      <DisplayHeading>Where your strengths multiply</DisplayHeading>
      <BodyText style={{ marginBottom: 32 }}>
        Individual strengths are useful. Combinations make you irreplaceable.
      </BodyText>

      {combos.map((c, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 12,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#F0EDE8',
              marginBottom: 8,
            }}
          >
            {c.title}
          </div>
          <BodyText style={{ whiteSpace: 'pre-wrap' }}>{c.body}</BodyText>
        </div>
      ))}

      {rarestCombo && (
        <div
          style={{
            background: '#111113',
            border: '1px solid rgba(184,169,255,0.3)',
            borderRadius: 12,
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
            marginTop: 8,
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
          <MonoLabel>your rarest combination</MonoLabel>
          <BodyText>{rarestCombo}</BodyText>
        </div>
      )}

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Deal-Breakers" />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// DEAL-BREAKERS SCREEN
// ═══════════════════════════════════════════════

export function DealBreakersScreen({ dealbreakers, onBack, onNext }) {
  const cats = [
    ['About the work', dealbreakers.work],
    ['What comes with the job', dealbreakers.job],
    ['About leadership', dealbreakers.leadership],
    ['About the environment', dealbreakers.environment],
  ];

  return (
    <ReportWrap>
      <MonoLabel>deal-breakers</MonoLabel>
      <DisplayHeading>What doesn't work for you</DisplayHeading>
      <BodyText style={{ marginBottom: 32 }}>
        Use this when evaluating opportunities.
      </BodyText>

      {cats.map(
        ([label, items]) =>
          items.length > 0 && (
            <div
              key={label}
              style={{
                background: '#111113',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#F0EDE8',
                  marginBottom: 16,
                }}
              >
                {label}
              </div>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      color: '#FF8F8F',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '0.8125rem',
                    }}
                  >
                    —
                  </span>
                  <BodyText>{item}</BodyText>
                </div>
              ))}
            </div>
          )
      )}

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Role Territories" />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// TERRITORIES SCREEN
// ═══════════════════════════════════════════════

export function TerritoriesScreen({ territories, onBack, onNext }) {
  const [expanded, setExpanded] = useState({});

  return (
    <ReportWrap>
      <MonoLabel>role territories</MonoLabel>
      <DisplayHeading>Paths to explore</DisplayHeading>
      <BodyText style={{ marginBottom: 32 }}>
        Directions, not prescriptions. Tap to expand.
      </BodyText>

      {territories.map((t, i) => (
        <div
          key={i}
          style={{
            background: '#111113',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            onClick={() =>
              setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))
            }
            style={{
              padding: '20px 24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#F0EDE8',
              }}
            >
              {t.name}
            </span>
            <ChevronRight
              size={18}
              style={{
                color: '#5C5955',
                transform: expanded[i] ? 'rotate(90deg)' : 'none',
                transition: 'transform 200ms',
              }}
            />
          </div>

          {expanded[i] && (
            <div
              style={{
                padding: '0 24px 24px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: 20,
              }}
            >
              {[
                ['Why this fits', t.whyFits, '#B8A9FF'],
                ['What transfers', t.transfers, '#FFB88C'],
                ['Possible gaps', t.gaps, '#FF8F8F'],
                ['Salary range', t.salary, '#5C5955'],
                ['Search terms', t.searchTerms, '#5C5955'],
                ['Respects your deal-breakers', t.dealbreakers, '#8CCFB8'],
              ].map(
                ([label, val, color]) =>
                  val && (
                    <div key={label} style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: '0.6875rem',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color,
                          marginBottom: 4,
                        }}
                      >
                        {label}
                      </div>
                      <BodyText>{val}</BodyText>
                    </div>
                  )
              )}
            </div>
          )}
        </div>
      ))}

      <NavRow onBack={onBack} onNext={onNext} nextLabel="Career Narrative" />
    </ReportWrap>
  );
}

// ═══════════════════════════════════════════════
// CAREER NARRATIVE SCREEN
// ═══════════════════════════════════════════════

export function CareerNarrativeScreen({
  careerNarrative,
  shortIntro,
  onBack,
  onDownloadPDF,
  pdfDownloading,
}) {
  const CopyBlock = ({ title, text }) => (
    <div
      style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#F0EDE8',
          }}
        >
          {title}
        </span>
        <button
          onClick={() => navigator.clipboard?.writeText(text)}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.6875rem',
            color: '#5C5955',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          copy
        </button>
      </div>
      <BodyLg style={{ whiteSpace: 'pre-wrap' }}>{text}</BodyLg>
    </div>
  );

  return (
    <ReportWrap>
      <MonoLabel>career narrative</MonoLabel>
      <DisplayHeading>Your story, ready to use</DisplayHeading>
      <BodyText style={{ marginBottom: 32 }}>
        Copy, paste, make it yours.
      </BodyText>

      {careerNarrative && (
        <CopyBlock title="LinkedIn / About" text={careerNarrative} />
      )}
      {shortIntro && (
        <CopyBlock title="30-Second Introduction" text={shortIntro} />
      )}

      {/* PDF Download */}
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(184,169,255,0.3)',
          borderRadius: 12,
          padding: 32,
          textAlign: 'center',
          marginTop: 32,
          position: 'relative',
          overflow: 'hidden',
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
        <FileText size={32} style={{ color: '#B8A9FF', marginBottom: 16 }} />
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#F0EDE8',
            marginBottom: 8,
          }}
        >
          Download Your Report
        </div>
        <button
          onClick={onDownloadPDF}
          disabled={pdfDownloading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 36px',
            background: '#B8A9FF',
            color: '#0A0A0B',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9375rem',
            fontWeight: 500,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            marginTop: 12,
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

      {/* Feedback */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          textAlign: 'center',
          marginTop: 16,
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
          Help improve Pathlight
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

      <NavRow onBack={onBack} />
    </ReportWrap>
  );
}
