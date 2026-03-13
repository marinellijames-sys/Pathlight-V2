import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowRight, ArrowLeft, Check, Lock, FileText, Download, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// PATHLIGHT v5
// Landing → Intro → Consent → Chat (phase-tracked + interactions) → Synthesis
// Design: "Co-Star meets Notion" — Dark dominant, algorithm mystique
// Chat = light mode, Results = dark mode
// ─────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-20250514';

const clean = (text) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '').trim();
};

// ═══ CSS ═══
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap');

:root {
  --bg-void: #0A0A0B;
  --bg-surface: #111113;
  --bg-elevated: #1A1A1D;
  --bg-glass: rgba(255,255,255,0.04);
  --bg-glass-hover: rgba(255,255,255,0.07);
  --bg-light: #F5F5F3;
  --bg-light-card: #FFFFFF;

  --text-primary: #F0EDE8;
  --text-body: #A8A4A0;
  --text-muted: #5C5955;
  --text-ghost: #3A3835;
  --text-dark: #111113;
  --text-dark-body: #555250;

  --accent: #B8A9FF;
  --accent-bright: #D4C9FF;
  --accent-dim: #7B6FBF;
  --accent-glow: rgba(184,169,255,0.15);
  --accent-surface: rgba(184,169,255,0.06);

  --signal-warm: #FFB88C;
  --signal-cool: #8CCFB8;
  --signal-sharp: #FF8F8F;

  --border-subtle: rgba(255,255,255,0.06);
  --border-medium: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.18);
  --border-accent: rgba(184,169,255,0.30);
  --border-light: #E5E3DF;
  --border-light-medium: #D0CEC9;

  --font-display: 'Syne', sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'Space Mono', monospace;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  line-height: 1.6;
}

::selection {
  background: var(--accent);
  color: var(--bg-void);
}

/* ═══ ANIMATIONS ═══ */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes orbPulse {
  from { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
  to { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
@keyframes rSlideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes rFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rExpand {
  from { opacity: 0; width: 0; }
  to { opacity: 1; width: 32px; }
}

.fade-in { animation: fadeIn 0.6s var(--ease-out) forwards; }
.slide-up { animation: slideUp 0.7s var(--ease-out) forwards; }
.stagger-1 { animation-delay: 0.1s; opacity: 0; }
.stagger-2 { animation-delay: 0.2s; opacity: 0; }
.stagger-3 { animation-delay: 0.3s; opacity: 0; }
.stagger-4 { animation-delay: 0.5s; opacity: 0; }
.stagger-5 { animation-delay: 0.7s; opacity: 0; }

/* ═══ LANDING (DARK) ═══ */
.landing {
  min-height: 100vh;
  background: var(--bg-void);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.landing .orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 500px;
  height: 500px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(184,169,255,0.15) 0%, rgba(184,169,255,0.04) 40%, transparent 70%);
  filter: blur(80px);
  pointer-events: none;
  animation: orbPulse 4s var(--ease-smooth) infinite alternate;
}

.landing .grid-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image:
    linear-gradient(var(--text-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--text-primary) 1px, transparent 1px);
  background-size: 60px 60px;
}

.landing-hero {
  font-family: var(--font-display);
  font-size: clamp(3rem, 9vw, 6rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  position: relative;
  z-index: 1;
}

.landing-sub {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-weight: 300;
  color: var(--text-body);
  margin-top: 24px;
  position: relative;
  z-index: 1;
}

.landing-meta {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 12px;
  position: relative;
  z-index: 1;
}

/* ═══ BUTTONS ═══ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--text-primary);
  color: var(--bg-void);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 350ms var(--ease-out);
}
.btn-primary:hover {
  background: var(--accent-bright);
  color: var(--bg-void);
  transform: translateY(-1px);
  box-shadow: 0 0 60px rgba(184,169,255,0.12);
}
.btn-primary:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
}

.btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 36px;
  background: var(--accent);
  color: var(--bg-void);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 350ms var(--ease-out);
}
.btn-accent:hover {
  background: var(--accent-bright);
  transform: translateY(-1px);
  box-shadow: 0 0 80px rgba(184,169,255,0.2);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 400;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 350ms var(--ease-out);
}
.btn-outline:hover {
  border-color: var(--accent);
  color: var(--accent-bright);
  background: var(--accent-surface);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: color 150ms;
}
.btn-ghost:hover { color: var(--text-primary); }

/* Light mode button */
.btn-dark {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--text-dark);
  color: var(--bg-light);
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 350ms var(--ease-out);
}
.btn-dark:hover { background: #2a2a2e; transform: translateY(-1px); }
.btn-dark:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

/* ═══ INTRO SCREENS (DARK) ═══ */
.intro-screen {
  min-height: 100vh;
  background: var(--bg-void);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.intro-content {
  max-width: 560px;
  width: 100%;
}

.mono-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 16px;
}

.display-heading {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 32px;
}

.body-lg {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-weight: 300;
  line-height: 1.7;
  color: var(--text-body);
}

.body-text {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 300;
  line-height: 1.65;
  color: var(--text-body);
}

.card-glass {
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.divider { border: none; border-top: 1px solid var(--border-subtle); margin: 32px 0; }

/* ═══ CONSENT (DARK) ═══ */
.consent-check {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  transition: all 150ms var(--ease-out);
  margin-bottom: 8px;
}
.consent-check:hover { border-color: var(--border-medium); }

.checkbox {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
  margin-top: 2px;
}
.checkbox.checked {
  background: var(--accent);
  border-color: var(--accent);
}

/* ═══ CHAT (LIGHT MODE) ═══ */
.chat-screen {
  min-height: 100vh;
  background: var(--bg-light);
  display: flex;
  flex-direction: column;
  color: var(--text-dark);
}

.chat-header {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.chat-header-brand {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-dark);
}

.chat-header-status {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-dark-body);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 16px;
}

.chat-messages-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* AI message bubble */
.msg-ai {
  align-self: flex-start;
  max-width: 85%;
  padding: 14px 18px;
  background: var(--bg-light-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--text-dark);
  line-height: 1.65;
}

/* User message bubble */
.msg-user {
  align-self: flex-end;
  max-width: 85%;
  padding: 14px 18px;
  background: var(--text-dark);
  color: var(--bg-light);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 400;
  line-height: 1.65;
}

/* Typing indicator */
.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 18px;
  background: var(--bg-light-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  align-self: flex-start;
}
.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-dark-body);
  animation: dotPulse 1.4s ease-in-out infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

/* Chat input bar */
.chat-input-bar {
  border-top: 1px solid var(--border-light);
  background: var(--bg-light-card);
  padding: 16px;
}

.chat-input-inner {
  max-width: 640px;
  margin: 0 auto;
}

.chat-input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--bg-light);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--text-dark);
  outline: none;
  transition: all 150ms var(--ease-out);
  resize: none;
}
.chat-input::placeholder { color: var(--border-light-medium); }
.chat-input:focus { border-color: var(--text-dark); }

