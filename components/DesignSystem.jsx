import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// ═══════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════

export const clean = (text) => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();
};

// ═══════════════════════════════════════════════
// DESIGN ATOMS
// ═══════════════════════════════════════════════

export function Orb({ size = 500, opacity = 0.15 }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, rgba(184,169,255,${opacity}) 0%, rgba(184,169,255,0.04) 40%, transparent 70%)`,
        filter: 'blur(80px)',
        pointerEvents: 'none',
        animation: 'orbPulse 4s cubic-bezier(0.4,0,0.2,1) infinite alternate',
      }}
    />
  );
}

export function GridBg({ opacity = 0.025, color = '#F0EDE8' }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
  );
}

export function Spinner() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: '#B8A9FF',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );
}

// ═══════════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════════

export function MonoLabel({ children, color }) {
  return (
    <div
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: '0.6875rem',
        fontWeight: 400,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: color || '#B8A9FF',
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

export function DisplayHeading({ children }) {
  return (
    <h2
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        color: '#F0EDE8',
        marginBottom: 24,
      }}
    >
      {children}
    </h2>
  );
}

export function BodyLg({ children, style = {} }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '1.0625rem',
        fontWeight: 300,
        lineHeight: 1.7,
        color: '#A8A4A0',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function BodyText({ children, style = {} }) {
  return (
    <p
      style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.9375rem',
        fontWeight: 300,
        lineHeight: 1.65,
        color: '#A8A4A0',
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ═══════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════

export function DarkScreen({ children, center = true, style = {} }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        display: 'flex',
        flexDirection: 'column',
        alignItems: center ? 'center' : 'stretch',
        justifyContent: center ? 'center' : 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ReportWrap({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0B',
        color: '#F0EDE8',
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '48px 24px',
          animation: 'slideUp 0.7s ease forwards',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════

export function NavRow({ onBack, onNext, nextLabel }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 48,
        paddingTop: 32,
      }}
    >
      {onBack ? (
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
      ) : (
        <div />
      )}
      {onNext ? (
        <button
          onClick={onNext}
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
          {nextLabel} <ArrowRight size={16} />
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
