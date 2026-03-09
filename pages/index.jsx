import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Check, Download, Lock, FileText, Eye } from 'lucide-react';

// ─────────────────────────────────────────────
// PATHLIGHT v3 — Single conversation flow
// Landing → Intro → Consent → Screener (2 Qs) → Chat → Synthesis
// ─────────────────────────────────────────────

const TARGET_EXCHANGES = 14;
const MODEL = 'claude-sonnet-4-20250514';

export default function Pathlight() {
  const [screen, setScreen] = useState('loading');
  const [introPage, setIntroPage] = useState(0);
  const [screenerAnswers, setScreenerAnswers] = useState({});
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
      const saved = localStorage.getItem('pathlight-v3');
      const payment = localStorage.getItem('pathlight-payment');
      if (saved) {
        const d = JSON.parse(saved);
        setMessages(d.messages || []);
        setScreenerAnswers(d.screenerAnswers || {});
        setChatComplete(d.chatComplete || false);
        setSynthesisContent(d.synthesisContent || null);
        if (d.synthesisContent) {
          setScreen('synthesis');
          setParsedData(parseSynthesis(d.synthesisContent));
        } else if (d.chatComplete) {
          setScreen('synthesis');
        } else if (d.messages?.length > 0) {
          setScreen('chat');
        } else {
          setScreen('landing');
        }
      } else {
        setScreen('landing');
      }
      if (payment === 'completed') setPaymentCompleted(true);
    } catch (e) { setScreen('landing'); }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success') {
      setPaymentCompleted(true);
      localStorage.setItem('pathlight-payment', 'completed');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (!isLoading && screen === 'chat') inputRef.current?.focus(); }, [isLoading, screen]);

  const save = (ov = {}) => {
    try {
      localStorage.setItem('pathlight-v3', JSON.stringify({
        messages: ov.messages ?? messages,
        screenerAnswers: ov.screenerAnswers ?? screenerAnswers,
        chatComplete: ov.chatComplete ?? chatComplete,
        synthesisContent: ov.synthesisContent ?? synthesisContent,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {}
  };

  const resetProgress = () => {
    if (confirm('Start fresh? All progress will be cleared.')) {
      localStorage.removeItem('pathlight-v3');
      localStorage.removeItem('pathlight-payment');
      setMessages([]); setScreenerAnswers({}); setChatComplete(false);
      setSynthesisContent(null); setParsedData(null); setPaymentCompleted(false);
      setSynthesisScreen(0); setScreen('landing');
    }
  };

  // ─────────────────────────────────────────────
  // CONVERSATION ENGINE
  // ─────────────────────────────────────────────

  const buildSystemPrompt = () => {
    const userMsgCount = messages.filter(m => m.role === 'user').length;
    
    const tensionLabels = {
      identity: "they're good at their job but it doesn't feel like them anymore — focus on values, identity, what's changed",
      matching: "they know their strengths but can't find the right role — focus on transferable skills and positioning",
      discovery: "they genuinely don't know what they want — start wide, find energy and patterns first",
      barriers: "they know what they want but can't get there — focus on obstacles and strategy"
    };
    const painLabels = {
      tasks: "the pain is in the daily tasks — probe what specifically drains them",
      people: "the pain is about people, politics, or culture — probe environment and relationships",
      undervalued: "they feel undervalued — probe what they bring that isn't being seen",
      stuck: "they can't explain why they're stuck — go deeper on emotions and patterns"
    };

    return `You are having a private, one-on-one career conversation. You're a sharp, perceptive friend — warm but direct, curious but not nosy.

CONTEXT:
- Core tension: ${tensionLabels[screenerAnswers.tension] || 'unknown'}
- Where the pain is: ${painLabels[screenerAnswers.pain] || 'unknown'}

YOUR GOAL: Over ~${TARGET_EXCHANGES} exchanges, understand them deeply enough to generate a career clarity report. Explore these territories naturally:

1. ENERGY — What energizes vs drains them. Process vs outcome. Work and life.
2. STRENGTHS — What they're naturally good at but undervalue. What others come to them for.
3. WINS — What they've accomplished, overcome, felt proud of.
4. IDEAL — Perfect work life: schedule, environment, money, autonomy, impact.
5. DEAL-BREAKERS — What's made them miserable. Specific moments.

RULES:
- NEVER announce topics. Don't say "let's talk about strengths now." Flow naturally.
- ONE question at a time. 2-4 sentences max per response.
- Reference their actual words back to them.
- Push for specifics warmly. Not "tell me more" but "walk me through that moment."
- Surface contradictions gently. These are gold.
- Read between the lines. Note patterns they can't see.
- Don't over-validate. Be like a mate at a pub — direct, warm, occasionally challenging.
- By message ~8, you should have touched at least 3 territories.

CONVERSATION STATE: User message ${userMsgCount + 1} of ~${TARGET_EXCHANGES}.

${userMsgCount === 0 ? `THIS IS THE START. Open with:
- Brief acknowledgment of their situation (don't quote the screener back)
- ONE specific question tailored to their tension
- 2-3 sentences. Warm, not gushy. Don't introduce yourself or explain the process.` : ''}
${userMsgCount >= TARGET_EXCHANGES - 3 && userMsgCount < TARGET_EXCHANGES - 1 ? `NEARING THE END. Weave any uncovered territories naturally into your response.` : ''}
${userMsgCount >= TARGET_EXCHANGES - 1 ? `FINAL RESPONSE. Reflect one key pattern (1-2 sentences). Say "I've got a really clear picture of you now." End warmly. Add on its own line: [CONVERSATION_COMPLETE]` : ''}`;
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
        body: JSON.stringify({ model: MODEL, max_tokens: 400, system: buildSystemPrompt(), messages: updated })
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
          model: MODEL, max_tokens: 300, system: buildSystemPrompt(),
          messages: [{ role: 'user', content: '[Starting conversation]' }]
        })
      });
      const data = await r.json();
      const initial = [{ role: 'assistant', content: data.content[0].text }];
      setMessages(initial);
      save({ messages: initial, screenerAnswers });
    } catch (e) { console.error('Start error:', e); }
    finally { setIsLoading(false); }
  };

  // ─────────────────────────────────────────────
  // SYNTHESIS (two API calls)
  // ─────────────────────────────────────────────

  const generateSynthesis = async () => {
    if (synthesisContent) { setParsedData(parseSynthesis(synthesisContent)); return; }
    setSynthesisGenerating(true);

    try {
      const transcript = messages.map(m => `${m.role === 'user' ? 'THEM' : 'PATHLIGHT'}: ${m.content}`).join('\n\n');
      const ctx = `SCREENER:\n- Tension: ${screenerAnswers.tension}\n- Pain: ${screenerAnswers.pain}\n\nCONVERSATION:\n${transcript}`;

      // Call 1: Profile + Strengths + Combinations
      const p1 = `You are analyzing a career reflection conversation to create a personalized report.

${ctx}

Read carefully. Find PATTERNS and CONNECTIONS they can't see. Cross-reference everything.

FORMAT AS MARKDOWN.

## Your Profile

200 words max. NOT a summary — an ANALYSIS.
- Open with the core pattern across everything they shared
- Name their drive orientation (commercial, craft/mastery, builder, people/impact)
- Identify one blindspot they can't see
- End with specific encouragement referencing their situation
- Make them think "how did it know that?"

## Your Signature Strengths

EXACTLY 4 strengths. Specific combinations of abilities — not generic skills.
Names must describe what they DO: "The Invisible Architect" not "Strategic Thinker"

For each:
### **[Name]**

2-3 sentences referencing SPECIFIC things they said.

*How to deploy this:*

**This week:** [Specific action for their situation]

**In interviews:** Say: "[First-person sentence using their achievements]"

**Roles that value this:** [3-4 specific roles]

**Why employers pay for this:** [Business impact, one sentence]

After all 4:

**Why these matter together:**
[2-3 sentences. "Most people who can do X can't do Y. You can."]

**Your unique value proposition:**
"[First-person LinkedIn headline / elevator pitch]"

## Your Strength Combinations

3 most powerful pairs:

### [Strength A] + [Strength B]
**What this unlocks:** [1-2 sentences]
**Where this is rare:** [Why most people have one not both]
**Role types that need this:** [2-3 roles]

[Repeat for 2 more]

**Your rarest combination:** [Which pairing and why]`;

      const r1 = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: p1, messages: [{ role: 'user', content: 'Create my profile, signature strengths, and strength combinations.' }] })
      });
      const part1 = (await r1.json()).content[0].text;

      // Call 2: Deal-breakers + Territories + Career Narrative
      const p2 = `Complete this career report. Part 1 is done.

${ctx}

PART 1:
${part1}

## Your Deal-Breakers

*If a role has these, you'll end up miserable again.*

3 MAX per category. 10 words or less each. Only include categories they mentioned.

**❌ About the work:**
- [From their words]

**❌ What comes with the job:**
- [If mentioned]

**❌ About leadership:**
- [If mentioned]

**❌ About the environment:**
- [If mentioned]

## Role Territories to Explore

5 specific territories. Match to strengths, respect deal-breakers.

For each:
**[Specific Territory]**

*Why this fits you:* [2-3 sentences connecting specific strengths to role requirements]
*What transfers:* [Specific skills]
*Salary range:* [AUD]
*Search these:* "[Title 1]", "[Title 2]", "[Title 3]"
*Respects your deal-breakers:* [Which ones] ✓

## Your Career Narrative

### Your LinkedIn Narrative
[150 words max. First person. What they DO not their title. No buzzwords. Authentic to their voice.]

### Your 30-Second Introduction
[2-3 sentences for networking]`;

      const r2 = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: 2500, system: p2, messages: [{ role: 'user', content: 'Create my deal-breakers, territories, and career narrative.' }] })
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
  // PARSER
  // ─────────────────────────────────────────────

  const parseSynthesis = (content) => {
    if (!content) return null;
    const s = { profile: '', superpowers: [], superpowersSummary: { whyTogether: '', valueProp: '' },
      strengthCombos: [], dealbreakers: { work: [], job: [], leadership: [], environment: [] },
      territories: [], careerNarrative: '', shortIntro: '' };

    try {
      const pm = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths|$)/);
      if (pm) s.profile = pm[1].trim();

      const ss = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations|$)/);
      if (ss) {
        const ft = ss[1];
        ft.split(/\n### /).forEach(block => {
          if (!block.trim()) return;
          const nm = block.split('\n')[0].match(/\*\*([^*]+)\*\*/);
          if (!nm) return;
          const name = nm[1];
          if (name.includes('Why these') || name.includes('Your unique')) return;
          let desc = '', di = 1, lines = block.split('\n');
          while (di < lines.length && !lines[di].trim()) di++;
          let dl = [];
          for (let i = di; i < lines.length && !lines[i].includes('*How to deploy'); i++) {
            if (lines[i].trim()) dl.push(lines[i].trim());
          }
          desc = dl.join(' ');
          const hts = block.indexOf('*How to deploy this:*');
          if (hts !== -1) {
            let hte = block.length;
            const wi = block.indexOf('**Why these');
            if (wi !== -1 && wi > hts) hte = wi;
            const ht = block.substring(hts + '*How to deploy this:*'.length, hte).trim();
            if (name && desc) s.superpowers.push({ name, description: desc, howTo: ht });
          }
        });
        const wm = ft.match(/\*\*Why these matter together:\*\*([\s\S]*?)(?=\*\*Your unique value|$)/);
        if (wm) s.superpowersSummary.whyTogether = wm[1].trim();
        const vp = ft.match(/\*\*Your unique value proposition:\*\*\s*\n?"([^"]+)"/);
        if (vp) s.superpowersSummary.valueProp = vp[1];
      }

      const cs = content.match(/## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers|$)/);
      if (cs) {
        cs[1].split(/\n### /).forEach(block => {
          if (!block.trim()) return;
          const title = block.split('\n')[0].replace(/\*\*/g, '').trim();
          if (!title || title.includes('Your rarest')) return;
          const body = block.split('\n').slice(1).filter(l => l.trim()).join('\n');
          if (title && body) s.strengthCombos.push({ title, body });
        });
        const rm = cs[1].match(/\*\*Your rarest combination:\*\*([\s\S]*?)$/);
        if (rm) s.strengthCombos.push({ title: 'Your Rarest Combination', body: rm[1].trim(), isHighlight: true });
      }

      const ds = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories|$)/);
      if (ds) {
        const extract = (p) => { const m = ds[1].match(p); return m ? m[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim()) : []; };
        s.dealbreakers.work = extract(/\*\*❌ About the work:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        s.dealbreakers.job = extract(/\*\*❌ What comes with the job:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        s.dealbreakers.leadership = extract(/\*\*❌ About leadership:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        s.dealbreakers.environment = extract(/\*\*❌ About the environment:\*\*\n([\s\S]*?)(?=\n\*|$)/);
      }

      const ts = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative|$)/);
      if (ts) {
        ts[1].split(/\n(?=\*\*[A-Z])/).forEach(block => {
          const nm = block.match(/\*\*([^*]+)\*\*/);
          if (nm && block.length > 50) s.territories.push({ name: nm[1], content: block.substring(nm[0].length).trim() });
        });
      }

      const cn = content.match(/### Your LinkedIn Narrative\n\n?([\s\S]*?)(?=\n### Your 30-Second|$)/);
      if (cn) s.careerNarrative = cn[1].trim();
      const si = content.match(/### Your 30-Second Introduction\n\n?([\s\S]*?)$/);
      if (si) s.shortIntro = si[1].trim();
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

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════

  if (screen === 'loading') {
    return <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-charcoal border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  // ── LANDING ──
  if (screen === 'landing') {
    return (
      <div className="landing-dark">
        <div className="text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute flashlight-glow" style={{
              width: '400px', height: '400px',
              background: 'radial-gradient(circle, rgba(255,252,245,0.15) 0%, rgba(255,252,245,0.05) 40%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(30px)',
            }} />
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl flashlight-text relative z-10" style={{ fontWeight: 400, color: '#FFFCF5' }}>
              Pathlight
            </h1>
          </div>
          <p className="text-stone text-lg md:text-xl mt-8 fade-in-delayed font-light">Find clarity in your career</p>
          <button onClick={() => { setScreen('intro'); setIntroPage(0); }}
            className="mt-12 fade-in-delayed bg-transparent border border-stone/50 text-cream px-8 py-3 rounded hover:bg-white/5 hover:border-stone transition-all font-sans font-light tracking-wide">
            Begin
          </button>
          <p className="mt-6 text-stone/60 text-sm fade-in-delayed font-light">20 minutes. Private.</p>
        </div>
      </div>
    );
  }

  // ── INTRO PAGE 1 ──
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
              <strong className="text-ink font-medium">Before we start:</strong> This works like a conversation 
              with a sharp friend who sees your blind spots. The more honest and specific you are, the 
              more useful your report will be. Give yourself 20 minutes somewhere quiet.
            </p>
          </div>

          <div className="flex items-center justify-end mt-12 pt-8 border-t border-silver">
            <button onClick={() => setIntroPage(1)} className="btn-primary inline-flex items-center gap-3">
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── INTRO PAGE 2: What you'll get ──
  if (screen === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-6 font-medium">After one conversation</p>
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-12">What you'll walk away with</h2>
          <div className="space-y-0 stagger-children">
            {['Your signature strengths — named and actionable',
              'Deal-breakers you should never compromise on',
              'Role territories that actually fit how you work',
              'A career narrative ready for LinkedIn'
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4 py-5 border-b border-silver last:border-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal text-cream text-sm font-medium flex items-center justify-center">{idx + 1}</span>
                <p className="text-lg text-graphite pt-1 font-light">{text}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-12">
            <button onClick={() => setIntroPage(0)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light">
              <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
            </button>
            <button onClick={() => setScreen('consent')} className="btn-primary inline-flex items-center gap-3">
              Let's start <ArrowRight className="w-5 h-5" />
            </button>
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
            <div className="w-10 h-10 rounded-full bg-linen flex items-center justify-center border border-silver">
              <Lock className="w-5 h-5 text-ash" />
            </div>
            <div>
              <h1 className="font-serif text-xl text-ink">Before we begin</h1>
              <p className="text-sm text-stone font-light">Your privacy is protected</p>
            </div>
          </div>
          <div className="bg-linen rounded-xl p-5 mb-8 border border-silver">
            <p className="text-sm text-graphite leading-relaxed font-light">
              Your data stays on your device. Responses are processed by AI to generate insights. We don't store your information on our servers.
            </p>
          </div>
          <div className="space-y-3">
            {[{ key: 'terms', text: 'I understand this is a self-reflection tool, not professional career advice' },
              { key: 'age', text: 'I am 18 years of age or older' },
              { key: 'data', text: 'I understand my responses will be processed by AI' }
            ].map(item => (
              <label key={item.key} className="flex items-start gap-4 cursor-pointer group p-4 rounded-lg border border-silver hover:border-ash transition-colors bg-paper">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${consentChecks[item.key] ? 'bg-charcoal border-charcoal' : 'border-silver bg-white'}`}>
                    {consentChecks[item.key] && <Check className="w-3 h-3 text-cream" />}
                  </div>
                  <input type="checkbox" checked={consentChecks[item.key]} onChange={e => setConsentChecks({...consentChecks, [item.key]: e.target.checked})} className="sr-only" />
                </div>
                <span className="text-sm text-graphite leading-relaxed font-light">{item.text}</span>
              </label>
            ))}
          </div>
          <div className="mt-8">
            <button onClick={() => setScreen('screener')} disabled={!ok}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${ok ? 'btn-primary' : 'bg-silver text-stone cursor-not-allowed'}`}>
              {ok ? 'Continue' : 'Please agree to all items'}
            </button>
            <p className="text-xs text-stone text-center mt-4 font-light">
              See our <a href="/privacy" className="text-ash hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREENER (2 questions) ──
  if (screen === 'screener') {
    const questions = [
      { id: 'tension', question: "What's the core tension for you right now?", options: [
        { key: 'identity', label: "I'm good at my job but it doesn't feel like me anymore" },
        { key: 'matching', label: "I know my strengths but can't find the right role" },
        { key: 'discovery', label: "I genuinely don't know what I want" },
        { key: 'barriers', label: "I know what I want but can't get there" },
      ]},
      { id: 'pain', question: "Where's the pain?", options: [
        { key: 'tasks', label: "The actual work I do every day" },
        { key: 'people', label: "The people, politics, or culture" },
        { key: 'undervalued', label: "I'm undervalued — wrong level, pay, or recognition" },
        { key: 'stuck', label: "I just feel stuck and can't explain why" },
      ]},
    ];
    const allAnswered = questions.every(q => screenerAnswers[q.id]);

    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
          <span className="font-serif text-lg text-ink">Pathlight</span>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-xl w-full space-y-12 stagger-children">
            {questions.map(q => (
              <div key={q.id} className="text-center">
                <h3 className="font-serif text-xl lg:text-2xl text-ink mb-6">{q.question}</h3>
                <div className="flex flex-col gap-2">
                  {q.options.map(opt => (
                    <button key={opt.key} onClick={() => {
                      const updated = { ...screenerAnswers, [q.id]: opt.key };
                      setScreenerAnswers(updated);
                      save({ screenerAnswers: updated });
                    }}
                      className={`px-5 py-3 rounded-lg text-sm font-light transition-all text-left ${
                        screenerAnswers[q.id] === opt.key ? 'bg-charcoal text-cream' : 'bg-linen hover:bg-silver text-graphite border border-silver'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {allAnswered && (
              <div className="text-center pt-4">
                <button onClick={startChat} className="btn-primary inline-flex items-center gap-3">
                  Start the conversation <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── CHAT ──
  if (screen === 'chat') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        {/* Minimal header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
          <span className="font-serif text-lg text-ink">Pathlight</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone font-light flex items-center gap-1">
              <Lock className="w-3 h-3" /> Private
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                  <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="message-ai">
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-2 h-2 bg-stone rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-stone rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-stone rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input or "Generate" CTA */}
        <div className="border-t border-silver bg-paper p-4">
          <div className="max-w-2xl mx-auto">
            {chatComplete ? (
              <div className="text-center py-2">
                <button onClick={() => { setScreen('synthesis'); generateSynthesis(); }}
                  className="btn-primary inline-flex items-center gap-3 w-full justify-center">
                  {synthesisGenerating ? (
                    <><div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" /> Generating your report...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Generate My Report</>
                  )}
                </button>
                <p className="text-xs text-stone mt-2 font-light">This takes about 30 seconds</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <input ref={inputRef} type="text" value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your response..."
                  className="input flex-1" disabled={isLoading} />
                <button onClick={sendMessage} disabled={isLoading || !userInput.trim()}
                  className="bg-charcoal hover:bg-ink disabled:bg-silver disabled:text-stone text-cream px-5 rounded-lg transition-all flex items-center justify-center"
                  aria-label="Send">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-2 flex items-center justify-end text-xs text-stone font-light border-t border-silver">
          <button onClick={resetProgress} className="hover:text-ink transition-colors">Clear data</button>
        </footer>
      </div>
    );
  }

  // ── SYNTHESIS SCREENS ──
  if (screen === 'synthesis') {
    // Still generating
    if (synthesisGenerating || (!parsedData && !synthesisContent)) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <div className="text-center fade-in-up">
            <Sparkles className="w-12 h-12 text-ash mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-ink mb-4">Building your report</h2>
            <p className="text-graphite font-light mb-6">Analyzing your conversation...</p>
            <div className="w-8 h-8 border-2 border-charcoal border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone mt-4">This takes about 30 seconds</p>
          </div>
        </div>
      );
    }

    // If we have content but haven't parsed it yet
    if (synthesisContent && !parsedData) {
      setParsedData(parseSynthesis(synthesisContent));
      return null;
    }

    if (!parsedData) return null;

    // Screen 0: Profile
    if (synthesisScreen === 0) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <div className="bg-linen rounded-lg p-4 mb-8 text-sm text-graphite border border-silver font-light">
              These insights are AI-generated to help you reflect. Use them as a starting point.
            </div>
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Your Profile</p>
            <h2 className="font-serif text-3xl text-ink mb-8">Here's what we see in you</h2>
            <div className="text-lg text-graphite leading-relaxed space-y-4 mb-10 font-light">
              {parsedData.profile.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <button onClick={() => setSynthesisScreen(1)} className="btn-primary inline-flex items-center gap-3">
              See Your Signature Strengths <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    // Screen 1: Strengths (1 free + 3 locked) + payment wall
    if (synthesisScreen === 1 && parsedData.superpowers?.length > 0) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Signature Strengths</p>
            <h2 className="font-serif text-3xl text-ink mb-3">What you've been bringing to the table</h2>
            <p className="text-graphite mb-10 font-light">Strengths you undervalue because they come naturally.</p>

            {/* First strength — free preview */}
            <div className="bg-paper border border-silver rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-charcoal text-cream font-medium flex items-center justify-center">1</div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-ink mb-2">{parsedData.superpowers[0].name}</h3>
                  <p className="text-graphite leading-relaxed font-light">{parsedData.superpowers[0].description}</p>
                </div>
              </div>
            </div>

            {/* Locked strengths */}
            {parsedData.superpowers.slice(1, 4).map((pw, idx) => (
              <div key={idx} className="relative mb-4">
                <div className="bg-linen rounded-xl p-6 opacity-40 blur-[2px]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-silver" />
                    <div><h3 className="font-serif text-xl text-ink mb-2">{pw.name}</h3>
                      <p className="text-graphite font-light">{pw.description.substring(0, 60)}...</p></div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-paper rounded-lg px-4 py-2 shadow-md flex items-center gap-2 border border-silver">
                    <Lock className="w-4 h-4 text-stone" /><span className="text-sm text-graphite">Locked</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Payment wall */}
            {!paymentCompleted && (
              <div className="bg-charcoal rounded-xl p-8 text-center mt-10">
                <FileText className="w-10 h-10 mx-auto mb-4 text-white/80" />
                <h3 className="font-serif text-2xl mb-3 text-white">Unlock Your Full Report</h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto font-light">
                  All 4 strengths with deployment guides, strength combinations, deal-breakers, role territories, and your career narrative.
                </p>
                <a href="/example-report" target="_blank" className="mb-6 text-white/70 hover:text-white underline text-sm inline-flex items-center gap-2 mx-auto font-light">
                  <Eye className="w-4 h-4" /> See example report
                </a>
                <div className="mb-6"><span className="text-4xl font-serif text-white">$39</span><span className="text-white/60 ml-1">AUD</span></div>
                <button onClick={handlePayment} className="bg-white text-charcoal px-8 py-3 rounded-lg font-medium hover:bg-cream transition-colors inline-flex items-center gap-2">
                  Unlock Full Report <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-white/50 mt-4 font-light">Secure payment via Stripe</p>
              </div>
            )}

            {paymentCompleted && (
              <div className="bg-paper border border-charcoal rounded-xl p-6 text-center mt-10">
                <Check className="w-10 h-10 mx-auto mb-3 text-charcoal" />
                <h3 className="font-serif text-xl mb-2">Report Unlocked</h3>
                <p className="text-graphite mb-4 font-light text-sm">Continue to explore your full results.</p>
              </div>
            )}

            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button onClick={() => setSynthesisScreen(0)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {paymentCompleted && (
                <button onClick={() => setSynthesisScreen(2)} className="btn-primary inline-flex items-center gap-2">
                  Strength Combinations <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Screen 2: Strength Combinations (paid)
    if (synthesisScreen === 2 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Strength Combinations</p>
            <h2 className="font-serif text-3xl text-ink mb-3">Where your strengths multiply</h2>
            <p className="text-graphite mb-8 font-light">Individual strengths are useful. Combinations make you irreplaceable.</p>
            <div className="space-y-4">
              {parsedData.strengthCombos.map((c, i) => (
                <div key={i} className={`bg-paper border rounded-lg p-5 ${c.isHighlight ? 'border-charcoal' : 'border-silver'}`}>
                  <h3 className="font-serif text-lg text-ink mb-2">{c.title}</h3>
                  <div className="text-graphite text-sm leading-relaxed font-light whitespace-pre-wrap">{c.body.replace(/\*\*/g, '')}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button onClick={() => setSynthesisScreen(1)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setSynthesisScreen(3)} className="btn-primary inline-flex items-center gap-2">Deal-Breakers <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      );
    }

    // Screen 3: Deal-Breakers (paid)
    if (synthesisScreen === 3 && paymentCompleted) {
      const db = parsedData.dealbreakers;
      const cats = [['About the work', db.work], ['What comes with the job', db.job], ['About leadership', db.leadership], ['About the environment', db.environment]];
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Deal-Breakers</p>
            <h2 className="font-serif text-3xl text-ink mb-3">What doesn't work for you</h2>
            <p className="text-graphite mb-8 font-light">Use this when evaluating opportunities.</p>
            <div className="space-y-4">
              {cats.map(([label, items]) => items.length > 0 && (
                <div key={label} className="bg-paper border border-silver rounded-lg p-5">
                  <h3 className="font-serif text-lg text-ink mb-3">{label}</h3>
                  <ul className="space-y-2 text-graphite text-sm font-light">
                    {items.map((item, i) => <li key={i} className="flex items-start gap-2"><span className="text-ash mt-0.5">—</span><span>{item.replace(/^- /, '')}</span></li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button onClick={() => setSynthesisScreen(2)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setSynthesisScreen(4)} className="btn-primary inline-flex items-center gap-2">Role Territories <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      );
    }

    // Screen 4: Role Territories (paid)
    if (synthesisScreen === 4 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
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
                  <div className="px-5 pb-5 text-graphite text-sm leading-relaxed border-t border-silver pt-4 font-light">{t.content}</div>
                </details>
              ))}
            </div>
            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button onClick={() => setSynthesisScreen(3)} className="flex items-center gap-2 text-stone hover:text-ink transition-colors"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setSynthesisScreen(5)} className="btn-primary inline-flex items-center gap-2">Career Narrative <ArrowRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      );
    }

    // Screen 5: Career Narrative + PDF + Feedback (paid)
    if (synthesisScreen === 5 && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Career Narrative</p>
            <h2 className="font-serif text-3xl text-ink mb-3">Your story, ready to use</h2>
            <p className="text-graphite mb-8 font-light">Copy, paste, make it yours.</p>

            {parsedData.careerNarrative && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg text-ink">LinkedIn / About</h3>
                  <button onClick={() => navigator.clipboard?.writeText(parsedData.careerNarrative)} className="text-xs text-stone hover:text-ink transition-colors">Copy</button>
                </div>
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <p className="text-graphite leading-relaxed font-light whitespace-pre-wrap">{parsedData.careerNarrative}</p>
                </div>
              </div>
            )}
            {parsedData.shortIntro && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg text-ink">30-Second Introduction</h3>
                  <button onClick={() => navigator.clipboard?.writeText(parsedData.shortIntro)} className="text-xs text-stone hover:text-ink transition-colors">Copy</button>
                </div>
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <p className="text-graphite leading-relaxed font-light whitespace-pre-wrap">{parsedData.shortIntro}</p>
                </div>
              </div>
            )}

            <div className="bg-paper border border-charcoal rounded-xl p-6 text-center mt-10">
              <FileText className="w-10 h-10 mx-auto mb-4 text-charcoal" />
              <h3 className="font-serif text-xl mb-2">Download Your Report</h3>
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
          </div>
        </div>
      );
    }
  }

  // Fallback
  return <div className="min-h-screen bg-cream flex items-center justify-center">
    <p className="text-stone">Something went wrong. <button onClick={resetProgress} className="underline">Reset</button></p>
  </div>;
}