.send-btn {
  padding: 12px 16px;
  background: var(--text-dark);
  color: var(--bg-light);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.send-btn:hover { background: #2a2a2e; }
.send-btn:disabled { opacity: 0.2; cursor: not-allowed; }

/* ═══ INTERACTION WIDGETS (LIGHT MODE) ═══ */
.interaction-panel {
  max-width: 640px;
  margin: 8px auto 0;
  background: var(--bg-light-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xl);
  padding: 24px;
}

.interaction-question {
  font-family: var(--font-display);
  font-size: clamp(1.125rem, 2.5vw, 1.25rem);
  font-weight: 600;
  color: var(--text-dark);
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 20px;
}

/* Choice cards (single_select / multi_select) */
.choice-card {
  background: var(--bg-light-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 14px 18px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 150ms var(--ease-out);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 400;
  color: var(--text-dark-body);
  user-select: none;
}
.choice-card:hover {
  border-color: var(--border-light-medium);
  transform: translateX(4px);
}
.choice-card.selected {
  border-color: var(--text-dark);
  background: var(--text-dark);
  color: var(--bg-light);
  font-weight: 500;
}

/* Slider */
.slider-labels {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-dark-body);
  margin-bottom: 12px;
  gap: 16px;
}
.slider-labels span { max-width: 45%; }

.slider-track {
  width: 100%;
  height: 3px;
  background: var(--border-light);
  border-radius: var(--radius-full);
  position: relative;
  margin: 24px 0;
  cursor: pointer;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--text-dark);
  border-radius: var(--radius-full);
  transition: width 50ms;
}

.slider-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
  background: var(--text-dark);
  border: 3px solid var(--bg-light);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  cursor: grab;
  transition: left 50ms;
}
.slider-thumb:active { cursor: grabbing; }

.escape-link {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-dark-body);
  cursor: pointer;
  background: none;
  border: none;
  padding: 8px 0;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 150ms;
}
.escape-link:hover { color: var(--text-dark); }

.custom-text-expand {
  margin-top: 12px;
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-light);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--text-dark);
  outline: none;
  resize: none;
  min-height: 80px;
}
.custom-text-expand:focus { border-color: var(--text-dark); }

/* Submit interaction */
.interaction-submit {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* ═══ PROGRESS BAR (chat) ═══ */
.progress-bar-container {
  display: flex;
  gap: 3px;
  padding: 0 24px 12px;
  background: var(--bg-light);
}
.progress-segment {
  height: 2px;
  flex: 1;
  border-radius: var(--radius-full);
  background: var(--border-light);
  transition: background 350ms;
}
.progress-segment.done { background: var(--accent-dim); }
.progress-segment.active { background: var(--text-dark); }

/* ═══ SYNTHESIS / REPORT (DARK MODE) ═══ */
.report-screen {
  min-height: 100vh;
  background: var(--bg-void);
  color: var(--text-primary);
}

.report-content {
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px;
}

.report-loading {
  min-height: 100vh;
  background: var(--bg-void);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.report-loading .orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(184,169,255,0.2) 0%, rgba(184,169,255,0.05) 40%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  animation: orbPulse 4s var(--ease-smooth) infinite alternate;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-medium);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Strength reveal */
.reveal-container {
  min-height: 100vh;
  background: var(--bg-void);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  position: relative;
  overflow: hidden;
}

.reveal-container .orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(184,169,255,0.2) 0%, rgba(184,169,255,0.05) 40%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  animation: orbPulse 4s var(--ease-smooth) infinite alternate;
}

.reveal-container .grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  background-image:
    linear-gradient(var(--text-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--text-primary) 1px, transparent 1px);
  background-size: 60px 60px;
}

.reveal-index {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  z-index: 1;
  opacity: 0;
  animation: rFade 0.6s var(--ease-out) 0.2s forwards;
}

.reveal-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 24px 0;
  z-index: 1;
  opacity: 0;
  animation: rFade 0.6s var(--ease-out) 0.5s forwards;
}

.reveal-name {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: var(--text-primary);
  z-index: 1;
  opacity: 0;
  animation: rSlideUp 1s var(--ease-out) 0.8s forwards;
}

.reveal-dash {
  width: 32px;
  height: 2px;
  background: var(--accent);
  margin: 24px auto;
  z-index: 1;
  opacity: 0;
  animation: rExpand 0.5s var(--ease-out) 1.4s forwards;
}

.reveal-desc {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  font-weight: 300;
  line-height: 1.7;
  color: var(--text-body);
  max-width: 420px;
  z-index: 1;
  opacity: 0;
  animation: rFade 0.8s var(--ease-out) 1.7s forwards;
}

.reveal-actions {
  margin-top: 48px;
  z-index: 1;
  opacity: 0;
  animation: rFade 0.6s var(--ease-out) 2.2s forwards;
  display: flex;
  gap: 12px;
}

/* Strength detail card (report) */
.strength-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
}

.strength-card-header {
  padding: 24px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.strength-num {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--accent);
  padding-top: 4px;
}

.strength-name {
  font-family: var(--font-display);
  font-size: clamp(1.375rem, 3vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.strength-desc {
  font-family: var(--font-body);
  font-size: 0.9375rem;
  font-weight: 300;
  line-height: 1.65;
  color: var(--text-body);
}

.strength-sections {
  padding: 24px;
  display: grid;
  gap: 20px;
}

.section-label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.section-label.valuable { color: var(--signal-warm); }
.section-label.deploy { color: var(--accent); }
.section-label.watch { color: var(--signal-sharp); }

.section-text {
  font-family: var(--font-body);
  font-size: 0.8125rem;
  font-weight: 300;
  line-height: 1.6;
  color: var(--text-body);
}

/* Locked strength */
.strength-locked {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
}
.strength-locked-inner {
  filter: blur(6px);
  opacity: 0.25;
  user-select: none;
}
.strength-locked-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.strength-locked-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* Paywall */
.paywall {
  background: var(--bg-void);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 64px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin: 32px 0;
}
.paywall .orb-top {
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 500px;
  height: 300px;
  background: radial-gradient(ellipse, rgba(184,169,255,0.1) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}
.paywall .grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.02;
  background-image:
    linear-gradient(var(--text-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--text-primary) 1px, transparent 1px);
  background-size: 60px 60px;
}
.paywall-content { position: relative; z-index: 1; }

.paywall-features {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 300px;
  margin: 0 auto 32px;
  text-align: left;
}
.paywall-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-body);
  font-weight: 300;
}
.paywall-feature .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* Combo card */
.combo-card {
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 12px;
  backdrop-filter: blur(20px);
}
.combo-card:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-medium);
}

/* Accent card */
.card-accent-border {
  background: var(--bg-surface);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.card-accent-border::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}

/* Deal-breaker card */
.dealbreaker-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 12px;
}

.dealbreaker-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}
.dealbreaker-dash {
  color: var(--signal-sharp);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  margin-top: 1px;
}

/* Territory card */
.territory-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 12px;
}
.territory-header {
  padding: 20px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 150ms;
}
.territory-header:hover { background: var(--bg-elevated); }
.territory-body {
  padding: 0 24px 24px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 20px;
}

/* Tag */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: var(--accent-surface);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--accent);
}

/* Narrative card */
.narrative-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 16px;
}

/* Chat footer */
.chat-footer {
  padding: 8px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-dark-body);
  border-top: 1px solid var(--border-light);
  background: var(--bg-light);
}
.chat-footer a, .chat-footer button {
  color: var(--text-dark-body);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  transition: color 150ms;
}
.chat-footer a:hover, .chat-footer button:hover { color: var(--text-dark); }

/* Nav row for report screens */
.report-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border-subtle);
}

