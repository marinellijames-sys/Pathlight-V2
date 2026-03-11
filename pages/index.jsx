import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Check, Download, Lock, FileText, Eye } from 'lucide-react';

// ─────────────────────────────────────────────
// PATHLIGHT v4
// Landing → Intro → Consent → Chat (phase-tracked) → Synthesis
// No screener. Phases: Energy → Drainers → Strengths → Wins → Ideal Role
// ─────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-20250514';

// Helper: strip markdown formatting for display
const clean = (text) => {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '').trim();
};

export default function Pathlight() {
  const [screen, setScreen] = useState('loading');
  const [introPage, setIntroPage] = useState(0);
  const [messages, setMessages] = useState([]);
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load / Save ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pathlight-v4');
      const payment = localStorage.getItem('pathlight-payment');
      if (saved) {
        const d = JSON.parse(saved);
        setMessages(d.messages || []);
        setChatComplete(d.chatComplete || false);
        setSynthesisContent(d.synthesisContent || null);
        if (d.synthesisContent) { setScreen('synthesis'); setParsedData(parseSynthesis(d.synthesisContent)); }
        else if (d.chatComplete) { setScreen('synthesis'); }
        else if (d.messages?.length > 0) { setScreen('chat'); }
        else { setScreen('landing'); }
      } else { setScreen('landing'); }
      if (payment === 'completed') setPaymentCompleted(true);
    } catch (e) { setScreen('landing'); }
  }, []);

  // ── ?unlock=true bypass + payment URL param ──
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success' || p.get('unlock') === 'true') {
      setPaymentCompleted(true);
      localStorage.setItem('pathlight-payment', 'completed');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (!isLoading && screen === 'chat') inputRef.current?.focus(); }, [isLoading, screen]);

  const save = (ov = {}) => {
    try {
      localStorage.setItem('pathlight-v4', JSON.stringify({
        messages: ov.messages ?? messages,
        chatComplete: ov.chatComplete ?? chatComplete,
        synthesisContent: ov.synthesisContent ?? synthesisContent,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {}
  };

  const resetProgress = () => {
    if (confirm('Start fresh? All progress will be cleared.')) {
      localStorage.removeItem('pathlight-v4');
      localStorage.removeItem('pathlight-payment');
      setMessages([]); setChatComplete(false);
      setSynthesisContent(null); setParsedData(null); setPaymentCompleted(false);
      setSynthesisScreen(0); setScreen('landing');
    }
  };

  // ─────────────────────────────────────────────
  // CONVERSATION ENGINE — Phase-tracked
  // ─────────────────────────────────────────────

  const buildSystemPrompt = () => {
    const userMsgCount = messages.filter(m => m.role === 'user').length;

    return `You are having a private career conversation with someone. You're perceptive, warm, and direct — like a sharp friend, not a therapist or coach.

YOUR JOB: Systematically explore 5 territories through natural conversation. Each territory needs at least 2 substantive user responses before you can move on.

═══ THE 5 PHASES (in order) ═══

PHASE 1 — ENERGY (messages 1-3)
What makes time disappear? When can't they drag themselves away? What tasks make them feel alive? Probe: is it the process or the outcome that energizes them?

PHASE 2 — DRAINERS (messages 3-5)
Transition naturally from energy to its opposite. What kills their energy? What made them miserable? Ask for a SPECIFIC moment — one day or incident that crystallized "I can't keep doing this." What specifically about it drained them — the tasks, the people, the culture, the lack of recognition?

PHASE 3 — STRENGTHS (messages 5-8)
What do people come to them for? What feels effortless to them but hard for others? Ask for specific examples. What do colleagues or friends say they're good at? Push for things they dismiss as "not a big deal."

PHASE 4 — WINS (messages 8-10)
What have they accomplished that they're proud of? What did they have to overcome? What makes them feel proud — the result or the journey? Include work AND life achievements.

PHASE 5 — IDEAL ROLE (messages 10-13)
Their perfect work life 3 years from now. Be specific: schedule, location, what they're actually doing hour by hour, who they work with, how much they earn, what flexibility they have.

═══ RULES ═══

1. Ask ONE question per response. Maximum 2-3 sentences total. No essays. No coaching. No advice. Just questions and brief reflections.

2. NEVER announce phases. Don't say "let's move on to strengths." Transition naturally: "That's interesting about the politics draining you. Flip side — what do people actually come to you for at work?"

3. Reference their actual words. "You mentioned building that framework changed how the team operates — what specifically about that felt good?"

4. When they give a vague answer, push for specifics: "Walk me through that day" or "Give me a concrete example" — not "tell me more."

5. Note contradictions gently. If they say they want autonomy but their best win was a team effort, mention it.

6. DO NOT give career advice, suggest actions, recommend research, or coach them. You are COLLECTING information, not providing guidance. The report does the advising.

7. Track coverage mentally. Do not move to the next phase until you have at least 2 substantive user responses in the current phase.

═══ CONVERSATION STATE ═══
This is user message ${userMsgCount + 1}.
Approximate target: 13-15 user messages total.

${userMsgCount === 0 ? `THIS IS THE OPENING. Start with energy:
"What kind of work makes time disappear for you? Not what you think you should enjoy — what actually pulls you in so deep you forget to check the clock?"
Keep it to 1-2 sentences. Don't introduce yourself. Don't explain the process.` : ''}

${userMsgCount >= 11 && userMsgCount < 13 ? `WRAPPING UP. Check: have all 5 phases been covered with depth? If any territory is thin, weave a question about it into your response. Start connecting themes across phases.` : ''}

${userMsgCount >= 13 ? `FINAL RESPONSE. Close warmly:
- One sentence reflecting a key pattern: "What strikes me is..."
- One sentence: "I've got a really clear picture of you now."
- End warmly. No advice.
- Add on its own line at the very end: [CONVERSATION_COMPLETE]` : ''}

Remember: SHORT responses. Questions, not advice. You are a skilled interviewer, not a life coach.`;
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading || chatComplete) return;
    const newMsg = { role: 'user', content: userInput.trim() };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setUserInput('');
    setIsLoading(true);

    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 250, system: buildSystemPrompt(), messages: updated })
      });
      const data = await r.json();
      let text = data.content[0].text;
      const complete = text.includes('[CONVERSATION_COMPLETE]');
      text = text.replace('[CONVERSATION_COMPLETE]', '').trim();
      const final = [...updated, { role: 'assistant', content: text }];
      setMessages(final);
      if (complete) { setChatComplete(true); save({ messages: final, chatComplete: true }); }
      else { save({ messages: final }); }
    } catch (e) { console.error('Chat error:', e); }
    finally { setIsLoading(false); }
  };

  const startChat = async () => {
    setScreen('chat');
    setIsLoading(true);
    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL, max_tokens: 150, system: buildSystemPrompt(),
          messages: [{ role: 'user', content: '[Begin]' }]
        })
      });
      const data = await r.json();
      const initial = [{ role: 'assistant', content: data.content[0].text }];
      setMessages(initial);
      save({ messages: initial });
    } catch (e) { console.error('Start error:', e); }
    finally { setIsLoading(false); }
  };

  // ─────────────────────────────────────────────
  // SYNTHESIS — Two API calls
  // ─────────────────────────────────────────────

  const generateSynthesis = async () => {
    if (synthesisContent) { setParsedData(parseSynthesis(synthesisContent)); return; }
    setSynthesisGenerating(true);

    try {
      const transcript = messages.map(m => `${m.role === 'user' ? 'THEM' : 'PATHLIGHT'}: ${m.content}`).join('\n\n');

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

EXACTLY 4 strengths. Each is a specific combination of abilities — not a generic skill.

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

After all 4 strengths:

WHY THESE MATTER TOGETHER:
[2-3 sentences. Not "diverse skills." Say: "Most people who can do X can't do Y. You can, because..." Explain the specific interaction.]

YOUR VALUE PROPOSITION:
"[One sentence, first person, for LinkedIn headline or elevator pitch]"

## Your Strength Combinations

The 3 most powerful pairings from the 4 strengths above:

### [Strength A] + [Strength B]
What this creates: [1-2 sentences — the specific capability]
Why it's rare: [1 sentence — why most people have one but not both]
Roles that need exactly this: [2-3 specific roles]

### [Strength C] + [Strength D]
[Same format]

### [Strength A/B] + [Strength C/D]
[Same format]

RAREST COMBINATION: [1-2 sentences identifying which of the 3 pairings above is most unusual and why. Do NOT repeat as a separate section — just this line at the end.]`;

      const r1 = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 3500, system: p1,
          messages: [{ role: 'user', content: 'Create my profile, signature strengths, and strength combinations.' }] })
      });
      const part1 = (await r1.json()).content[0].text;

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

      const r2 = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: p2,
          messages: [{ role: 'user', content: 'Create my deal-breakers, role territories, and career narrative.' }] })
      });
      const part2 = (await r2.json()).content[0].text;

      const full = part1 + '\n\n' + part2;
      setSynthesisContent(full);
      setParsedData(parseSynthesis(full));
      save({ synthesisContent: full });
    } catch (e) { console.error('Synthesis error:', e); }
    finally { setSynthesisGenerating(false); }
  };

  // ─────────────────────────────────────────────
  // PARSER — handles v4 markdown structure
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

        // Parse individual strengths
        const blocks = fullText.split(/\n### /).filter(b => b.trim());
        blocks.forEach(block => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (!name || name.includes('WHY THESE') || name.includes('YOUR VALUE')) return;

          // Description: lines after name until first label
          const labels = ['WHAT MAKES THIS VALUABLE:', 'HOW TO DEPLOY THIS:', 'WATCH OUT:', '---'];
          let descLines = [];
          let i = 1;
          while (i < lines.length && !labels.some(l => lines[i].trim().startsWith(l))) {
            if (lines[i].trim()) descLines.push(lines[i].trim());
            i++;
          }
          const description = clean(descLines.join(' '));

          // Extract labeled sections
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

          // Parse deploy sub-fields
          const getDeployField = (field) => {
            const m = deployRaw.match(new RegExp(field + ':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)', 's'));
            return m ? clean(m[1]) : '';
          };
          const thisWeek = getDeployField('This week');
          const inInterviews = getDeployField('In interviews');
          const bestRoles = getDeployField('Best roles for this');

          if (name && description) {
            s.superpowers.push({ name, description, valuable, thisWeek, inInterviews, bestRoles, watchOut });
          }
        });

        // Why together + value prop
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
    try { const r = await fetch('/api/stripe-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } }); window.location.href = (await r.json()).url; }
    catch (e) { alert('Payment failed.'); }
  };

  const downloadPDF = async () => {
    if (!synthesisContent) return;
    setPdfDownloading(true);
    try {
      const r = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ synthesisContent }) });
      if (!r.ok) throw new Error();
      const blob = await r.blob(); const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'pathlight-career-report.pdf';
      document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch (e) { alert('PDF generation failed.'); }
    finally { setPdfDownloading(false); }
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  if (screen === 'loading') return <div className="min-h-screen bg-cream flex items-center justify-center"><div className="w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" /></div>;

  // ── LANDING ──
  if (screen === 'landing') {
    return (
      <div className="landing-dark">
        <div className="text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute flashlight-glow" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,252,245,0.15) 0%, rgba(255,252,245,0.05) 40%, transparent 70%)', borderRadius: '50%', filter: 'blur(30px)' }} />
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl flashlight-text relative z-10" style={{ fontWeight: 400, color: '#FFFCF5' }}>Pathlight</h1>
          </div>
          <p className="text-stone text-lg md:text-xl mt-8 fade-in-delayed font-light">Find clarity in your career</p>
          <button onClick={() => { setScreen('intro'); setIntroPage(0); }} className="mt-12 fade-in-delayed bg-transparent border border-stone/50 text-cream px-8 py-3 rounded hover:bg-white/5 hover:border-stone transition-all font-sans font-light tracking-wide">Begin</button>
          <p className="mt-6 text-stone/60 text-sm fade-in-delayed font-light">20 minutes. Private.</p>
        </div>
      </div>
    );
  }

  // ── INTRO 1 ──
  if (screen === 'intro' && introPage === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-10">You're here because something isn't quite right.</h2>
          <div className="space-y-5 text-lg text-graphite leading-relaxed font-light stagger-children">
            <p>Maybe you feel stuck in a role that doesn't fit anymore.</p>
            <p>Maybe you lack direction.</p>
            <p>Maybe you're ready for something bigger but don't know what.</p>
          </div>
          <p className="mt-10 text-lg text-ink">That's okay. You're in the right place.</p>
          <div className="mt-8 bg-linen rounded-xl p-5 border border-silver">
            <p className="text-sm text-graphite leading-relaxed font-light">
              <strong className="text-ink font-medium">Before we start:</strong> This works like a conversation with a sharp friend who sees your blind spots. The more honest and specific you are, the more useful your report will be. Give yourself 20 minutes somewhere quiet.
            </p>
          </div>
          <div className="flex items-center justify-end mt-12 pt-8 border-t border-silver">
            <button onClick={() => setIntroPage(1)} className="btn-primary inline-flex items-center gap-3">Continue <ArrowRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO 2 ──
  if (screen === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-6 font-medium">After one conversation</p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-12">What you'll walk away with</h2>
          <div className="space-y-0 stagger-children">
            {['Your signature strengths — named and actionable', 'Deal-breakers you should never compromise on', 'Role territories that actually fit how you work', 'A career narrative ready for LinkedIn'].map((t, i) => (
              <div key={i} className="flex items-start gap-4 py-5 border-b border-silver last:border-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal text-cream text-sm font-medium flex items-center justify-center">{i + 1}</span>
                <p className="text-lg text-graphite pt-1 font-light">{t}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-12">
            <button onClick={() => setIntroPage(0)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"><ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span></button>
            <button onClick={() => setScreen('consent')} className="btn-primary inline-flex items-center gap-3">Let's start <ArrowRight className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    );
  }

  // ── CONSENT ──
  if (screen === 'consent') {
    const ok = consentChecks.terms && consentChecks.age && consentChecks.data;
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-linen flex items-center justify-center border border-silver"><Lock className="w-5 h-5 text-ash" /></div>
            <div><h1 className="font-serif text-xl text-ink">Before we begin</h1><p className="text-sm text-stone font-light">Your privacy is protected</p></div>
          </div>
          <div className="bg-linen rounded-xl p-5 mb-8 border border-silver">
            <p className="text-sm text-graphite leading-relaxed font-light">Your data stays on your device. Responses are processed by AI to generate insights. We don't store your information on our servers.</p>
          </div>
          <div className="space-y-3">
            {[{ key: 'terms', text: 'I understand this is a self-reflection tool, not professional career advice' }, { key: 'age', text: 'I am 18 years of age or older' }, { key: 'data', text: 'I understand my responses will be processed by AI' }].map(item => (
              <label key={item.key} className="flex items-start gap-4 cursor-pointer group p-4 rounded-lg border border-silver hover:border-ash transition-colors bg-paper">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${consentChecks[item.key] ? 'bg-charcoal border-charcoal' : 'border-silver bg-white'}`}>{consentChecks[item.key] && <Check className="w-3 h-3 text-cream" />}</div>
                  <input type="checkbox" checked={consentChecks[item.key]} onChange={e => setConsentChecks({...consentChecks, [item.key]: e.target.checked})} className="sr-only" />
                </div>
                <span className="text-sm text-graphite leading-relaxed font-light">{item.text}</span>
              </label>
            ))}
          </div>
          <div className="mt-8">
            <button onClick={startChat} disabled={!ok} className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${ok ? 'btn-primary' : 'bg-silver text-stone cursor-not-allowed'}`}>{ok ? 'Start the conversation' : 'Please agree to all items'}</button>
            <p className="text-xs text-stone text-center mt-4 font-light">See our <a href="/privacy" className="text-ash hover:underline">Privacy Policy</a></p>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT ──
  if (screen === 'chat') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
          <span className="font-serif text-lg text-ink">Pathlight</span>
          <span className="text-xs text-stone font-light flex items-center gap-1"><Lock className="w-3 h-3" /> Private</span>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && <div className="flex justify-start"><div className="message-ai"><div className="flex items-center gap-1.5"><span className="typing-dot w-2 h-2 bg-stone rounded-full" /><span className="typing-dot w-2 h-2 bg-stone rounded-full" /><span className="typing-dot w-2 h-2 bg-stone rounded-full" /></div></div></div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="border-t border-silver bg-paper p-4">
          <div className="max-w-2xl mx-auto">
            {chatComplete ? (
              <div className="text-center py-2">
                <button onClick={() => { setScreen('synthesis'); generateSynthesis(); }} className="btn-primary inline-flex items-center gap-3 w-full justify-center">
                  <Sparkles className="w-5 h-5" /> Generate My Report
                </button>
                <p className="text-xs text-stone mt-2 font-light">Takes about 45 seconds</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <input ref={inputRef} type="text" value={userInput} onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your response..." className="input flex-1" disabled={isLoading} />
                <button onClick={sendMessage} disabled={isLoading || !userInput.trim()}
                  className="bg-charcoal hover:bg-ink disabled:bg-silver disabled:text-stone text-cream px-5 rounded-lg transition-all flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <footer className="px-6 py-2 flex items-center justify-end text-xs text-stone font-light border-t border-silver">
          <button onClick={resetProgress} className="hover:text-ink transition-colors">Clear data</button>
        </footer>
      </div>
    );
  }

  // ── SYNTHESIS ──
  if (screen === 'synthesis') {
    if (synthesisGenerating || (!parsedData && !synthesisContent)) {
      return <div className="min-h-screen bg-cream flex items-center justify-center px-6"><div className="text-center fade-in-up">
        <Sparkles className="w-12 h-12 text-ash mx-auto mb-6" />
        <h2 className="font-serif text-3xl text-ink mb-4">Building your report</h2>
        <p className="text-graphite font-light mb-6">Analyzing your conversation...</p>
        <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-stone mt-4">This takes about 45 seconds</p>
      </div></div>;
    }
    if (synthesisContent && !parsedData) { setParsedData(parseSynthesis(synthesisContent)); return null; }
    if (!parsedData) return null;

    // Screen 0: Profile
    if (synthesisScreen === 0) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <div className="bg-linen rounded-lg p-4 mb-8 text-sm text-graphite border border-silver font-light">AI-generated insights to help you reflect.</div>
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Your Profile</p>
          <h2 className="font-serif text-3xl text-ink mb-8">Here's what we see in you</h2>
          <div className="text-lg text-graphite leading-relaxed space-y-4 mb-10 font-light">
            {parsedData.profile.split('\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <button onClick={() => setSynthesisScreen(1)} className="btn-primary inline-flex items-center gap-3">See Your Signature Strengths <ArrowRight className="w-5 h-5" /></button>
        </div></div>
      );
    }

    // Screen 1: Strengths — FREE: 1 preview (name+desc only). PAID: all 4 with full detail.
    if (synthesisScreen === 1 && parsedData.superpowers?.length > 0) {

      // Full strength card component
      const StrengthCard = ({ pw, num }) => (
        <div className="bg-paper border border-silver rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-charcoal text-cream font-medium flex items-center justify-center">{num}</div>
            <div className="flex-1">
              <h3 className="font-serif text-xl text-ink mb-2">{pw.name}</h3>
              <p className="text-graphite leading-relaxed font-light">{pw.description}</p>
            </div>
          </div>
          {/* Full detail — only shown when paid */}
          {paymentCompleted && (
            <div className="ml-14 space-y-4 mt-4">
              {pw.valuable && (
                <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">What makes this valuable</p>
                <p className="text-sm text-graphite font-light">{pw.valuable}</p></div>
              )}
              <div>
                <p className="text-xs tracking-widest uppercase text-ash mb-2 font-medium">How to deploy this</p>
                {pw.thisWeek && <p className="text-sm text-graphite font-light mb-2"><span className="text-ink font-medium">This week:</span> {pw.thisWeek}</p>}
                {pw.inInterviews && <p className="text-sm text-graphite font-light mb-2"><span className="text-ink font-medium">In interviews:</span> {pw.inInterviews}</p>}
                {pw.bestRoles && <p className="text-sm text-graphite font-light mb-2"><span className="text-ink font-medium">Best roles:</span> {pw.bestRoles}</p>}
              </div>
              {pw.watchOut && (
                <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Watch out</p>
                <p className="text-sm text-graphite font-light">{pw.watchOut}</p></div>
              )}
            </div>
          )}
        </div>
      );

      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Signature Strengths</p>
          <h2 className="font-serif text-3xl text-ink mb-3">What you've been bringing to the table</h2>
          <p className="text-graphite mb-10 font-light">Strengths you undervalue because they come naturally.</p>

          {paymentCompleted ? (
            <>
              {/* PAID: All 4 strengths fully expanded */}
              {parsedData.superpowers.slice(0, 4).map((pw, i) => <StrengthCard key={i} pw={pw} num={i + 1} />)}

              {/* Why together + value prop */}
              {parsedData.superpowersSummary.whyTogether && (
                <div className="mt-8 mb-4">
                  <p className="text-xs tracking-widest uppercase text-ash mb-2 font-medium">Why these matter together</p>
                  <p className="text-graphite leading-relaxed font-light">{parsedData.superpowersSummary.whyTogether}</p>
                </div>
              )}
              {parsedData.superpowersSummary.valueProp && (
                <div className="bg-linen rounded-lg p-5 border border-silver text-center my-6">
                  <p className="font-serif text-lg text-ink italic">"{parsedData.superpowersSummary.valueProp}"</p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* FREE: 1 preview + 3 locked */}
              <StrengthCard pw={parsedData.superpowers[0]} num={1} />
              {parsedData.superpowers.slice(1, 4).map((pw, idx) => (
                <div key={idx} className="relative mb-4">
                  <div className="bg-linen rounded-xl p-6 opacity-40 blur-[2px]">
                    <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-silver" /><div><h3 className="font-serif text-xl text-ink mb-2">{pw.name}</h3><p className="text-graphite font-light">{pw.description.substring(0, 60)}...</p></div></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-paper rounded-lg px-4 py-2 shadow-md flex items-center gap-2 border border-silver"><Lock className="w-4 h-4 text-stone" /><span className="text-sm text-graphite">Locked</span></div>
                  </div>
                </div>
              ))}
              {/* Payment wall */}
              <div className="bg-charcoal rounded-xl p-8 text-center mt-10">
                <FileText className="w-10 h-10 mx-auto mb-4 text-white/80" />
                <h3 className="font-serif text-2xl mb-3 text-white">Unlock Your Full Report</h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto font-light">All 4 strengths with deployment guides, strength combinations, deal-breakers, role territories, and your career narrative.</p>
                <div className="mb-6"><span className="text-4xl font-serif text-white">$39</span><span className="text-white/60 ml-1">AUD</span></div>
                <button onClick={handlePayment} className="bg-white text-charcoal px-8 py-3 rounded-lg font-medium hover:bg-cream transition-colors inline-flex items-center gap-2">Unlock Full Report <ArrowRight className="w-5 h-5" /></button>
                <p className="text-xs text-white/50 mt-4 font-light">Secure payment via Stripe</p>
              </div>
            </>
          )}

          <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
            <button onClick={() => setSynthesisScreen(0)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"><ArrowLeft className="w-4 h-4" /> Back</button>
            {paymentCompleted && <button onClick={() => setSynthesisScreen(2)} className="btn-primary inline-flex items-center gap-2">Strength Combinations <ArrowRight className="w-5 h-5" /></button>}
          </div>
        </div></div>
      );
    }

    // Screen 2: Strength Combinations (paid)
    if (synthesisScreen === 2 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Strength Combinations</p>
          <h2 className="font-serif text-3xl text-ink mb-3">Where your strengths multiply</h2>
          <p className="text-graphite mb-8 font-light">Individual strengths are useful. Combinations make you irreplaceable.</p>
          <div className="space-y-4">
            {parsedData.strengthCombos.map((c, i) => (
              <div key={i} className="bg-paper border border-silver rounded-lg p-5">
                <h3 className="font-serif text-lg text-ink mb-2">{c.title}</h3>
                <p className="text-graphite text-sm leading-relaxed font-light whitespace-pre-wrap">{c.body}</p>
              </div>
            ))}
            {parsedData.rarestCombo && (
              <div className="bg-paper border border-charcoal rounded-lg p-5">
                <p className="text-xs tracking-widest uppercase text-ash mb-2 font-medium">Your rarest combination</p>
                <p className="text-graphite text-sm leading-relaxed font-light">{parsedData.rarestCombo}</p>
              </div>
            )}
          </div>
          <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
            <button onClick={() => setSynthesisScreen(1)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setSynthesisScreen(3)} className="btn-primary inline-flex items-center gap-2">Deal-Breakers <ArrowRight className="w-5 h-5" /></button>
          </div>
        </div></div>
      );
    }

    // Screen 3: Deal-Breakers (paid)
    if (synthesisScreen === 3 && paymentCompleted) {
      const db = parsedData.dealbreakers;
      const cats = [['About the work', db.work], ['What comes with the job', db.job], ['About leadership', db.leadership], ['About the environment', db.environment]];
      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Deal-Breakers</p>
          <h2 className="font-serif text-3xl text-ink mb-3">What doesn't work for you</h2>
          <p className="text-graphite mb-8 font-light">Use this when evaluating opportunities.</p>
          <div className="space-y-4">
            {cats.map(([label, items]) => items.length > 0 && (
              <div key={label} className="bg-paper border border-silver rounded-lg p-5">
                <h3 className="font-serif text-lg text-ink mb-3">{label}</h3>
                <ul className="space-y-2 text-graphite text-sm font-light">
                  {items.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="text-ash mt-0.5">—</span><span>{item}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
            <button onClick={() => setSynthesisScreen(2)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setSynthesisScreen(4)} className="btn-primary inline-flex items-center gap-2">Role Territories <ArrowRight className="w-5 h-5" /></button>
          </div>
        </div></div>
      );
    }

    // Screen 4: Role Territories (paid) — with Possible Gaps
    if (synthesisScreen === 4 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Role Territories</p>
          <h2 className="font-serif text-3xl text-ink mb-3">Paths to explore</h2>
          <p className="text-graphite mb-8 font-light">Directions, not prescriptions. Tap to expand.</p>
          <div className="space-y-3">
            {parsedData.territories.map((t, i) => (
              <details key={i} className="group bg-paper border border-silver rounded-lg overflow-hidden">
                <summary className="cursor-pointer p-5 list-none hover:bg-linen transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg text-ink">{t.name}</h3>
                    <ArrowRight className="w-5 h-5 text-stone group-open:rotate-90 transition-transform" />
                  </div>
                </summary>
                <div className="px-5 pb-5 border-t border-silver pt-4 space-y-3 text-sm font-light">
                  {t.whyFits && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Why this fits</p><p className="text-graphite">{t.whyFits}</p></div>}
                  {t.transfers && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">What transfers</p><p className="text-graphite">{t.transfers}</p></div>}
                  {t.gaps && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Possible gaps</p><p className="text-graphite">{t.gaps}</p></div>}
                  {t.salary && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Salary range</p><p className="text-graphite">{t.salary}</p></div>}
                  {t.searchTerms && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Search terms</p><p className="text-graphite">{t.searchTerms}</p></div>}
                  {t.dealbreakers && <div><p className="text-xs tracking-widest uppercase text-ash mb-1 font-medium">Respects your deal-breakers</p><p className="text-graphite">{t.dealbreakers}</p></div>}
                </div>
              </details>
            ))}
          </div>
          <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
            <button onClick={() => setSynthesisScreen(3)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => setSynthesisScreen(5)} className="btn-primary inline-flex items-center gap-2">Career Narrative <ArrowRight className="w-5 h-5" /></button>
          </div>
        </div></div>
      );
    }

    // Screen 5: Career Narrative + PDF + Feedback (paid)
    if (synthesisScreen === 5 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12"><div className="max-w-2xl mx-auto fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Career Narrative</p>
          <h2 className="font-serif text-3xl text-ink mb-3">Your story, ready to use</h2>
          <p className="text-graphite mb-8 font-light">Copy, paste, make it yours.</p>

          {parsedData.careerNarrative && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3"><h3 className="font-serif text-lg text-ink">LinkedIn / About</h3>
                <button onClick={() => navigator.clipboard?.writeText(parsedData.careerNarrative)} className="text-xs text-stone hover:text-ink transition-colors">Copy</button></div>
              <div className="bg-paper border border-silver rounded-lg p-5"><p className="text-graphite leading-relaxed font-light whitespace-pre-wrap">{parsedData.careerNarrative}</p></div>
            </div>
          )}
          {parsedData.shortIntro && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3"><h3 className="font-serif text-lg text-ink">30-Second Introduction</h3>
                <button onClick={() => navigator.clipboard?.writeText(parsedData.shortIntro)} className="text-xs text-stone hover:text-ink transition-colors">Copy</button></div>
              <div className="bg-paper border border-silver rounded-lg p-5"><p className="text-graphite leading-relaxed font-light whitespace-pre-wrap">{parsedData.shortIntro}</p></div>
            </div>
          )}

          <div className="bg-paper border border-charcoal rounded-xl p-6 text-center mt-10">
            <FileText className="w-10 h-10 mx-auto mb-4 text-charcoal" /><h3 className="font-serif text-xl mb-2">Download Your Report</h3>
            <button onClick={downloadPDF} disabled={pdfDownloading} className="btn-primary inline-flex items-center gap-2 mt-3">
              {pdfDownloading ? <><div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Download className="w-5 h-5" /> Download PDF</>}
            </button>
          </div>
          <div className="bg-linen border border-silver rounded-xl p-6 text-center mt-6">
            <h3 className="font-serif text-lg text-ink mb-2">Help improve Pathlight</h3>
            <a href="https://forms.gle/fUaxKWAMbQZdbXNk7" target="_blank" rel="noopener noreferrer" className="btn-secondary inline-block mt-2">Take 2-Min Survey</a>
          </div>
          <div className="flex justify-start mt-10 pt-6 border-t border-silver">
            <button onClick={() => setSynthesisScreen(4)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"><ArrowLeft className="w-4 h-4" /> Back</button>
          </div>
        </div></div>
      );
    }
  }

  return <div className="min-h-screen bg-cream flex items-center justify-center"><p className="text-stone">Something went wrong. <button onClick={resetProgress} className="underline">Reset</button></p></div>;
}
