import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
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
    }
  }
  return { conversationText, interaction };
}

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
        const ct = choices.length > 0 ? `[Selected: ${choices.map(s => `'${s}'`).join(', ')}] ` : '';
        return `${ct}${result.custom_text}`;
      }
      return `[Selected: ${result.selected.map(s => `'${s}'`).join(', ')}]`;
    default:
      return result.text;
  }
}

// ═══════════════════════════════════════════════════════════
// INTERACTION WIDGETS
// ═══════════════════════════════════════════════════════════

function SliderWidget({ config, onSubmit }) {
  const [value, setValue] = useState(config.default || 0.5);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const trackRef = useRef(null);
  const dragging = useRef(false);

  const updateValue = (clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    setValue(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    updateValue(e.clientX);
    const onMove = (ev) => { if (dragging.current) updateValue(ev.clientX); };
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onTouchMove = (e) => { updateValue(e.touches[0].clientX); };

  if (showCustom) {
    return (
      <>
        <textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus />
        <div className="pl-interaction-submit">
          <button className="pl-btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>Send</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="pl-slider-labels">
        <span>{config.left}</span>
        <span>{config.right}</span>
      </div>
      <div className="pl-slider-track" ref={trackRef} onMouseDown={onMouseDown} onTouchStart={onMouseDown} onTouchMove={onTouchMove}>
        <div className="pl-slider-fill" style={{ width: `${value * 100}%` }} />
        <div className="pl-slider-thumb" style={{ left: `${value * 100}%` }} />
      </div>
      {config.allow_custom && <button className="pl-escape" onClick={() => setShowCustom(true)}>Neither — let me explain</button>}
      <div className="pl-interaction-submit">
        <button className="pl-btn-dark" onClick={() => onSubmit({ value })}>Submit</button>
      </div>
    </>
  );
}

function SingleSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  if (showCustom) {
    return (
      <>
        <textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus />
        <div className="pl-interaction-submit">
          <button className="pl-btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>Send</button>
        </div>
      </>
    );
  }

  return (
    <>
      {config.options.map((opt, i) => (
        <div key={i} className={`pl-choice ${selected === opt ? 'selected' : ''}`} onClick={() => setSelected(opt)}>{opt}</div>
      ))}
      {config.allow_custom && (
        <div className="pl-choice pl-choice-custom" onClick={() => setShowCustom(true)}>None of these — let me explain</div>
      )}
      <div className="pl-interaction-submit">
        <button className="pl-btn-dark" disabled={!selected} onClick={() => onSubmit({ selected })}>Submit</button>
      </div>
    </>
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
    <>
      {config.options.map((opt, i) => (
        <div key={i} className={`pl-choice ${selected.includes(opt) ? 'selected' : ''}`} onClick={() => toggle(opt)}>{opt}</div>
      ))}
      {config.allow_custom && (
        <>
          <button className="pl-escape" onClick={() => setShowCustom(!showCustom)}>{showCustom ? 'Hide' : 'Add your own'}</button>
          {showCustom && <textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus />}
        </>
      )}
      <div className="pl-interaction-submit">
        <button className="pl-btn-dark" disabled={selected.length === 0 && !customText.trim()} onClick={() => {
          const sel = showCustom && customText.trim() ? [...selected, 'custom'] : selected;
          onSubmit({ selected: sel, custom_text: customText.trim() });
        }}>Submit</button>
      </div>
    </>
  );
}

function FreeTextWidget({ config, onSubmit }) {
  const [text, setText] = useState('');
  return (
    <>
      <textarea className="pl-custom-input" placeholder={config?.placeholder || 'Type your response...'} value={text} onChange={e => setText(e.target.value)} autoFocus />
      {config?.min_hint && <p className="pl-mono-sm" style={{ marginTop: 4 }}>{config.min_hint}</p>}
      <div className="pl-interaction-submit">
        <button className="pl-btn-dark" disabled={!text.trim()} onClick={() => onSubmit({ text: text.trim() })}>Send</button>
      </div>
    </>
  );
}

function InteractionWidget({ interaction, onSubmit }) {
  return (
    <div className="pl-interaction-panel">
      <div className="pl-interaction-q">{interaction.question}</div>
      {interaction.type === 'slider' && <SliderWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'single_select' && <SingleSelectWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'multi_select' && <MultiSelectWidget config={interaction.config} onSubmit={onSubmit} />}
      {interaction.type === 'free_text' && <FreeTextWidget config={interaction.config} onSubmit={onSubmit} />}
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
  const [parsedMessages, setParsedMessages] = useState([]);
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
  const lastInteractionIdx = useRef(-1);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('payment') === 'success' || p.get('unlock') === 'true') {
      setPaymentCompleted(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
    setScreen('landing');
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [parsedMessages, isLoading]);
  useEffect(() => { if (!isLoading && screen === 'chat' && !activeInteraction) inputRef.current?.focus(); }, [isLoading, screen, activeInteraction]);

  const userMsgCount = messages.filter(m => m.role === 'user').length;

  const resetProgress = () => {
    if (confirm('Start fresh? All progress will be cleared.')) {
      setMessages([]); setParsedMessages([]); setActiveInteraction(null);
      setChatComplete(false); setSynthesisContent(null); setParsedData(null);
      setPaymentCompleted(false); setSynthesisScreen(0); setRevealStrength(null);
      setExpandedTerritories({}); lastInteractionIdx.current = -1; setScreen('landing');
    }
  };

  // ── Toggle consent (fixed) ──
  const toggleConsent = (key) => {
    setConsentChecks(prev => ({ ...prev, [key]: !prev[key] }));
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
After their first substantive response, you MAY serve an interaction to calibrate the underlying pattern — but ONLY if it's contextually relevant to what they said.

PHASE 2 — DRAINERS (messages 3-5)
What kills their energy? Get a specific situation. What exactly about it was bad? Push for the precise cause, not the general category.

PHASE 3 — STRENGTHS (messages 5-8)
What do people come to them for? What feels effortless to them but hard for others? Get specific examples. Challenge them when they downplay something.

PHASE 4 — WINS (messages 8-10)
What are they proud of? What did they overcome? What made it meaningful?

PHASE 5 — DIRECTION (messages 10-13)
Their ideal work life. Be specific: what are they doing, with whom, how much autonomy, what does a Tuesday look like?

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

slider: {"type":"slider","question":"...","config":{"left":"...","right":"...","default":0.5,"allow_custom":true}}
single_select: {"type":"single_select","question":"...","config":{"options":["...","...","..."],"allow_custom":true}}
multi_select: {"type":"multi_select","question":"...","config":{"options":["...","..."],"max_selections":2,"allow_custom":true}}
free_text: {"type":"free_text","question":"...","config":{"placeholder":"...","min_hint":"A few sentences is perfect"}}

═══ INTERACTION RULES ═══

1. NEVER serve an interaction as your opening question in a new phase. Always start each phase with an open free-text question.
2. NEVER serve generic/pre-scripted interactions. Every option must reference or connect to something the user actually said.
3. Every interaction MUST have "allow_custom": true.
4. Sliders should capture a genuine tension or spectrum. Don't create false dichotomies.
5. Maximum 4 options on any single_select or multi_select.
6. After the user responds to an interaction, acknowledge briefly and transition naturally.
7. Serve roughly 4-6 interactions across the full conversation. The rest should be pure free-text.
8. NEVER serve two interactions in a row. Always have at least one free-text exchange between interactions.

═══ HANDLING INTERACTION RESPONSES ═══

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

You need: specific stories, contradictions/tensions, their own language, clear signal on drains vs energises, concrete detail about ideal future.

═══ CONVERSATION STATE ═══

This is user message ${n + 1}. Approximate target: 13-15 user messages total.

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

  const applyGuardrails = (parsed, msgIndex) => {
    if (msgIndex === 0 && parsed.interaction) return { ...parsed, interaction: null };
    if (parsed.interaction) {
      const prevAiIdx = parsedMessages.length - 1;
      if (lastInteractionIdx.current === prevAiIdx - 1) return { ...parsed, interaction: null };
    }
    return parsed;
  };

  const callAPI = async (msgs, sys, maxTokens = 250) => {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system: sys, messages: msgs })
    });
    const data = await r.json();
    return data.content[0].text;
  };

  const startChat = async () => {
    setScreen('chat');
    setIsLoading(true);
    try {
      const text = await callAPI([{ role: 'user', content: '[Begin]' }], buildSystemPrompt(), 150);
      const parsed = parseAIResponse(text);
      const guarded = applyGuardrails(parsed, 0);
      setMessages([{ role: 'assistant', content: text }]);
      setParsedMessages([{ role: 'assistant', text: guarded.conversationText, interaction: guarded.interaction }]);
      if (guarded.interaction) { setActiveInteraction(guarded.interaction); lastInteractionIdx.current = 0; }
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
    const currentUserCount = newMsgs.filter(m => m.role === 'user').length;

    try {
      let text = await callAPI(newMsgs, buildSystemPrompt(), 300);
      if (currentUserCount >= 18 && !text.includes('[CONVERSATION_COMPLETE]')) text += '\n\n[CONVERSATION_COMPLETE]';
      const complete = text.includes('[CONVERSATION_COMPLETE]');
      const cleanedText = text.replace('[CONVERSATION_COMPLETE]', '').trim();
      const parsed = parseAIResponse(cleanedText);
      const aiMsgIdx = parsedMessages.length + 1;
      const guarded = applyGuardrails(parsed, aiMsgIdx);
      setMessages([...newMsgs, { role: 'assistant', content: cleanedText }]);
      setParsedMessages(prev => [...prev, { role: 'assistant', text: guarded.conversationText, interaction: guarded.interaction }]);
      if (guarded.interaction) { setActiveInteraction(guarded.interaction); lastInteractionIdx.current = aiMsgIdx; }
      if (complete) setChatComplete(true);
    } catch (e) { console.error('Chat error:', e); }
    finally { setIsLoading(false); }
  };

  const handleInteractionSubmit = (result) => sendMessage(formatInteractionResponse(activeInteraction, result));
  const handleTextSubmit = () => { if (userInput.trim()) sendMessage(userInput); };

  // ─────────────────────────────────────────────
  // SYNTHESIS
  // ─────────────────────────────────────────────

  const generateSynthesis = async () => {
    if (synthesisContent) { setParsedData(parseSynthesis(synthesisContent)); return; }
    setSynthesisGenerating(true);
    try {
      const transcript = messages.map(m => `${m.role === 'user' ? 'THEM' : 'PATHLIGHT'}: ${m.content}`).join('\n\n');

      const p1 = `You are analyzing a career reflection conversation to create a personalized report.

CONVERSATION:
${transcript}

Read the entire conversation. Find PATTERNS and CONNECTIONS across all five topics (energy, drainers, strengths, wins, ideal role).

FORMAT STRICTLY AS MARKDOWN. Use the exact headers below.

## Your Profile

200 words max. ANALYSIS, not summary. Open with the core pattern. Name their drive orientation. Identify one blindspot. End with specific encouragement. No markdown bold — plain prose.

## Your Signature Strengths

EXACTLY 5 strengths. Each a specific combination of abilities — not generic.

NAMING RULES: Names describe what they DO.
Good: "The Invisible Architect", "Chaos Navigator", "The Reluctant Leader"
Bad: "Strategic Thinker", "People Person", "Problem Solver"

For each strength:

### [Strength Name]

[2-3 sentences. Reference SPECIFIC things they said. Plain text.]

WHAT MAKES THIS VALUABLE:
[1-2 sentences: why businesses pay for this.]

HOW TO DEPLOY THIS:
This week: [One specific action]
In interviews: [First-person sentence using their achievements]
Best roles for this: [3-4 specific role types]

WATCH OUT:
[1-2 sentences: overuse risk. Be honest.]

---

After all 5 strengths:

WHY THESE MATTER TOGETHER:
[2-3 sentences. "Most people who can do X can't do Y. You can, because..."]

YOUR VALUE PROPOSITION:
"[One sentence, first person, for LinkedIn headline]"

## Your Strength Combinations

The 3 most powerful pairings from the 5 strengths:

### [Strength A] + [Strength B]
What this creates: [1-2 sentences]
Why it's rare: [1 sentence]
Roles that need exactly this: [2-3 roles]

### [Strength C] + [Strength D]
[Same format]

### [Strength A/B] + [Strength C/D/E]
[Same format]

RAREST COMBINATION: [1-2 sentences identifying which pairing is most unusual.]`;

      const part1 = await callAPI([{ role: 'user', content: 'Create my profile, signature strengths, and strength combinations.' }], p1, 4000);

      const p2 = `You are completing a career clarity report. Part 1 is done.

CONVERSATION:
${transcript}

PART 1:
${part1}

Generate remaining sections. No ** bold markers.

## Your Deal-Breakers

3 MAX per category. 10 words or less each. ONLY include categories with relevant examples.

DEALBREAKERS_WORK:
- [From their actual words]

DEALBREAKERS_JOB:
- [Only if mentioned]

DEALBREAKERS_LEADERSHIP:
- [Only if mentioned]

DEALBREAKERS_ENVIRONMENT:
- [Only if mentioned]

## Role Territories to Explore

5 territories. Each connects to strengths and respects deal-breakers.

### [Territory Name]

WHY THIS FITS: [2-3 sentences]
WHAT TRANSFERS: [Their specific skills]
POSSIBLE GAPS: [Be honest]
SALARY RANGE: [AUD range]
SEARCH TERMS: "[Title 1]", "[Title 2]", "[Title 3]"
RESPECTS YOUR DEAL-BREAKERS: [Which ones]

## Your Career Narrative

LINKEDIN VERSION:
[150 words max. First person. Forward-looking.]

INTRO VERSION:
[2-3 sentences for verbal networking.]`;

      const part2 = await callAPI([{ role: 'user', content: 'Create my deal-breakers, role territories, and career narrative.' }], p2, 3500);

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
      const pm = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths)/);
      if (pm) s.profile = clean(pm[1]);

      const ss = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations)/);
      if (ss) {
        const fullText = ss[1];
        const labels = ['WHAT MAKES THIS VALUABLE:', 'HOW TO DEPLOY THIS:', 'WATCH OUT:', '---'];
        fullText.split(/\n### /).filter(b => b.trim()).forEach(block => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (!name || name.includes('WHY THESE') || name.includes('YOUR VALUE')) return;
          let descLines = [], i = 1;
          while (i < lines.length && !labels.some(l => lines[i].trim().startsWith(l))) { if (lines[i].trim()) descLines.push(lines[i].trim()); i++; }
          const description = clean(descLines.join(' '));
          const getSection = (label) => { const idx = block.indexOf(label); if (idx === -1) return ''; const after = block.substring(idx + label.length); const nl = labels.find(l => l !== label && after.indexOf(l) > 0); return clean(after.substring(0, nl ? after.indexOf(nl) : after.length)); };
          const deployRaw = getSection('HOW TO DEPLOY THIS:');
          const gdf = (field) => { const m = deployRaw.match(new RegExp(field + ':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)', 's')); return m ? clean(m[1]) : ''; };
          if (name && description) s.superpowers.push({ name, description, valuable: getSection('WHAT MAKES THIS VALUABLE:'), thisWeek: gdf('This week'), inInterviews: gdf('In interviews'), bestRoles: gdf('Best roles for this'), watchOut: getSection('WATCH OUT:') });
        });
        const wtm = fullText.match(/WHY THESE MATTER TOGETHER:\n([\s\S]*?)(?=\nYOUR VALUE PROPOSITION:|$)/);
        if (wtm) s.superpowersSummary.whyTogether = clean(wtm[1]);
        const vpm = fullText.match(/YOUR VALUE PROPOSITION:\n"([^"]+)"/);
        if (vpm) s.superpowersSummary.valueProp = vpm[1];
      }

      const cs = content.match(/## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers)/);
      if (cs) {
        cs[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
          const lines = block.split('\n'); const title = clean(lines[0]); if (!title) return;
          const body = clean(lines.slice(1).filter(l => l.trim() && !l.startsWith('RAREST')).join('\n'));
          if (title && body) s.strengthCombos.push({ title, body });
        });
        const rm = cs[1].match(/RAREST COMBINATION:\s*([\s\S]*?)$/);
        if (rm) s.rarestCombo = clean(rm[1]);
      }

      const ds = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories)/);
      if (ds) {
        const dt = ds[1];
        const extractItems = (label) => { const m = dt.match(new RegExp(label + ':\\n([\\s\\S]*?)(?=\\nDEALBREAKERS_|\\n## |$)')); return m ? m[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => clean(l.replace(/^-\s*/, ''))) : []; };
        s.dealbreakers.work = extractItems('DEALBREAKERS_WORK');
        s.dealbreakers.job = extractItems('DEALBREAKERS_JOB');
        s.dealbreakers.leadership = extractItems('DEALBREAKERS_LEADERSHIP');
        s.dealbreakers.environment = extractItems('DEALBREAKERS_ENVIRONMENT');
      }

      const ts = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative)/);
      if (ts) {
        ts[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
          const lines = block.split('\n'); const name = clean(lines[0]); if (!name) return;
          const body = lines.slice(1).join('\n');
          const gf = (label) => { const m = body.match(new RegExp(label + ':\\s*(.+?)(?=\\n[A-Z]|$)', 's')); return m ? clean(m[1]) : ''; };
          s.territories.push({ name, whyFits: gf('WHY THIS FITS'), transfers: gf('WHAT TRANSFERS'), gaps: gf('POSSIBLE GAPS'), salary: gf('SALARY RANGE'), searchTerms: gf('SEARCH TERMS'), dealbreakers: gf('RESPECTS YOUR DEAL-BREAKERS') });
        });
      }

      const ln = content.match(/LINKEDIN VERSION:\n([\s\S]*?)(?=\nINTRO VERSION:)/);
      if (ln) s.careerNarrative = clean(ln[1]);
      const iv = content.match(/INTRO VERSION:\n([\s\S]*?)$/);
      if (iv) s.shortIntro = clean(iv[1]);
    } catch (e) { console.error('Parse error:', e); return null; }
    return s;
  };

  // ── Payment / PDF ──
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

  const FontLinks = () => (
    <Head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
    </Head>
  );

  // ─── Shared sub-components ───

  const Orb = ({ size = 500, opacity = 0.15 }) => (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', width: size, height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, rgba(184,169,255,${opacity}) 0%, rgba(184,169,255,0.04) 40%, transparent 70%)`,
      filter: 'blur(80px)', pointerEvents: 'none',
      animation: 'orbPulse 4s cubic-bezier(0.4,0,0.2,1) infinite alternate'
    }} />
  );

  const GridBg = ({ opacity = 0.025 }) => (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', opacity,
      backgroundImage: `linear-gradient(#F0EDE8 1px, transparent 1px), linear-gradient(90deg, #F0EDE8 1px, transparent 1px)`,
      backgroundSize: '60px 60px'
    }} />
  );

  const MonoLabel = ({ children, color }) => (
    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: color || '#B8A9FF', marginBottom: 16 }}>{children}</div>
  );

  const DisplayHeading = ({ children }) => (
    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE8', marginBottom: 24 }}>{children}</h2>
  );

  const BodyLg = ({ children, style = {} }) => (
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.0625rem', fontWeight: 300, lineHeight: 1.7, color: '#A8A4A0', ...style }}>{children}</p>
  );

  const BodyText = ({ children, style = {} }) => (
    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 300, lineHeight: 1.65, color: '#A8A4A0', ...style }}>{children}</p>
  );

  // Progress bar segments
  const totalSegments = 15;
  const filledSegments = Math.min(userMsgCount, totalSegments);

  // ═══ LOADING ═══
  if (screen === 'loading') return (
    <>
      <FontLinks />
      <style>{animCSS}</style>
      <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#B8A9FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </>
  );

  // ═══ LANDING ═══
  if (screen === 'landing') return (
    <>
      <FontLinks />
      <style>{animCSS}</style>
      <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <Orb size={600} opacity={0.12} />
        <GridBg opacity={0.025} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(3rem, 9vw, 6rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#F0EDE8', animation: 'fadeIn 1s ease forwards' }}>Pathlight</h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.0625rem', fontWeight: 300, color: '#A8A4A0', marginTop: 24, animation: 'fadeIn 1s ease 0.3s both' }}>Find clarity in your career</p>
          <div style={{ marginTop: 48, animation: 'fadeIn 1s ease 0.6s both' }}>
            <button onClick={() => { setScreen('intro'); setIntroPage(0); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#F0EDE8', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer', transition: 'all 350ms' }}>
              Begin <ArrowRight size={16} />
            </button>
          </div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 16, animation: 'fadeIn 1s ease 0.9s both' }}>20 minutes · private · ai-powered</p>
        </div>
      </div>
    </>
  );

  // ═══ INTRO 1 ═══
  if (screen === 'intro' && introPage === 0) return (
    <>
      <FontLinks />
      <style>{animCSS}</style>
      <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', overflow: 'hidden' }}>
        <GridBg opacity={0.015} />
        <div style={{ maxWidth: 560, width: '100%', position: 'relative', zIndex: 1, animation: 'slideUp 0.7s ease forwards' }}>
          <MonoLabel>before we start</MonoLabel>
          <DisplayHeading>You're here because something isn't quite right.</DisplayHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 32 }}>
            <BodyLg>Maybe you feel stuck in a role that doesn't fit anymore.</BodyLg>
            <BodyLg>Maybe you lack direction.</BodyLg>
            <BodyLg>Maybe you're ready for something bigger but don't know what.</BodyLg>
          </div>
          <BodyLg style={{ color: '#F0EDE8', marginTop: 32 }}>That's okay. You're in the right place.</BodyLg>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginTop: 32, backdropFilter: 'blur(20px)' }}>
            <BodyText>This works like a conversation with a sharp friend who sees your blind spots. The more honest and specific you are, the more useful your report will be. Give yourself 20 minutes somewhere quiet.</BodyText>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 48, paddingTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setIntroPage(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#F0EDE8', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ═══ INTRO 2 ═══
  if (screen === 'intro' && introPage === 1) {
    const items = ['Five signature strengths — uniquely named and actionable', 'Deal-breakers you should never compromise on', 'Role territories that fit how you actually work', 'A career narrative ready for LinkedIn'];
    return (
      <>
        <FontLinks />
        <style>{animCSS}</style>
        <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', overflow: 'hidden' }}>
          <GridBg opacity={0.015} />
          <div style={{ maxWidth: 560, width: '100%', position: 'relative', zIndex: 1, animation: 'slideUp 0.7s ease forwards' }}>
            <MonoLabel>after one conversation</MonoLabel>
            <DisplayHeading>What you'll walk away with</DisplayHeading>
            {items.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#B8A9FF', minWidth: 24, paddingTop: 4 }}>0{i + 1}</span>
                <BodyLg>{t}</BodyLg>
              </div>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 48, paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setIntroPage(0)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#5C5955', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', cursor: 'pointer' }}><ArrowLeft size={14} /> Back</button>
              <button onClick={() => setScreen('consent')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#F0EDE8', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Let's start <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══ CONSENT ═══
  if (screen === 'consent') {
    const allChecked = consentChecks.terms && consentChecks.age && consentChecks.data;
    const checks = [
      { key: 'terms', text: 'I agree to the Terms of Service and understand this is a self-reflection tool, not professional career advice' },
      { key: 'age', text: 'I am 18 years of age or older' },
      { key: 'data', text: 'I understand my responses will be processed by AI' }
    ];
    return (
      <>
        <FontLinks />
        <style>{animCSS}</style>
        <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', position: 'relative', overflow: 'hidden' }}>
          <GridBg opacity={0.015} />
          <div style={{ maxWidth: 520, width: '100%', position: 'relative', zIndex: 1, animation: 'slideUp 0.7s ease forwards' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <Lock size={20} style={{ color: '#5C5955' }} />
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#F0EDE8' }}>Before we begin</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', letterSpacing: '0.06em', textTransform: 'uppercase' }}>your privacy is protected</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
              <BodyText>Your data stays on your device. Responses are processed by AI to generate insights. We don't store your information on our servers.</BodyText>
            </div>

            {checks.map(item => (
              <div
                key={item.key}
                onClick={() => toggleConsent(item.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', padding: 16,
                  borderRadius: 8, border: `1px solid ${consentChecks[item.key] ? 'rgba(184,169,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  background: consentChecks[item.key] ? 'rgba(184,169,255,0.06)' : '#111113',
                  transition: 'all 150ms', marginBottom: 8
                }}
              >
                <div style={{
                  width: 20, height: 20, minWidth: 20, borderRadius: 4, marginTop: 2,
                  border: `2px solid ${consentChecks[item.key] ? '#B8A9FF' : 'rgba(255,255,255,0.1)'}`,
                  background: consentChecks[item.key] ? '#B8A9FF' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms'
                }}>
                  {consentChecks[item.key] && <Check size={12} color="#0A0A0B" />}
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 300, color: '#A8A4A0', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}

            <div style={{ marginTop: 32 }}>
              <button
                onClick={allChecked ? startChat : undefined}
                disabled={!allChecked}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '14px 36px', background: allChecked ? '#B8A9FF' : '#1A1A1D', color: allChecked ? '#0A0A0B' : '#3A3835',
                  fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 500, border: 'none', borderRadius: 4,
                  cursor: allChecked ? 'pointer' : 'not-allowed', transition: 'all 350ms'
                }}
              >
                {allChecked ? 'Start the conversation' : 'Please agree to all items'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#3A3835' }}>
                  <Link href="/privacy" style={{ color: '#5C5955', textDecoration: 'none' }}>privacy</Link>
                  {' · '}
                  <Link href="/terms" style={{ color: '#5C5955', textDecoration: 'none' }}>terms</Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══ CHAT (LIGHT MODE) ═══
  if (screen === 'chat') return (
    <>
      <FontLinks />
      <style>{animCSS}{chatCSS}</style>
      <div style={{ minHeight: '100vh', background: '#F5F5F3', display: 'flex', flexDirection: 'column', color: '#111113' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E3DF', background: '#F5F5F3', position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#111113' }}>Pathlight</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#555250', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Lock size={12} /> private</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 3, padding: '0 24px 12px', background: '#F5F5F3' }}>
          {Array.from({ length: totalSegments }).map((_, i) => (
            <div key={i} style={{ height: 2, flex: 1, borderRadius: 9999, background: i < filledSegments ? '#7B6FBF' : i === filledSegments ? '#111113' : '#E5E3DF', transition: 'background 350ms' }} />
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {parsedMessages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '14px 18px', borderRadius: 8,
                background: msg.role === 'user' ? '#111113' : '#FFFFFF',
                color: msg.role === 'user' ? '#F5F5F3' : '#111113',
                border: msg.role === 'user' ? 'none' : '1px solid #E5E3DF',
                fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.65,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: '14px 18px', background: '#FFFFFF', border: '1px solid #E5E3DF', borderRadius: 8, display: 'flex', gap: 4 }}>
                <span className="pl-dot" /><span className="pl-dot" style={{ animationDelay: '0.2s' }} /><span className="pl-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #E5E3DF', background: '#FFFFFF', padding: 16 }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {chatComplete ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <button onClick={() => { setScreen('synthesis'); generateSynthesis(); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 28px', background: '#111113', color: '#F5F5F3', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Generate My Report <ArrowRight size={16} />
                </button>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#555250', marginTop: 8 }}>takes about 45 seconds</p>
              </div>
            ) : activeInteraction ? (
              <InteractionWidget interaction={activeInteraction} onSubmit={handleInteractionSubmit} />
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                  placeholder="Type your response..."
                  disabled={isLoading}
                  style={{ flex: 1, padding: '12px 16px', background: '#F5F5F3', border: '1px solid #E5E3DF', borderRadius: 4, fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', color: '#111113', outline: 'none' }}
                />
                <button onClick={handleTextSubmit} disabled={isLoading || !userInput.trim()} style={{ padding: '12px 16px', background: '#111113', color: '#F5F5F3', border: 'none', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: (!userInput.trim() || isLoading) ? 0.2 : 1 }}>
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 24px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E3DF', background: '#F5F5F3', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#555250' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/privacy" style={{ color: '#555250', textDecoration: 'none' }}>privacy</Link>
            <Link href="/terms" style={{ color: '#555250', textDecoration: 'none' }}>terms</Link>
          </div>
          <button onClick={resetProgress} style={{ background: 'none', border: 'none', color: '#555250', fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', cursor: 'pointer' }}>clear data</button>
        </div>
      </div>
    </>
  );

  // ═══ STRENGTH REVEAL ═══
  if (screen === 'reveal' && revealStrength) {
    const idx = parsedData.superpowers.indexOf(revealStrength);
    return (
      <>
        <FontLinks />
        <style>{animCSS}</style>
        <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px', position: 'relative', overflow: 'hidden' }}>
          <Orb size={400} opacity={0.2} />
          <GridBg opacity={0.03} />
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5C5955', zIndex: 1, opacity: 0, animation: 'rFade 0.6s ease 0.2s forwards' }}>strength_{String(idx + 1).padStart(2, '0')} of 05</div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B8A9FF', margin: '24px 0', zIndex: 1, opacity: 0, animation: 'rFade 0.6s ease 0.5s forwards' }}>Your Signature Strength</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: '#F0EDE8', zIndex: 1, opacity: 0, animation: 'rSlideUp 1s ease 0.8s forwards' }}>{revealStrength.name}</div>
          <div style={{ width: 32, height: 2, background: '#B8A9FF', margin: '24px auto', zIndex: 1, opacity: 0, animation: 'rExpand 0.5s ease 1.4s forwards' }} />
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.0625rem', fontWeight: 300, lineHeight: 1.7, color: '#A8A4A0', maxWidth: 420, zIndex: 1, opacity: 0, animation: 'rFade 0.8s ease 1.7s forwards' }}>{revealStrength.description}</div>
          <div style={{ marginTop: 48, zIndex: 1, opacity: 0, animation: 'rFade 0.6s ease 2.2s forwards' }}>
            <button onClick={() => { setRevealStrength(null); setScreen('synthesis'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#F0EDE8', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  // ═══ SYNTHESIS (DARK MODE) ═══
  if (screen === 'synthesis') {
    // Loading
    if (synthesisGenerating || (!parsedData && !synthesisContent)) return (
      <>
        <FontLinks />
        <style>{animCSS}</style>
        <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <Orb size={400} opacity={0.2} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <MonoLabel>analyzing your conversation</MonoLabel>
            <DisplayHeading>Building your report</DisplayHeading>
            <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#B8A9FF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#3A3835', marginTop: 24 }}>this takes about 45 seconds</p>
          </div>
        </div>
      </>
    );

    if (synthesisContent && !parsedData) { setParsedData(parseSynthesis(synthesisContent)); return null; }
    if (!parsedData) return null;

    // Shared report wrapper
    const ReportWrap = ({ children }) => (
      <>
        <FontLinks />
        <style>{animCSS}</style>
        <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#F0EDE8' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px', animation: 'slideUp 0.7s ease forwards' }}>
            {children}
          </div>
        </div>
      </>
    );

    const NavRow = ({ onBack, onNext, nextLabel }) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {onBack ? <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#5C5955', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', cursor: 'pointer' }}><ArrowLeft size={14} /> Back</button> : <div />}
        {onNext ? <button onClick={onNext} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#F0EDE8', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>{nextLabel} <ArrowRight size={16} /></button> : <div />}
      </div>
    );

    // Screen 0: Profile
    if (synthesisScreen === 0) return (
      <ReportWrap>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 32 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955' }}>ai-generated insights to help you reflect</p>
        </div>
        <MonoLabel>your profile</MonoLabel>
        <DisplayHeading>Here's what we see in you</DisplayHeading>
        <div style={{ marginTop: 8 }}>
          {parsedData.profile.split('\n').filter(p => p.trim()).map((p, i) => (
            <BodyLg key={i} style={{ marginBottom: 16 }}>{p}</BodyLg>
          ))}
        </div>
        <NavRow onNext={() => { if (parsedData.superpowers[0]) { setRevealStrength(parsedData.superpowers[0]); setScreen('reveal'); } else setSynthesisScreen(1); }} nextLabel="See Your Strengths" />
      </ReportWrap>
    );

    // Screen 1: Strengths
    if (synthesisScreen === 1) {
      const StrengthCard = ({ pw, num }) => (
        <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 20 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#B8A9FF', paddingTop: 4 }}>{String(num).padStart(2, '0')}</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.375rem, 3vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', color: '#F0EDE8', marginBottom: 4 }}>{pw.name}</div>
              <BodyText>{pw.description}</BodyText>
            </div>
          </div>
          {paymentCompleted && (
            <div style={{ padding: 24, display: 'grid', gap: 20 }}>
              {pw.valuable && <div><div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FFB88C', marginBottom: 4 }}>What makes this valuable</div><BodyText>{pw.valuable}</BodyText></div>}
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B8A9FF', marginBottom: 8 }}>How to deploy this</div>
                {pw.thisWeek && <BodyText style={{ marginBottom: 8 }}><strong style={{ color: '#F0EDE8', fontWeight: 500 }}>This week:</strong> {pw.thisWeek}</BodyText>}
                {pw.inInterviews && <BodyText style={{ marginBottom: 8 }}><strong style={{ color: '#F0EDE8', fontWeight: 500 }}>In interviews:</strong> {pw.inInterviews}</BodyText>}
                {pw.bestRoles && <BodyText><strong style={{ color: '#F0EDE8', fontWeight: 500 }}>Best roles:</strong> {pw.bestRoles}</BodyText>}
              </div>
              {pw.watchOut && <div><div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FF8F8F', marginBottom: 4 }}>Watch out</div><BodyText>{pw.watchOut}</BodyText></div>}
            </div>
          )}
        </div>
      );

      const LockedCard = ({ pw, num }) => (
        <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ filter: 'blur(6px)', opacity: 0.25, userSelect: 'none', display: 'flex', gap: 20 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#B8A9FF' }}>{String(num).padStart(2, '0')}</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 700, color: '#F0EDE8', marginBottom: 4 }}>{pw.name}</div>
              <BodyText>{pw.description?.substring(0, 60)}...</BodyText>
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#1A1A1D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <Lock size={12} /> unlock full report
            </div>
          </div>
        </div>
      );

      return (
        <ReportWrap>
          <MonoLabel>signature strengths</MonoLabel>
          <DisplayHeading>What you've been bringing to the table</DisplayHeading>
          <BodyText style={{ marginBottom: 32 }}>Strengths you undervalue because they come naturally.</BodyText>

          {paymentCompleted ? (
            <>
              {parsedData.superpowers.slice(0, 5).map((pw, i) => <StrengthCard key={i} pw={pw} num={i + 1} />)}
              {parsedData.superpowersSummary.whyTogether && (
                <div style={{ marginTop: 32 }}><MonoLabel>why these matter together</MonoLabel><BodyLg style={{ marginTop: 8 }}>{parsedData.superpowersSummary.whyTogether}</BodyLg></div>
              )}
              {parsedData.superpowersSummary.valueProp && (
                <div style={{ background: '#111113', border: '1px solid rgba(184,169,255,0.3)', borderRadius: 12, padding: 24, textAlign: 'center', marginTop: 24, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #B8A9FF, transparent)' }} />
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 500, color: '#F0EDE8', fontStyle: 'italic' }}>"{parsedData.superpowersSummary.valueProp}"</p>
                </div>
              )}
            </>
          ) : (
            <>
              {parsedData.superpowers.slice(0, 2).map((pw, i) => <StrengthCard key={i} pw={pw} num={i + 1} />)}
              {parsedData.superpowers.slice(2, 5).map((pw, i) => <LockedCard key={i} pw={pw} num={i + 3} />)}

              {/* Paywall */}
              <div style={{ background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '64px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', marginTop: 32 }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 300, background: 'radial-gradient(ellipse, rgba(184,169,255,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
                <GridBg opacity={0.02} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <MonoLabel>2 of 5 strengths revealed</MonoLabel>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', color: '#F0EDE8', lineHeight: 1.1, marginBottom: 16 }}>There's more to<br />your story</h3>
                  <BodyText style={{ maxWidth: 380, margin: '0 auto 32px' }}>Your full report reveals the complete picture — the patterns, the rare combinations, and where to take them next.</BodyText>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 300, margin: '0 auto 32px', textAlign: 'left' }}>
                    {['All 5 bespoke strengths with deployment guides', 'Rare strength combinations', 'Deal-breakers checklist', '5 role territories to explore', 'Career narrative for LinkedIn', 'Downloadable PDF report'].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', color: '#A8A4A0', fontWeight: 300 }}>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#B8A9FF', flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: '#F0EDE8' }}>$39</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', marginLeft: 4, verticalAlign: 'super' }}>AUD</span>
                  </div>
                  <button onClick={handlePayment} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: '#B8A9FF', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    Unlock Full Report <ArrowRight size={16} />
                  </button>
                  <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#3A3835', marginTop: 24 }}>encrypted payment via stripe · data stays on your device</p>
                </div>
              </div>
            </>
          )}

          <NavRow onBack={() => setSynthesisScreen(0)} onNext={paymentCompleted ? () => setSynthesisScreen(2) : null} nextLabel="Strength Combinations" />
        </ReportWrap>
      );
    }

    // Screen 2: Combinations
    if (synthesisScreen === 2 && paymentCompleted) return (
      <ReportWrap>
        <MonoLabel>strength combinations</MonoLabel>
        <DisplayHeading>Where your strengths multiply</DisplayHeading>
        <BodyText style={{ marginBottom: 32 }}>Individual strengths are useful. Combinations make you irreplaceable.</BodyText>
        {parsedData.strengthCombos.map((c, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 12, backdropFilter: 'blur(20px)' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 8 }}>{c.title}</div>
            <BodyText style={{ whiteSpace: 'pre-wrap' }}>{c.body}</BodyText>
          </div>
        ))}
        {parsedData.rarestCombo && (
          <div style={{ background: '#111113', border: '1px solid rgba(184,169,255,0.3)', borderRadius: 12, padding: 24, position: 'relative', overflow: 'hidden', marginTop: 8 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #B8A9FF, transparent)' }} />
            <MonoLabel>your rarest combination</MonoLabel>
            <BodyText>{parsedData.rarestCombo}</BodyText>
          </div>
        )}
        <NavRow onBack={() => setSynthesisScreen(1)} onNext={() => setSynthesisScreen(3)} nextLabel="Deal-Breakers" />
      </ReportWrap>
    );

    // Screen 3: Deal-breakers
    if (synthesisScreen === 3 && paymentCompleted) {
      const db = parsedData.dealbreakers;
      const cats = [['About the work', db.work], ['What comes with the job', db.job], ['About leadership', db.leadership], ['About the environment', db.environment]];
      return (
        <ReportWrap>
          <MonoLabel>deal-breakers</MonoLabel>
          <DisplayHeading>What doesn't work for you</DisplayHeading>
          <BodyText style={{ marginBottom: 32 }}>Use this when evaluating opportunities.</BodyText>
          {cats.map(([label, items]) => items.length > 0 && (
            <div key={label} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 16 }}>{label}</div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ color: '#FF8F8F', fontFamily: "'Space Mono', monospace", fontSize: '0.8125rem' }}>—</span>
                  <BodyText>{item}</BodyText>
                </div>
              ))}
            </div>
          ))}
          <NavRow onBack={() => setSynthesisScreen(2)} onNext={() => setSynthesisScreen(4)} nextLabel="Role Territories" />
        </ReportWrap>
      );
    }

    // Screen 4: Territories
    if (synthesisScreen === 4 && paymentCompleted) return (
      <ReportWrap>
        <MonoLabel>role territories</MonoLabel>
        <DisplayHeading>Paths to explore</DisplayHeading>
        <BodyText style={{ marginBottom: 32 }}>Directions, not prescriptions. Tap to expand.</BodyText>
        {parsedData.territories.map((t, i) => (
          <div key={i} style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
            <div onClick={() => setExpandedTerritories(prev => ({ ...prev, [i]: !prev[i] }))} style={{ padding: '20px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8' }}>{t.name}</span>
              <ChevronRight size={18} style={{ color: '#5C5955', transform: expandedTerritories[i] ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }} />
            </div>
            {expandedTerritories[i] && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
                {[['Why this fits', t.whyFits, '#B8A9FF'], ['What transfers', t.transfers, '#FFB88C'], ['Possible gaps', t.gaps, '#FF8F8F'], ['Salary range', t.salary, '#5C5955'], ['Search terms', t.searchTerms, '#5C5955'], ['Respects your deal-breakers', t.dealbreakers, '#8CCFB8']].map(([label, val, color]) => val && (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color, marginBottom: 4 }}>{label}</div>
                    <BodyText>{val}</BodyText>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <NavRow onBack={() => setSynthesisScreen(3)} onNext={() => setSynthesisScreen(5)} nextLabel="Career Narrative" />
      </ReportWrap>
    );

    // Screen 5: Career Narrative + PDF
    if (synthesisScreen === 5 && paymentCompleted) return (
      <ReportWrap>
        <MonoLabel>career narrative</MonoLabel>
        <DisplayHeading>Your story, ready to use</DisplayHeading>
        <BodyText style={{ marginBottom: 32 }}>Copy, paste, make it yours.</BodyText>

        {parsedData.careerNarrative && (
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8' }}>LinkedIn / About</span>
              <button onClick={() => navigator.clipboard?.writeText(parsedData.careerNarrative)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>copy</button>
            </div>
            <BodyLg style={{ whiteSpace: 'pre-wrap' }}>{parsedData.careerNarrative}</BodyLg>
          </div>
        )}

        {parsedData.shortIntro && (
          <div style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8' }}>30-Second Introduction</span>
              <button onClick={() => navigator.clipboard?.writeText(parsedData.shortIntro)} style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>copy</button>
            </div>
            <BodyLg style={{ whiteSpace: 'pre-wrap' }}>{parsedData.shortIntro}</BodyLg>
          </div>
        )}

        <div style={{ background: '#111113', border: '1px solid rgba(184,169,255,0.3)', borderRadius: 12, padding: 32, textAlign: 'center', marginTop: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #B8A9FF, transparent)' }} />
          <FileText size={32} style={{ color: '#B8A9FF', marginBottom: 16 }} />
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 8 }}>Download Your Report</div>
          <button onClick={downloadPDF} disabled={pdfDownloading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', background: '#B8A9FF', color: '#0A0A0B', fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 500, border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 12, opacity: pdfDownloading ? 0.5 : 1 }}>
            {pdfDownloading ? 'Generating...' : <><Download size={16} /> Download PDF</>}
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 24, textAlign: 'center', marginTop: 16 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 500, color: '#F0EDE8', marginBottom: 8 }}>Help improve Pathlight</div>
          <a href="https://forms.gle/fUaxKWAMbQZdbXNk7" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'transparent', color: '#F0EDE8', fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, textDecoration: 'none', marginTop: 8 }}>Take 2-Min Survey</a>
        </div>

        <NavRow onBack={() => setSynthesisScreen(4)} />
      </ReportWrap>
    );
  }

  // Fallback
  return (
    <>
      <FontLinks />
      <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5C5955' }}>
        <p>Something went wrong. <button onClick={resetProgress} style={{ color: '#B8A9FF', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button></p>
      </div>
    </>
  );
}

// ═══ ANIMATION CSS (injected via <style>) ═══
const animCSS = `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes orbPulse { from { transform: translate(-50%,-50%) scale(0.9); opacity: 0.6; } to { transform: translate(-50%,-50%) scale(1.1); opacity: 1; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes rSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes rExpand { from { opacity: 0; width: 0; } to { opacity: 1; width: 32px; } }
@keyframes dotPulse { 0%,80%,100% { opacity:0.3; transform:scale(0.8); } 40% { opacity:1; transform:scale(1); } }
`;

const chatCSS = `
.pl-dot { width:7px; height:7px; border-radius:50%; background:#555250; display:inline-block; animation: dotPulse 1.4s ease-in-out infinite; }
.pl-interaction-panel { background:#FFFFFF; border:1px solid #E5E3DF; border-radius:16px; padding:24px; }
.pl-interaction-q { font-family:'Syne',sans-serif; font-size:clamp(1.125rem,2.5vw,1.25rem); font-weight:600; color:#111113; letter-spacing:-0.02em; line-height:1.25; margin-bottom:20px; }
.pl-choice { background:#FFFFFF; border:1px solid #E5E3DF; border-radius:8px; padding:14px 18px; margin-bottom:8px; cursor:pointer; transition:all 150ms; font-family:'Inter',sans-serif; font-size:0.9375rem; color:#555250; user-select:none; }
.pl-choice:hover { border-color:#D0CEC9; transform:translateX(4px); }
.pl-choice.selected { border-color:#111113; background:#111113; color:#F5F5F3; font-weight:500; }
.pl-choice-custom { font-style:italic; }
.pl-slider-labels { display:flex; justify-content:space-between; font-family:'Space Mono',monospace; font-size:0.6875rem; color:#555250; margin-bottom:12px; gap:16px; }
.pl-slider-labels span { max-width:45%; }
.pl-slider-track { width:100%; height:3px; background:#E5E3DF; border-radius:9999px; position:relative; margin:24px 0; cursor:pointer; }
.pl-slider-fill { position:absolute; left:0; top:0; height:100%; background:#111113; border-radius:9999px; }
.pl-slider-thumb { position:absolute; top:50%; transform:translate(-50%,-50%); width:18px; height:18px; background:#111113; border:3px solid #F5F5F3; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.15); cursor:grab; }
.pl-slider-thumb:active { cursor:grabbing; }
.pl-escape { font-family:'Space Mono',monospace; font-size:0.6875rem; color:#555250; cursor:pointer; background:none; border:none; padding:8px 0; text-decoration:underline; text-underline-offset:3px; }
.pl-escape:hover { color:#111113; }
.pl-custom-input { margin-top:12px; width:100%; padding:12px 16px; background:#F5F5F3; border:1px solid #E5E3DF; border-radius:4px; font-family:'Inter',sans-serif; font-size:0.9375rem; color:#111113; outline:none; resize:none; min-height:80px; }
.pl-custom-input:focus { border-color:#111113; }
.pl-interaction-submit { margin-top:16px; display:flex; justify-content:flex-end; }
.pl-btn-dark { display:inline-flex; align-items:center; gap:8px; padding:12px 28px; background:#111113; color:#F5F5F3; font-family:'Inter',sans-serif; font-size:0.8125rem; font-weight:500; border:none; border-radius:4px; cursor:pointer; }
.pl-btn-dark:disabled { opacity:0.3; cursor:not-allowed; }
.pl-mono-sm { font-family:'Space Mono',monospace; font-size:0.6875rem; color:#555250; }
`;