/* Copy button */
.copy-btn {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color 150ms;
}
.copy-btn:hover { color: var(--accent); }
`;

// ═══════════════════════════════════════════════════════════
// PARSE AI RESPONSE — extract conversation text + interaction
// ═══════════════════════════════════════════════════════════

function parseAIResponse(text) {
  const interactionMatch = text.match(/:::interaction\n([\s\S]*?)\n:::/);
  const conversationText = text.replace(/:::interaction\n[\s\S]*?\n:::/, '').trim();
  let interaction = null;
  if (interactionMatch) {
    try {
      interaction = JSON.parse(interactionMatch[1]);
    } catch (e) {
      console.error('Interaction parse failed:', e);
      interaction = null;
    }
  }
  return { conversationText, interaction };
}

// ═══════════════════════════════════════════════════════════
// FORMAT INTERACTION RESPONSE for AI context
// ═══════════════════════════════════════════════════════════

function formatInteractionResponse(interaction, result) {
  switch (interaction.type) {
    case 'slider':
      if (result.selected === 'custom') return result.custom_text;
      return `[Slider: ${result.value.toFixed(2)} on spectrum from '${interaction.config.left}' to '${interaction.config.right}']`;
    case 'single_select':
      if (result.selected === 'custom') return result.custom_text;
      return `[Selected: '${result.selected}']`;
    case 'multi_select':
      if (result.selected.includes('custom')) {
        const choices = result.selected.filter(s => s !== 'custom');
        const choiceText = choices.length > 0 ? `[Selected: ${choices.map(s => `'${s}'`).join(', ')}] ` : '';
        return `${choiceText}${result.custom_text}`;
      }
      return `[Selected: ${result.selected.map(s => `'${s}'`).join(', ')}]`;
    default:
      return result.text;
  }
}

// ═══════════════════════════════════════════════════════════
// INTERACTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function SliderWidget({ config, onSubmit }) {
  const [value, setValue] = useState(config.default || 0.5);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const updateFromEvent = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setValue(x);
  };

  const handleMouseDown = (e) => {
    dragging.current = true;
    updateFromEvent(e);
    const onMove = (ev) => { if (dragging.current) updateFromEvent(ev); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchMove = (e) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    setValue(x);
  };

  if (showCustom) {
    return (
      <div>
        <textarea
          className="custom-text-expand"
          placeholder="Tell me in your own words..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          autoFocus
        />
        <div className="interaction-submit">
          <button className="btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="slider-labels">
        <span>{config.left}</span>
        <span style={{ textAlign: 'right' }}>{config.right}</span>
      </div>
      <div
        className="slider-track"
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        onTouchMove={handleTouchMove}
      >
        <div className="slider-fill" style={{ width: `${value * 100}%` }} />
        <div className="slider-thumb" style={{ left: `${value * 100}%` }} />
      </div>
      {config.allow_custom && (
        <button className="escape-link" onClick={() => setShowCustom(true)}>
          Neither — let me explain
        </button>
      )}
      <div className="interaction-submit">
        <button className="btn-dark" onClick={() => onSubmit({ value })}>
          <Send size={16} /> Submit
        </button>
      </div>
    </div>
  );
}

function SingleSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  if (showCustom) {
    return (
      <div>
        <textarea
          className="custom-text-expand"
          placeholder="Tell me in your own words..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          autoFocus
        />
        <div className="interaction-submit">
          <button className="btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {config.options.map((opt, i) => (
        <div key={i} className={`choice-card ${selected === opt ? 'selected' : ''}`} onClick={() => setSelected(opt)}>
          {opt}
        </div>
      ))}
      {config.allow_custom && (
        <div className={`choice-card ${showCustom ? 'selected' : ''}`} onClick={() => setShowCustom(true)} style={{ fontStyle: 'italic', color: 'var(--text-dark-body)' }}>
          None of these — let me explain
        </div>
      )}
      <div className="interaction-submit">
        <button className="btn-dark" disabled={!selected} onClick={() => onSubmit({ selected })}>
          <Send size={16} /> Submit
        </button>
      </div>
    </div>
  );
}

function MultiSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const max = config.max_selections || 4;

  const toggle = (opt) => {
    if (selected.includes(opt)) setSelected(selected.filter(s => s !== opt));
    else if (selected.length < max) setSelected([...selected, opt]);
  };

  return (
    <div>
      {config.options.map((opt, i) => (
        <div key={i} className={`choice-card ${selected.includes(opt) ? 'selected' : ''}`} onClick={() => toggle(opt)}>
          {opt}
        </div>
      ))}
      {config.allow_custom && (
        <div>
          <button className="escape-link" onClick={() => setShowCustom(!showCustom)} style={{ marginTop: 4 }}>
            {showCustom ? 'Hide text input' : 'Add your own'}
          </button>
          {showCustom && (
            <textarea
              className="custom-text-expand"
              placeholder="Tell me in your own words..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              autoFocus
            />
          )}
        </div>
      )}
      <div className="interaction-submit">
        <button
          className="btn-dark"
          disabled={selected.length === 0 && !customText.trim()}
          onClick={() => {
            const sel = showCustom && customText.trim() ? [...selected, 'custom'] : selected;
            onSubmit({ selected: sel, custom_text: customText.trim() });
          }}
        >
          <Send size={16} /> Submit
        </button>
      </div>
    </div>
  );
}

function InteractionWidget({ interaction, onSubmit }) {
  return (
    <div className="interaction-panel slide-up">
      <div className="interaction-question">{interaction.question}</div>
      {interaction.type === 'slider' && <SliderWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'single_select' && <SingleSelectWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'multi_select' && <MultiSelectWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'free_text' && (
        <FreeTextWidget config={interaction.config} onSubmit={onSubmit} />
      )}
    </div>
  );
}

function FreeTextWidget({ config, onSubmit }) {
  const [text, setText] = useState('');
  return (
    <div>
      <textarea
        className="custom-text-expand"
        placeholder={config?.placeholder || 'Type your response...'}
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />
      {config?.min_hint && <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-dark-body)', marginTop: 4 }}>{config.min_hint}</p>}
      <div className="interaction-submit">
        <button className="btn-dark" disabled={!text.trim()} onClick={() => onSubmit({ text: text.trim() })}>
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════

export default function Pathlight() {
  const [screen, setScreen] = useState('loading');
  const [introPage, setIntroPage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [parsedMessages, setParsedMessages] = useState([]); // { role, text, interaction }
  const [activeInteraction, setActiveInteraction] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatComplete, setChatComplete] = useState(false);
  const [synthesisContent, setSynthesisContent] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [synthesisScreen, setSynthesisScreen] = useState(0);
  const [synthesisGenerating, setSynthesisGenerating] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [consentChecks, setConsentChecks] = useState({ terms: false, age: false, data: false });
  const [revealStrength, setRevealStrength] = useState(null);
  const [expandedTerritories, setExpandedTerritories] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const lastInteractionIdx = useRef(-1); // track last interaction index for guardrail

  // ── State persistence via React state (no localStorage per artifact rules) ──
  // In production, persist via API. Here we keep it in memory.

  useEffect(() => {
    // Check URL params for payment
    const p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success' || p.get('unlock') === 'true') {
      setPaymentCompleted(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    setScreen('landing');
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [parsedMessages, isLoading]);

  useEffect(() => {
    if (!isLoading && screen === 'chat' && !activeInteraction) inputRef.current?.focus();
  }, [isLoading, screen, activeInteraction]);

  // ── Guardrail: count user messages ──
  const userMsgCount = messages.filter(m => m.role === 'user').length;

  // Compute progress segments (target 15 messages)
  const totalSegments = 15;
  const filledSegments = Math.min(userMsgCount, totalSegments);

  const resetProgress = () => {
    if (confirm('Start fresh? All progress will be cleared.')) {
      setMessages([]);
      setParsedMessages([]);
      setActiveInteraction(null);
      setChatComplete(false);
      setSynthesisContent(null);
      setParsedData(null);
      setPaymentCompleted(false);
      setSynthesisScreen(0);
      setRevealStrength(null);
      setExpandedTerritories({});
      lastInteractionIdx.current = -1;
      setScreen('landing');
    }
  };

  // ─────────────────────────────────────────────
  // CONVERSATION ENGINE
  // ─────────────────────────────────────────────

  const buildSystemPrompt = () => {
    const n = userMsgCount;

    return `You are having a private career conversation with someone. You're perceptive, warm, and direct — like a sharp friend who happens to be unnervingly good at reading people.

YOUR JOB: Systematically explore 5 territories through natural conversation. You need rich, specific, personal information to generate a career clarity report that feels eerily accurate.

═══ THE 5 PHASES (in order) ═══

PHASE 1 — ENERGY (messages 1-3)
What makes time disappear? What pulls them in? Get a specific story or example.
After their first substantive response, you MAY serve an interaction to calibrate
the underlying pattern — but ONLY if it's contextually relevant to what they said.

PHASE 2 — DRAINERS (messages 3-5)
What kills their energy? Get a specific situation. What exactly about it was bad?
Push for the precise cause, not the general category.

PHASE 3 — STRENGTHS (messages 5-8)
What do people come to them for? What feels effortless to them but hard for others?
Get specific examples. Challenge them when they downplay something.

PHASE 4 — WINS (messages 8-10)
What are they proud of? What did they overcome? What made it meaningful?

PHASE 5 — DIRECTION (messages 10-13)
Their ideal work life. Be specific: what are they doing, with whom, how much
autonomy, what does a Tuesday look like?

═══ RESPONSE FORMAT ═══

Every response you give has two parts:

PART 1 (required): Your conversational message.
- ONE question or reflection per response
- Maximum 2-3 sentences
- Reference their actual words
- No coaching, no advice, no cheerleading

PART 2 (optional): An interaction block.
ONLY include this when ALL of these are true:
1. The user has just given a substantive free-text response
2. You have a specific hypothesis you want to test or calibrate
3. The interaction options are DIRECTLY derived from what they just said
4. A structured interaction will give you more precise signal than another open question

Format for the interaction block:
:::interaction
{ valid JSON object }
:::

═══ INTERACTION TYPES ═══

slider:
{"type":"slider","question":"...","config":{"left":"...","right":"...","default":0.5,"allow_custom":true}}

single_select:
{"type":"single_select","question":"...","config":{"options":["...","...","..."],"allow_custom":true}}

multi_select:
{"type":"multi_select","question":"...","config":{"options":["...","..."],"max_selections":2,"allow_custom":true}}

free_text:
{"type":"free_text","question":"...","config":{"placeholder":"...","min_hint":"A few sentences is perfect"}}

═══ INTERACTION RULES ═══

1. NEVER serve an interaction as your opening question in a new phase.
   Always start each phase with an open free-text question.

2. NEVER serve generic/pre-scripted interactions. Every option must reference
   or connect to something the user actually said.

3. Every interaction MUST have "allow_custom": true. The user must always be
   able to reject your framing and explain in their own words.

4. Sliders should capture a genuine tension or spectrum that emerged from their
   response. Don't create false dichotomies.

5. Maximum 4 options on any single_select or multi_select.

6. After the user responds to an interaction, acknowledge what they chose briefly
   and transition naturally. Don't over-interpret a single slider position.

7. You should serve roughly 4-6 interactions across the full conversation.
   The rest should be pure free-text exchanges.

8. NEVER serve two interactions in a row. Always have at least one free-text
   exchange between interactions.

═══ HANDLING INTERACTION RESPONSES ═══

When a user responds to an interaction, their message will be formatted as:
For sliders: "[Slider: 0.72 on spectrum from 'Process' to 'Outcome']"
For custom: The user's free text explanation (highest-value signal)
For selections: "[Selected: 'option text']"

Treat these as verbal responses. If they chose custom — pay close attention.

═══ WHAT YOU'RE COLLECTING DATA FOR ═══

After this conversation, a separate AI generates a career clarity report containing:
1. FIVE BESPOKE STRENGTH ARCHETYPES — uniquely named
2. STRENGTH COMBINATIONS — how strengths interact
3. DEAL-BREAKERS — conditions that will make them miserable
4. ROLE TERRITORIES — specific career directions
5. CAREER NARRATIVE — how they should describe themselves

You need: specific stories, contradictions/tensions, their own language,
clear signal on drains vs energises, concrete detail about ideal future.

═══ CONVERSATION STATE ═══

This is user message ${n + 1}.
Approximate target: 13-15 user messages total.

${n === 0 ? `THIS IS THE OPENING. Start with energy. Ask ONE open question:
"What kind of work makes time disappear for you? Not what you think you should enjoy — what actually pulls you in so deep you forget to check the clock?"
Do NOT include an interaction block on the first message.` : ''}

${n >= 11 && n < 13 ? `WRAPPING UP. Check: have all 5 phases been covered with depth? If any territory is thin, weave a question about it into your response. No interactions in the final 2 messages — just conversation.` : ''}

${n >= 13 ? `FINAL RESPONSE. Close warmly:
- One sentence reflecting a core pattern across everything they said
- "I've got a really clear picture of you now."
- No advice. End warmly.
- Add on its own line: [CONVERSATION_COMPLETE]` : ''}

Remember: SHORT responses. Questions, not advice. You are a skilled interviewer, not a life coach.`;
  };

  // ── Guardrails ──
  const applyGuardrails = (parsed, msgIndex) => {
    // Strip interaction from first message
    if (msgIndex === 0 && parsed.interaction) {
      return { ...parsed, interaction: null };
    }
    // Strip consecutive interactions
    if (parsed.interaction) {
      const prevAiIdx = parsedMessages.length - 1; // the last AI message index
      if (lastInteractionIdx.current === prevAiIdx - 1) {
        // Two in a row — strip this one
        return { ...parsed, interaction: null };
      }
    }
    return parsed;
  };

  const callAPI = async (msgs, systemPrompt, maxTokens = 250) => {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system: systemPrompt, messages: msgs })
    });
    const data = await r.json();
    return data.content[0].text;
  };

  const startChat = async () => {
    setScreen('chat');
    setIsLoading(true);
    try {
      const text = await callAPI(
        [{ role: 'user', content: '[Begin]' }],
        buildSystemPrompt(),
        150
      );
      const parsed = parseAIResponse(text);
      const guarded = applyGuardrails(parsed, 0);
      const rawMsgs = [{ role: 'assistant', content: text }];
      setMessages(rawMsgs);
      setParsedMessages([{ role: 'assistant', text: guarded.conversationText, interaction: guarded.interaction }]);
      if (guarded.interaction) {
        setActiveInteraction(guarded.interaction);
        lastInteractionIdx.current = 0;
      }
    } catch (e) { console.error('Start error:', e); }
    finally { setIsLoading(false); }
  };

  const sendMessage = async (content) => {
    if (!content?.trim() || isLoading || chatComplete) return;
    const userMsg = content.trim();
    const newMsgs = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMsgs);
    setParsedMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput('');
    setActiveInteraction(null);
    setIsLoading(true);

    // Hard cap at 18
    const currentUserCount = newMsgs.filter(m => m.role === 'user').length;

    try {
      let text = await callAPI(newMsgs, buildSystemPrompt(), 300);

      // Force complete at 18
      if (currentUserCount >= 18 && !text.includes('[CONVERSATION_COMPLETE]')) {
        text += '\n\n[CONVERSATION_COMPLETE]';
      }

      const complete = text.includes('[CONVERSATION_COMPLETE]');
      const cleanedText = text.replace('[CONVERSATION_COMPLETE]', '').trim();

      const parsed = parseAIResponse(cleanedText);
      const aiMsgIdx = parsedMessages.length + 1; // +1 for the user message we just added
      const guarded = applyGuardrails(parsed, aiMsgIdx);

      const finalMsgs = [...newMsgs, { role: 'assistant', content: cleanedText }];
      setMessages(finalMsgs);
      setParsedMessages(prev => [...prev, { role: 'assistant', text: guarded.conversationText, interaction: guarded.interaction }]);

      if (guarded.interaction) {
        setActiveInteraction(guarded.interaction);
        lastInteractionIdx.current = aiMsgIdx;
      }

      if (complete) setChatComplete(true);
    } catch (e) { console.error('Chat error:', e); }
    finally { setIsLoading(false); }
  };

  const handleInteractionSubmit = (result) => {
    const formatted = formatInteractionResponse(activeInteraction, result);
    sendMessage(formatted);
  };

  const handleTextSubmit = () => {
    if (userInput.trim()) sendMessage(userInput);
  };

  // ─────────────────────────────────────────────
  // SYNTHESIS
  // ─────────────────────────────────────────────

  const generateSynthesis = async () => {
    if (synthesisContent) {
      setParsedData(parseSynthesis(synthesisContent));
      return;
    }
    setSynthesisGenerating(true);

    try {
      const transcript = messages.map(m =>
        `${m.role === 'user' ? 'THEM' : 'PATHLIGHT'}: ${m.content}`
      ).join('\n\n');

      // ═══ CALL 1: Profile + Strengths + Combinations ═══
      const p1 = `You are analyzing a career reflection conversation to create a personalized report.

CONVERSATION:
${transcript}

Read the entire conversation. Find PATTERNS and CONNECTIONS across all five topics (energy, drainers, strengths, wins, ideal role). The most valuable insights come from linking what they said in one context to what they revealed in another.

FORMAT STRICTLY AS MARKDOWN. Use the exact headers and sub-headers shown below.

## Your Profile

200 words max. This is an ANALYSIS, not a summary.
- Open with the core pattern you see across everything
- Name their drive orientation (commercial/P&L, craft/mastery, builder/systems, people/impact)
- Identify one blindspot or tension they can't see themselves
- End with specific encouragement referencing their situation
- Do NOT use markdown bold (**) in the profile text — write in plain prose

## Your Signature Strengths

EXACTLY 5 strengths. Each is a specific combination of abilities — not a generic skill.

NAMING RULES: Names describe what they DO.
Good: "The Invisible Architect", "Chaos Navigator", "The Reluctant Leader"
Bad: "Strategic Thinker", "People Person", "Problem Solver"

For each strength, use this EXACT structure:

### [Strength Name]

[2-3 sentences describing this strength. Reference SPECIFIC things they said. Plain text, no markdown bold.]

WHAT MAKES THIS VALUABLE:
[1-2 sentences: why businesses pay for this capability. Specific business impact.]

HOW TO DEPLOY THIS:
This week: [One specific action for their situation]
In interviews: [First-person sentence they can say, using their actual achievements]
Best roles for this: [3-4 specific role types]

WATCH OUT:
[1-2 sentences: what happens when this strength is overused or misapplied. Be honest.]

---

After all 5 strengths:

WHY THESE MATTER TOGETHER:
[2-3 sentences. Not "diverse skills." Say: "Most people who can do X can't do Y. You can, because..." Explain the specific interaction.]

YOUR VALUE PROPOSITION:
"[One sentence, first person, for LinkedIn headline or elevator pitch]"

## Your Strength Combinations

The 3 most powerful pairings from the 5 strengths above:

### [Strength A] + [Strength B]
What this creates: [1-2 sentences — the specific capability]
Why it's rare: [1 sentence — why most people have one but not both]
Roles that need exactly this: [2-3 specific roles]

### [Strength C] + [Strength D]
[Same format]

### [Strength A/B] + [Strength C/D/E]
[Same format]

RAREST COMBINATION: [1-2 sentences identifying which of the 3 pairings above is most unusual and why. Do NOT repeat as a separate section — just this line at the end.]`;

      const part1 = await callAPI(
        [{ role: 'user', content: 'Create my profile, signature strengths, and strength combinations.' }],
        p1, 4000
      );

      // ═══ CALL 2: Deal-breakers + Territories + Career Narrative ═══
      const p2 = `You are completing a career clarity report. Part 1 (Profile + Strengths) is done.

CONVERSATION:
${transcript}

PART 1 (already generated):
${part1}

Generate the remaining sections using the EXACT markdown structure below. Do NOT use ** bold markers in body text — write in plain prose.

## Your Deal-Breakers

Use this list when evaluating opportunities. If a role has these elements, you will end up miserable again.

Based on what they specifically described as negative experiences, identify deal-breakers. 3 MAX per category. Each point: 10 words or less, direct, based on their actual words. ONLY include categories where they provided relevant examples.

DEALBREAKERS_WORK:
- [From their actual words]
- [From their actual words]
- [From their actual words]

DEALBREAKERS_JOB:
- [Only if they mentioned conditions like hours, travel, flexibility]

DEALBREAKERS_LEADERSHIP:
- [Only if they mentioned management issues]

DEALBREAKERS_ENVIRONMENT:
- [Only if they mentioned culture or team issues]

## Role Territories to Explore

5 specific territories. Each must connect to their identified strengths and respect their deal-breakers.

For each territory, use this EXACT structure:

### [Specific Territory Name]

WHY THIS FITS: [2-3 sentences connecting their SPECIFIC strengths to SPECIFIC aspects of this role. Not generic.]
WHAT TRANSFERS: [Their specific skills and experiences that map to this role]
POSSIBLE GAPS: [What they might need to develop, learn, or get certified in. Be honest. If no gaps, say "Minimal — your experience maps directly."]
SALARY RANGE: [Realistic AUD range for their experience level]
SEARCH TERMS: "[Title 1]", "[Title 2]", "[Title 3]"
RESPECTS YOUR DEAL-BREAKERS: [Name which specific deal-breakers this role avoids]

## Your Career Narrative

LINKEDIN VERSION:
[150 words max. First person. Opens with what they DO, not their title. No buzzwords. Authentic to how they speak. Forward-looking.]

INTRO VERSION:
[2-3 sentences they can use in verbal networking or email introductions.]`;

      const part2 = await callAPI(
        [{ role: 'user', content: 'Create my deal-breakers, role territories, and career narrative.' }],
        p2, 3500
      );

      const full = part1 + '\n\n' + part2;
      setSynthesisContent(full);
      setParsedData(parseSynthesis(full));
    } catch (e) { console.error('Synthesis error:', e); }
    finally { setSynthesisGenerating(false); }
  };

  // ─────────────────────────────────────────────
  // PARSER
  // ─────────────────────────────────────────────

  const parseSynthesis = (content) => {
    if (!content) return null;
    const s = {
      profile: '', superpowers: [], superpowersSummary: { whyTogether: '', valueProp: '' },
      strengthCombos: [], rarestCombo: '',
      dealbreakers: { work: [], job: [], leadership: [], environment: [] },
      territories: [], careerNarrative: '', shortIntro: ''
    };

    try {
      // Profile
      const pm = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths)/);
      if (pm) s.profile = clean(pm[1]);

      // Strengths
      const ss = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations)/);
      if (ss) {
        const fullText = ss[1];
        const labels = ['WHAT MAKES THIS VALUABLE:', 'HOW TO DEPLOY THIS:', 'WATCH OUT:', '---'];
        const blocks = fullText.split(/\n### /).filter(b => b.trim());
        blocks.forEach(block => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (!name || name.includes('WHY THESE') || name.includes('YOUR VALUE')) return;

          let descLines = [];
          let i = 1;
          while (i < lines.length && !labels.some(l => lines[i].trim().startsWith(l))) {
            if (lines[i].trim()) descLines.push(lines[i].trim());
            i++;
          }
          const description = clean(descLines.join(' '));

          const getSection = (label) => {
            const idx = block.indexOf(label);
            if (idx === -1) return '';
            const after = block.substring(idx + label.length);
            const nextLabel = labels.find(l => l !== label && after.indexOf(l) > 0);
            const end = nextLabel ? after.indexOf(nextLabel) : after.length;
            return clean(after.substring(0, end));
          };

          const valuable = getSection('WHAT MAKES THIS VALUABLE:');
          const deployRaw = getSection('HOW TO DEPLOY THIS:');
          const watchOut = getSection('WATCH OUT:');

          const getDeployField = (field) => {
            const m = deployRaw.match(new RegExp(field + ':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)', 's'));
            return m ? clean(m[1]) : '';
          };

          if (name && description) {
            s.superpowers.push({
              name, description, valuable,
              thisWeek: getDeployField('This week'),
              inInterviews: getDeployField('In interviews'),
              bestRoles: getDeployField('Best roles for this'),
              watchOut
            });
          }
        });

        const wtm = fullText.match(/WHY THESE MATTER TOGETHER:\n([\s\S]*?)(?=\nYOUR VALUE PROPOSITION:|$)/);
        if (wtm) s.superpowersSummary.whyTogether = clean(wtm[1]);
        const vpm = fullText.match(/YOUR VALUE PROPOSITION:\n"([^"]+)"/);
        if (vpm) s.superpowersSummary.valueProp = vpm[1];
      }

      // Strength Combinations
      const cs = content.match(/## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers)/);
      if (cs) {
        const comboText = cs[1];
        comboText.split(/\n### /).filter(b => b.trim()).forEach(block => {
          const lines = block.split('\n');
          const title = clean(lines[0]);
          if (!title) return;
          const body = clean(lines.slice(1).filter(l => l.trim() && !l.startsWith('RAREST')).join('\n'));
          if (title && body) s.strengthCombos.push({ title, body });
        });
        const rm = comboText.match(/RAREST COMBINATION:\s*([\s\S]*?)$/);
        if (rm) s.rarestCombo = clean(rm[1]);
      }

      // Deal-breakers
      const ds = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories)/);
      if (ds) {
        const dt = ds[1];
        const extractItems = (label) => {
          const m = dt.match(new RegExp(label + ':\\n([\\s\\S]*?)(?=\\nDEALBREAKERS_|\\n## |$)'));
          return m ? m[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => clean(l.replace(/^-\s*/, ''))) : [];
        };
        s.dealbreakers.work = extractItems('DEALBREAKERS_WORK');
        s.dealbreakers.job = extractItems('DEALBREAKERS_JOB');
        s.dealbreakers.leadership = extractItems('DEALBREAKERS_LEADERSHIP');
        s.dealbreakers.environment = extractItems('DEALBREAKERS_ENVIRONMENT');
      }

      // Territories
      const ts = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative)/);
      if (ts) {
        ts[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (!name) return;
          const body = lines.slice(1).join('\n');
          const getField = (label) => {
            const m = body.match(new RegExp(label + ':\\s*(.+?)(?=\\n[A-Z]|$)', 's'));
            return m ? clean(m[1]) : '';
          };
          s.territories.push({
            name,
            whyFits: getField('WHY THIS FITS'),
            transfers: getField('WHAT TRANSFERS'),
            gaps: getField('POSSIBLE GAPS'),
            salary: getField('SALARY RANGE'),
            searchTerms: getField('SEARCH TERMS'),
            dealbreakers: getField('RESPECTS YOUR DEAL-BREAKERS'),
          });
        });
      }

      // Career Narrative
      const ln = content.match(/LINKEDIN VERSION:\n([\s\S]*?)(?=\nINTRO VERSION:)/);
      if (ln) s.careerNarrative = clean(ln[1]);
      const iv = content.match(/INTRO VERSION:\n([\s\S]*?)$/);
      if (iv) s.shortIntro = clean(iv[1]);

    } catch (e) { console.error('Parse error:', e); return null; }
    return s;
  };

  // ── Helpers ──
  const handlePayment = async () => {
    try {
      const r = await fetch('/api/stripe-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      window.location.href = (await r.json()).url;
    } catch (e) { alert('Payment failed.'); }
  };

  const downloadPDF = async () => {
    if (!synthesisContent) return;
    setPdfDownloading(true);
    try {
      const r = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ synthesisContent }) });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'pathlight-career-report.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) { alert('PDF generation failed.'); }
    finally { setPdfDownloading(false); }
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  // Inject styles
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
    return () => styleEl.remove();
  }, []);

  // ── LOADING ──
  if (screen === 'loading') {
    return <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>;
  }

  // ── LANDING ──
  if (screen === 'landing') {
    return (
      <div className="landing">
        <div className="orb" />
        <div className="grid-bg" />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="landing-hero fade-in">Pathlight</div>
          <div className="landing-sub fade-in stagger-2">Find clarity in your career</div>
          <div style={{ marginTop: 48 }} className="fade-in stagger-3">
            <button className="btn-primary" onClick={() => { setScreen('intro'); setIntroPage(0); }}>
              Begin <ArrowRight size={16} />
            </button>
          </div>
          <div className="landing-meta fade-in stagger-4">20 minutes · private · ai-powered</div>
        </div>
      </div>
    );
  }

  // ── INTRO 1 ──
  if (screen === 'intro' && introPage === 0) {
    return (
      <div className="intro-screen">
        <div className="intro-content slide-up">
          <div className="mono-label">Before we start</div>
          <div className="display-heading">You're here because something isn't quite right.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p className="body-lg">Maybe you feel stuck in a role that doesn't fit anymore.</p>
            <p className="body-lg">Maybe you lack direction.</p>
            <p className="body-lg">Maybe you're ready for something bigger but don't know what.</p>
          </div>
          <p className="body-lg" style={{ color: 'var(--text-primary)', marginTop: 32 }}>That's okay. You're in the right place.</p>
          <div className="card-glass" style={{ marginTop: 32 }}>
            <p className="body-text">This works like a conversation with a sharp friend who sees your blind spots. The more honest and specific you are, the more useful your report will be. Give yourself 20 minutes somewhere quiet.</p>
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => setIntroPage(1)}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO 2 ──
  if (screen === 'intro' && introPage === 1) {
    const items = [
      'Five signature strengths — uniquely named and actionable',
      'Deal-breakers you should never compromise on',
      'Role territories that fit how you actually work',
      'A career narrative ready for LinkedIn'
    ];
    return (
      <div className="intro-screen">
        <div className="intro-content slide-up">
          <div className="mono-label">After one conversation</div>
          <div className="display-heading">What you'll walk away with</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {items.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--accent)', minWidth: 24 }}>0{i + 1}</span>
                <p className="body-lg">{t}</p>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn-ghost" onClick={() => setIntroPage(0)}><ArrowLeft size={14} /> Back</button>
            <button className="btn-primary" onClick={() => setScreen('consent')}>Let's start <ArrowRight size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  // ── CONSENT ──
  if (screen === 'consent') {
    const ok = consentChecks.terms && consentChecks.age && consentChecks.data;
    const items = [
      { key: 'terms', text: 'I agree to the Terms of Service and understand this is a self-reflection tool, not professional career advice' },
      { key: 'age', text: 'I am 18 years of age or older' },
      { key: 'data', text: 'I understand my responses will be processed by AI' }
    ];
    return (
      <div className="intro-screen">
        <div className="intro-content slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <Lock size={20} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Before we begin</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>YOUR PRIVACY IS PROTECTED</div>
            </div>
          </div>
          <div className="card-glass" style={{ marginBottom: 32 }}>
            <p className="body-text">Your data stays on your device. Responses are processed by AI to generate insights. We don't store your information on our servers.</p>
          </div>
          {items.map(item => (
            <label key={item.key} className="consent-check" onClick={() => setConsentChecks({...consentChecks, [item.key]: !consentChecks[item.key]})}>
              <div className={`checkbox ${consentChecks[item.key] ? 'checked' : ''}`}>
                {consentChecks[item.key] && <Check size={12} color="var(--bg-void)" />}
              </div>
              <span className="body-text">{item.text}</span>
              <input type="checkbox" checked={consentChecks[item.key]} onChange={() => {}} style={{ display: 'none' }} />
            </label>
          ))}
          <div style={{ marginTop: 32 }}>
            <button className="btn-accent" style={{ width: '100%', justifyContent: 'center' }} disabled={!ok} onClick={startChat}>
              {ok ? 'Start the conversation' : 'Please agree to all items'}
            </button>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-ghost)', textAlign: 'center', marginTop: 16 }}>
              <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>privacy</a>
              {' · '}
              <a href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>terms</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT (LIGHT MODE) ──
  if (screen === 'chat') {
    return (
      <div className="chat-screen">
        <div className="chat-header">
          <div className="chat-header-brand">Pathlight</div>
          <div className="chat-header-status">
            <Lock size={12} /> private
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar-container">
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div
              key={i}
              className={`progress-segment ${i < filledSegments ? 'done' : ''} ${i === filledSegments ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="chat-messages">
          <div className="chat-messages-inner">
            {parsedMessages.map((msg, idx) => (
              <div key={idx} className={msg.role === 'user' ? 'msg-user' : 'msg-ai'} style={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Active interaction or text input */}
        <div className="chat-input-bar">
          <div className="chat-input-inner">
            {chatComplete ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <button className="btn-dark" onClick={() => { setScreen('synthesis'); generateSynthesis(); }} style={{ width: '100%', justifyContent: 'center', padding: '14px 28px' }}>
                  Generate My Report <ArrowRight size={16} />
                </button>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-dark-body)', marginTop: 8 }}>takes about 45 seconds</p>
              </div>
            ) : activeInteraction ? (
              <InteractionWidget interaction={activeInteraction} onSubmit={handleInteractionSubmit} />
            ) : (
              <div className="chat-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  className="chat-input"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                  placeholder="Type your response..."
                  disabled={isLoading}
                />
                <button className="send-btn" disabled={isLoading || !userInput.trim()} onClick={handleTextSubmit}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-footer">
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="/privacy">privacy</a>
            <a href="/terms">terms</a>
          </div>
          <button onClick={resetProgress}>clear data</button>
        </div>
      </div>
    );
  }

  // ── STRENGTH REVEAL ──
  if (screen === 'reveal' && revealStrength) {
    const idx = parsedData.superpowers.indexOf(revealStrength);
    return (
      <div className="reveal-container" key={revealStrength.name}>
        <div className="orb" />
        <div className="grid-lines" />
        <div className="reveal-index">strength_{String(idx + 1).padStart(2, '0')} of 05</div>
        <div className="reveal-label">Your Signature Strength</div>
        <div className="reveal-name">{revealStrength.name}</div>
        <div className="reveal-dash" />
        <div className="reveal-desc">{revealStrength.description}</div>
        <div className="reveal-actions">
          <button className="btn-primary" onClick={() => {
            setRevealStrength(null);
            setScreen('synthesis');
          }}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── SYNTHESIS (DARK MODE) ──
  if (screen === 'synthesis') {
    // Loading state
    if (synthesisGenerating || (!parsedData && !synthesisContent)) {
      return (
        <div className="report-loading">
          <div className="orb" />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24 }}>
              analyzing your conversation
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 32 }}>
              Building your report
            </div>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-ghost)', marginTop: 24 }}>
              this takes about 45 seconds
            </div>
          </div>
        </div>
      );
    }

    if (synthesisContent && !parsedData) {
      setParsedData(parseSynthesis(synthesisContent));
      return null;
    }
    if (!parsedData) return null;

    // ── Screen 0: Profile ──
    if (synthesisScreen === 0) {
      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">your profile</div>
            <div className="display-heading" style={{ marginBottom: 32 }}>Here's what we see in you</div>
            <div className="card-glass" style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                AI-generated insights to help you reflect
              </p>
            </div>
            <div style={{ fontSize: '1.0625rem', fontWeight: 300, lineHeight: 1.7, color: 'var(--text-body)' }}>
              {parsedData.profile.split('\n').filter(p => p.trim()).map((p, i) => (
                <p key={i} style={{ marginBottom: 16 }}>{p}</p>
              ))}
            </div>
            <div className="report-nav">
              <div />
              <button className="btn-primary" onClick={() => {
                // Show first strength reveal
                if (parsedData.superpowers[0]) {
                  setRevealStrength(parsedData.superpowers[0]);
                  setScreen('reveal');
                } else {
                  setSynthesisScreen(1);
                }
              }}>
                See Your Strengths <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ── Screen 1: Strengths ──
    if (synthesisScreen === 1) {
      const StrengthCard = ({ pw, num }) => (
        <div className="strength-card">
          <div className="strength-card-header">
            <div className="strength-num">{String(num).padStart(2, '0')}</div>
            <div>
              <div className="strength-name">{pw.name}</div>
              <div className="strength-desc">{pw.description}</div>
            </div>
          </div>
          {paymentCompleted && (
            <div className="strength-sections">
              {pw.valuable && (
                <div>
                  <div className="section-label valuable">What makes this valuable</div>
                  <div className="section-text">{pw.valuable}</div>
                </div>
              )}
              <div>
                <div className="section-label deploy">How to deploy this</div>
                {pw.thisWeek && <div className="section-text" style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>This week:</strong> {pw.thisWeek}</div>}
                {pw.inInterviews && <div className="section-text" style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>In interviews:</strong> {pw.inInterviews}</div>}
                {pw.bestRoles && <div className="section-text"><strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Best roles:</strong> {pw.bestRoles}</div>}
              </div>
              {pw.watchOut && (
                <div>
                  <div className="section-label watch">Watch out</div>
                  <div className="section-text">{pw.watchOut}</div>
                </div>
              )}
            </div>
          )}
        </div>
      );

      const LockedCard = ({ pw, num }) => (
        <div className="strength-locked">
          <div className="strength-locked-inner">
            <div style={{ display: 'flex', gap: 20 }}>
              <div className="strength-num">{String(num).padStart(2, '0')}</div>
              <div>
                <div className="strength-name">{pw.name}</div>
                <div className="strength-desc">{pw.description?.substring(0, 60)}...</div>
              </div>
            </div>
          </div>
          <div className="strength-locked-overlay">
            <div className="strength-locked-badge">
              <Lock size={12} /> unlock full report
            </div>
          </div>
        </div>
      );

      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">signature strengths</div>
            <div className="display-heading">What you've been bringing to the table</div>
            <p className="body-text" style={{ color: 'var(--text-body)', marginBottom: 32 }}>Strengths you undervalue because they come naturally.</p>

            {paymentCompleted ? (
              <>
                {parsedData.superpowers.slice(0, 5).map((pw, i) => (
                  <StrengthCard key={i} pw={pw} num={i + 1} />
                ))}
                {parsedData.superpowersSummary.whyTogether && (
                  <div style={{ marginTop: 32 }}>
                    <div className="mono-label">why these matter together</div>
                    <p className="body-lg" style={{ marginTop: 8 }}>{parsedData.superpowersSummary.whyTogether}</p>
                  </div>
                )}
                {parsedData.superpowersSummary.valueProp && (
                  <div className="card-accent-border" style={{ textAlign: 'center', marginTop: 24 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 500, color: 'var(--text-primary)', fontStyle: 'italic' }}>
                      "{parsedData.superpowersSummary.valueProp}"
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Free: 2 visible, 3 locked */}
                {parsedData.superpowers.slice(0, 2).map((pw, i) => (
                  <StrengthCard key={i} pw={pw} num={i + 1} />
                ))}
                {parsedData.superpowers.slice(2, 5).map((pw, i) => (
                  <LockedCard key={i} pw={pw} num={i + 3} />
                ))}

                {/* Paywall */}
                <div className="paywall">
                  <div className="orb-top" />
                  <div className="grid-lines" />
                  <div className="paywall-content">
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24 }}>
                      2 of 5 strengths revealed
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 16 }}>
                      There's more to<br />your story
                    </div>
                    <p className="body-text" style={{ maxWidth: 380, margin: '0 auto 32px' }}>
                      Your full report reveals the complete picture — the patterns, the rare combinations, and where to take them next.
                    </p>
                    <div className="paywall-features">
                      {[
                        'All 5 bespoke strengths with deployment guides',
                        'Rare strength combinations',
                        'Deal-breakers checklist',
                        '5 role territories to explore',
                        'Career narrative for LinkedIn',
                        'Downloadable PDF report'
                      ].map((f, i) => (
                        <div key={i} className="paywall-feature"><span className="dot" />{f}</div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>$39</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 4, verticalAlign: 'super' }}>AUD</span>
                    </div>
                    <button className="btn-accent" onClick={handlePayment}>
                      Unlock Full Report <ArrowRight size={16} />
                    </button>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-ghost)', marginTop: 24, letterSpacing: '0.02em' }}>
                      encrypted payment via stripe · data stays on your device
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="report-nav">
              <button className="btn-ghost" onClick={() => setSynthesisScreen(0)}><ArrowLeft size={14} /> Back</button>
              {paymentCompleted && (
                <button className="btn-primary" onClick={() => setSynthesisScreen(2)}>
                  Strength Combinations <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── Screen 2: Combinations (paid) ──
    if (synthesisScreen === 2 && paymentCompleted) {
      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">strength combinations</div>
            <div className="display-heading">Where your strengths multiply</div>
            <p className="body-text" style={{ color: 'var(--text-body)', marginBottom: 32 }}>Individual strengths are useful. Combinations make you irreplaceable.</p>

            {parsedData.strengthCombos.map((c, i) => (
              <div key={i} className="combo-card">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {c.title}
                </div>
                <p className="body-text" style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
              </div>
            ))}

            {parsedData.rarestCombo && (
              <div className="card-accent-border" style={{ marginTop: 8 }}>
                <div className="mono-label" style={{ color: 'var(--accent)', marginBottom: 8 }}>your rarest combination</div>
                <p className="body-text">{parsedData.rarestCombo}</p>
              </div>
            )}

            <div className="report-nav">
              <button className="btn-ghost" onClick={() => setSynthesisScreen(1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn-primary" onClick={() => setSynthesisScreen(3)}>Deal-Breakers <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      );
    }

    // ── Screen 3: Deal-breakers (paid) ──
    if (synthesisScreen === 3 && paymentCompleted) {
      const db = parsedData.dealbreakers;
      const cats = [
        ['About the work', db.work],
        ['What comes with the job', db.job],
        ['About leadership', db.leadership],
        ['About the environment', db.environment]
      ];
      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">deal-breakers</div>
            <div className="display-heading">What doesn't work for you</div>
            <p className="body-text" style={{ color: 'var(--text-body)', marginBottom: 32 }}>Use this when evaluating opportunities.</p>

            {cats.map(([label, items]) => items.length > 0 && (
              <div key={label} className="dealbreaker-card">
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{label}</div>
                {items.map((item, i) => (
                  <div key={i} className="dealbreaker-item">
                    <span className="dealbreaker-dash">—</span>
                    <span className="body-text">{item}</span>
                  </div>
                ))}
              </div>
            ))}

            <div className="report-nav">
              <button className="btn-ghost" onClick={() => setSynthesisScreen(2)}><ArrowLeft size={14} /> Back</button>
              <button className="btn-primary" onClick={() => setSynthesisScreen(4)}>Role Territories <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      );
    }

    // ── Screen 4: Territories (paid) ──
    if (synthesisScreen === 4 && paymentCompleted) {
      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">role territories</div>
            <div className="display-heading">Paths to explore</div>
            <p className="body-text" style={{ color: 'var(--text-body)', marginBottom: 32 }}>Directions, not prescriptions. Tap to expand.</p>

            {parsedData.territories.map((t, i) => (
              <div key={i} className="territory-card">
                <div className="territory-header" onClick={() => setExpandedTerritories(prev => ({ ...prev, [i]: !prev[i] }))}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)', transform: expandedTerritories[i] ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
                </div>
                {expandedTerritories[i] && (
                  <div className="territory-body">
                    {t.whyFits && <div style={{ marginBottom: 16 }}><div className="section-label" style={{ color: 'var(--accent)' }}>Why this fits</div><div className="section-text">{t.whyFits}</div></div>}
                    {t.transfers && <div style={{ marginBottom: 16 }}><div className="section-label" style={{ color: 'var(--signal-warm)' }}>What transfers</div><div className="section-text">{t.transfers}</div></div>}
                    {t.gaps && <div style={{ marginBottom: 16 }}><div className="section-label" style={{ color: 'var(--signal-sharp)' }}>Possible gaps</div><div className="section-text">{t.gaps}</div></div>}
                    {t.salary && <div style={{ marginBottom: 16 }}><div className="section-label" style={{ color: 'var(--text-muted)' }}>Salary range</div><div className="section-text">{t.salary}</div></div>}
                    {t.searchTerms && <div style={{ marginBottom: 16 }}><div className="section-label" style={{ color: 'var(--text-muted)' }}>Search terms</div><div className="section-text">{t.searchTerms}</div></div>}
                    {t.dealbreakers && <div><div className="section-label" style={{ color: 'var(--signal-cool)' }}>Respects your deal-breakers</div><div className="section-text">{t.dealbreakers}</div></div>}
                  </div>
                )}
              </div>
            ))}

            <div className="report-nav">
              <button className="btn-ghost" onClick={() => setSynthesisScreen(3)}><ArrowLeft size={14} /> Back</button>
              <button className="btn-primary" onClick={() => setSynthesisScreen(5)}>Career Narrative <ArrowRight size={16} /></button>
            </div>
          </div>
        </div>
      );
    }

    // ── Screen 5: Career Narrative + PDF (paid) ──
    if (synthesisScreen === 5 && paymentCompleted) {
      return (
        <div className="report-screen">
          <div className="report-content slide-up">
            <div className="mono-label">career narrative</div>
            <div className="display-heading">Your story, ready to use</div>
            <p className="body-text" style={{ color: 'var(--text-body)', marginBottom: 32 }}>Copy, paste, make it yours.</p>

            {parsedData.careerNarrative && (
              <div className="narrative-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>LinkedIn / About</div>
                  <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(parsedData.careerNarrative)}>copy</button>
                </div>
                <p className="body-lg" style={{ whiteSpace: 'pre-wrap' }}>{parsedData.careerNarrative}</p>
              </div>
            )}

            {parsedData.shortIntro && (
              <div className="narrative-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>30-Second Introduction</div>
                  <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(parsedData.shortIntro)}>copy</button>
                </div>
                <p className="body-lg" style={{ whiteSpace: 'pre-wrap' }}>{parsedData.shortIntro}</p>
              </div>
            )}

            {/* PDF Download */}
            <div className="card-accent-border" style={{ textAlign: 'center', marginTop: 32 }}>
              <FileText size={32} style={{ color: 'var(--accent)', marginBottom: 16 }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Download Your Report</div>
              <button className="btn-accent" onClick={downloadPDF} disabled={pdfDownloading} style={{ marginTop: 12 }}>
                {pdfDownloading ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</>
                ) : (
                  <><Download size={16} /> Download PDF</>
                )}
              </button>
            </div>

            {/* Feedback */}
            <div className="card-glass" style={{ textAlign: 'center', marginTop: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>Help improve Pathlight</div>
              <a href="https://forms.gle/fUaxKWAMbQZdbXNk7" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ marginTop: 8 }}>
                Take 2-Min Survey
              </a>
            </div>

            <div className="report-nav">
              <button className="btn-ghost" onClick={() => setSynthesisScreen(4)}><ArrowLeft size={14} /> Back</button>
              <div />
            </div>
          </div>
        </div>
      );
    }
  }

  // Fallback
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      <p>Something went wrong. <button onClick={resetProgress} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button></p>
    </div>
  );
}
