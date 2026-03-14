import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Send, ArrowRight, ArrowLeft, Check, Lock, FileText, Download, ChevronRight } from 'lucide-react';

const MODEL = 'claude-sonnet-4-20250514';
const STORAGE_KEY = 'pathlight-v5';
const PAYMENT_KEY = 'pathlight-payment';

const clean = (t) => t ? t.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^#+\s*/gm, '').trim() : '';

function parseAIResponse(text) {
  const m = text.match(/:::interaction\n([\s\S]*?)\n:::/);
  const conversationText = text.replace(/:::interaction\n[\s\S]*?\n:::/, '').trim();
  let interaction = null;
  if (m) { try { interaction = JSON.parse(m[1]); } catch (e) { interaction = null; } }
  return { conversationText, interaction };
}

function formatInteractionResponse(ix, result) {
  if (ix.type === 'slider') return result.selected === 'custom' ? result.custom_text : `[Slider: ${result.value.toFixed(2)} on spectrum from '${ix.config.left}' to '${ix.config.right}']`;
  if (ix.type === 'single_select') return result.selected === 'custom' ? result.custom_text : `[Selected: '${result.selected}']`;
  if (ix.type === 'multi_select') {
    if (result.selected.includes('custom')) { const c = result.selected.filter(s => s !== 'custom'); return (c.length ? `[Selected: ${c.map(s=>`'${s}'`).join(', ')}] ` : '') + result.custom_text; }
    return `[Selected: ${result.selected.map(s=>`'${s}'`).join(', ')}]`;
  }
  return result.text;
}

function SliderWidget({ config, onSubmit }) {
  const [value, setValue] = useState(config.default || 0.5);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const update = (cx) => { if (!trackRef.current) return; const r = trackRef.current.getBoundingClientRect(); setValue(Math.max(0, Math.min(1, (cx - r.left) / r.width))); };
  const onDown = (e) => { dragging.current = true; update(e.clientX || e.touches?.[0]?.clientX); const mv = (ev) => { if (dragging.current) update(ev.clientX); }; const up = () => { dragging.current = false; window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up); };
  if (showCustom) return (<><textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus /><div className="pl-interaction-submit"><button className="pl-btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>Send</button></div></>);
  return (<><div className="pl-slider-labels"><span>{config.left}</span><span style={{ textAlign: 'right' }}>{config.right}</span></div><div className="pl-slider-track" ref={trackRef} onMouseDown={onDown} onTouchStart={(e) => update(e.touches[0].clientX)} onTouchMove={(e) => update(e.touches[0].clientX)}><div className="pl-slider-fill" style={{ width: `${value*100}%` }} /><div className="pl-slider-thumb" style={{ left: `${value*100}%` }} /></div>{config.allow_custom && <button className="pl-escape" onClick={() => setShowCustom(true)}>Neither — let me explain</button>}<div className="pl-interaction-submit"><button className="pl-btn-dark" onClick={() => onSubmit({ value })}>Submit</button></div></>);
}

function SingleSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  if (showCustom) return (<><textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus /><div className="pl-interaction-submit"><button className="pl-btn-dark" disabled={!customText.trim()} onClick={() => onSubmit({ selected: 'custom', custom_text: customText.trim() })}>Send</button></div></>);
  return (<>{config.options.map((o,i) => <div key={i} className={`pl-choice${selected===o?' selected':''}`} onClick={() => setSelected(o)}>{o}</div>)}{config.allow_custom && <div className="pl-choice pl-choice-custom" onClick={() => setShowCustom(true)}>None of these — let me explain</div>}<div className="pl-interaction-submit"><button className="pl-btn-dark" disabled={!selected} onClick={() => onSubmit({ selected })}>Submit</button></div></>);
}

function MultiSelectWidget({ config, onSubmit }) {
  const [selected, setSelected] = useState([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const max = config.max_selections || 4;
  const toggle = (o) => selected.includes(o) ? setSelected(selected.filter(s=>s!==o)) : selected.length<max && setSelected([...selected, o]);
  return (<>{config.options.map((o,i) => <div key={i} className={`pl-choice${selected.includes(o)?' selected':''}`} onClick={() => toggle(o)}>{o}</div>)}{config.allow_custom && <><button className="pl-escape" onClick={() => setShowCustom(!showCustom)}>{showCustom?'Hide':'Add your own'}</button>{showCustom && <textarea className="pl-custom-input" placeholder="Tell me in your own words..." value={customText} onChange={e => setCustomText(e.target.value)} autoFocus />}</>}<div className="pl-interaction-submit"><button className="pl-btn-dark" disabled={selected.length===0 && !customText.trim()} onClick={() => { const s = showCustom && customText.trim() ? [...selected,'custom'] : selected; onSubmit({ selected: s, custom_text: customText.trim() }); }}>Submit</button></div></>);
}

function InteractionWidget({ interaction, onSubmit }) {
  return (<div className="pl-interaction-panel"><div className="pl-interaction-q">{interaction.question}</div>{interaction.type==='slider' && <SliderWidget config={interaction.config} onSubmit={onSubmit} />}{interaction.type==='single_select' && <SingleSelectWidget config={interaction.config} onSubmit={onSubmit} />}{interaction.type==='multi_select' && <MultiSelectWidget config={interaction.config} onSubmit={onSubmit} />}</div>);
}

const S = {
  mono: { fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase' },
  display: { fontFamily: "'Syne', sans-serif", fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#F0EDE8' },
  heading: { fontFamily: "'Syne', sans-serif", fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#F0EDE8' },
  subhead: { fontFamily: "'Syne', sans-serif", fontWeight: 500, lineHeight: 1.35, letterSpacing: '-0.01em', color: '#F0EDE8' },
  bodyLg: { fontFamily: "'Inter', sans-serif", fontSize: '1.0625rem', fontWeight: 300, lineHeight: 1.7, color: '#C0BCB7' },
  body: { fontFamily: "'Inter', sans-serif", fontSize: '0.9375rem', fontWeight: 300, lineHeight: 1.65, color: '#B5B1AC' },
  small: { fontFamily: "'Inter', sans-serif", fontSize: '0.8125rem', fontWeight: 300, lineHeight: 1.5, color: '#807C78' },
};

const Orb = ({s=500,o=0.15}) => <div style={{position:'absolute',top:'50%',left:'50%',width:s,height:s,transform:'translate(-50%,-50%)',background:`radial-gradient(circle, rgba(184,169,255,${o}) 0%, rgba(184,169,255,0.04) 40%, transparent 70%)`,filter:'blur(80px)',pointerEvents:'none',animation:'orbPulse 4s ease infinite alternate'}} />;
const Grid = ({o=0.025}) => <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:o,backgroundImage:'linear-gradient(#F0EDE8 1px, transparent 1px), linear-gradient(90deg, #F0EDE8 1px, transparent 1px)',backgroundSize:'60px 60px'}} />;
const MonoLabel = ({children,color='#B8A9FF'}) => <div style={{...S.mono,color,marginBottom:16}}>{children}</div>;
const DisplayH = ({children,size}) => <h2 style={{...S.display,fontSize:size||'clamp(2rem, 5vw, 3rem)',marginBottom:24}}>{children}</h2>;
const NavRow = ({onBack,onNext,nextLabel}) => <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:48,paddingTop:32}}>{onBack?<button onClick={onBack} style={{display:'inline-flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#5C5955',...S.small,cursor:'pointer'}}><ArrowLeft size={14}/> Back</button>:<div/>}{onNext?<button onClick={onNext} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',background:'#F0EDE8',color:'#0A0A0B',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>{nextLabel} <ArrowRight size={16}/></button>:<div/>}</div>;

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
  const [consentChecks, setConsentChecks] = useState({terms:false,age:false,data:false});
  const [revealStrength, setRevealStrength] = useState(null);
  const [expandedTerritories, setExpandedTerritories] = useState({});
  const [hadInteractionLast, setHadInteractionLast] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const save = (ov={}) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages:ov.messages??messages, chatComplete:ov.chatComplete??chatComplete, synthesisContent:ov.synthesisContent??synthesisContent, parsedMessages:ov.parsedMessages??parsedMessages, hadInteractionLast:ov.hadInteractionLast??hadInteractionLast, ts:Date.now() })); } catch(e){} };

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get('payment')==='success'||p.get('unlock')==='true') { localStorage.setItem(PAYMENT_KEY,'done'); setPaymentCompleted(true); window.history.replaceState({},'',window.location.pathname); }
      if (localStorage.getItem(PAYMENT_KEY)==='done') setPaymentCompleted(true);

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setMessages(d.messages||[]); setParsedMessages(d.parsedMessages||[]); setChatComplete(d.chatComplete||false); setSynthesisContent(d.synthesisContent||null); setHadInteractionLast(d.hadInteractionLast||false);
        if (d.synthesisContent) { setScreen('synthesis'); setParsedData(parseSynthesis(d.synthesisContent)); }
        else if (d.chatComplete) setScreen('synthesis');
        else if (d.messages?.length>0) setScreen('chat');
        else setScreen('landing');
      } else setScreen('landing');
    } catch(e) { setScreen('landing'); }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [parsedMessages,isLoading]);
  useEffect(() => { if (!isLoading && screen==='chat' && !activeInteraction) inputRef.current?.focus(); }, [isLoading,screen,activeInteraction]);

  const userMsgCount = messages.filter(m=>m.role==='user').length;

  const resetProgress = () => { if (confirm('Start fresh? All progress will be cleared.')) { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(PAYMENT_KEY); setMessages([]); setParsedMessages([]); setActiveInteraction(null); setChatComplete(false); setSynthesisContent(null); setParsedData(null); setPaymentCompleted(false); setSynthesisScreen(0); setRevealStrength(null); setExpandedTerritories({}); setHadInteractionLast(false); setScreen('landing'); } };

  const buildSystemPrompt = () => {
    const n = userMsgCount;
    return `You are having a private career conversation with someone. You're perceptive, warm, and direct — like a sharp friend who happens to be unnervingly good at reading people.

YOUR JOB: Systematically explore 5 territories through natural conversation. You need rich, specific, personal information to generate a career clarity report that feels eerily accurate.

PHASE 1 — ENERGY (messages 1-3): What makes time disappear? Get a specific story.
PHASE 2 — DRAINERS (messages 3-5): What kills energy? Get a specific situation and precise cause.
PHASE 3 — STRENGTHS (messages 5-8): What do people come to them for? Challenge when they downplay.
PHASE 4 — WINS (messages 8-10): What are they proud of? What made it meaningful?
PHASE 5 — DIRECTION (messages 10-13): Ideal work life — what, with whom, autonomy, a Tuesday.

RESPONSE FORMAT:
PART 1 (required): ONE question, max 2-3 sentences. Reference their words. No advice.
PART 2 (optional): Interaction block when you have a hypothesis to test.

:::interaction
{ valid JSON }
:::

Types: slider, single_select, multi_select. All must have "allow_custom": true. Max 4 options.

RULES:
1. NEVER interaction on first message of a new phase
2. Options must connect to what user said
3. NEVER two interactions in a row
4. ~4-6 interactions total, rest free-text
5. After interaction response, acknowledge briefly and move on

User message ${n+1} of ~13-15 target.

${n===0?`OPENING. Ask: "What kind of work makes time disappear for you? Not what you think you should enjoy — what actually pulls you in so deep you forget to check the clock?" NO interaction block.`:''}
${n>=11&&n<13?'WRAPPING UP. Check all 5 phases covered. No interactions.':''}
${n>=13?'FINAL. One sentence reflecting core pattern. "I\'ve got a really clear picture of you now." On own line: [CONVERSATION_COMPLETE]':''}

SHORT responses. Questions, not advice.`;
  };

  const callAPI = async (msgs,sys,mt=250) => { const r = await fetch('/api/claude',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,max_tokens:mt,system:sys,messages:msgs})}); const data = await r.json(); if (data?.content?.[0]?.text) return data.content[0].text; if (data?.error) { console.error('API error:', data.error); throw new Error(data.error.message || 'API error'); } console.error('Unexpected API response:', data); throw new Error('Unexpected API response'); };

  const startChat = async () => { setScreen('chat'); setIsLoading(true); try { const text = await callAPI([{role:'user',content:'[Begin]'}],buildSystemPrompt(),150); const {conversationText} = parseAIResponse(text); const rm=[{role:'user',content:'[Begin]'},{role:'assistant',content:text}]; const pm=[{role:'assistant',text:conversationText}]; setMessages(rm); setParsedMessages(pm); setHadInteractionLast(false); save({messages:rm,parsedMessages:pm,hadInteractionLast:false}); } catch(e){console.error(e);} finally{setIsLoading(false);} };

  const sendMessage = async (content) => {
    if (!content?.trim()||isLoading||chatComplete) return;
    const userMsg=content.trim(); const newMsgs=[...messages,{role:'user',content:userMsg}]; const newParsed=[...parsedMessages,{role:'user',text:userMsg}];
    setMessages(newMsgs); setParsedMessages(newParsed); setUserInput(''); setActiveInteraction(null); setIsLoading(true);
    const cc=newMsgs.filter(m=>m.role==='user').length;
    try {
      let text = await callAPI(newMsgs,buildSystemPrompt(),300);
      if (cc>=18 && !text.includes('[CONVERSATION_COMPLETE]')) text+='\n\n[CONVERSATION_COMPLETE]';
      const complete=text.includes('[CONVERSATION_COMPLETE]'); const cleaned=text.replace('[CONVERSATION_COMPLETE]','').trim();
      const {conversationText,interaction}=parseAIResponse(cleaned);
      const useIx=interaction && !hadInteractionLast;
      const fm=[...newMsgs,{role:'assistant',content:cleaned}]; const fp=[...newParsed,{role:'assistant',text:conversationText,interaction:useIx?interaction:null}];
      setMessages(fm); setParsedMessages(fp); setHadInteractionLast(!!useIx);
      if (useIx) setActiveInteraction(interaction);
      if (complete) setChatComplete(true);
      save({messages:fm,parsedMessages:fp,chatComplete:complete,hadInteractionLast:!!useIx});
    } catch(e){console.error(e);} finally{setIsLoading(false);}
  };

  const handleInteractionSubmit = (r) => sendMessage(formatInteractionResponse(activeInteraction,r));
  const handleTextSubmit = () => { if (userInput.trim()) sendMessage(userInput); };

  const generateSynthesis = async () => {
    if (synthesisContent) { setParsedData(parseSynthesis(synthesisContent)); return; }
    setSynthesisGenerating(true);
    try {
      const transcript = messages.map(m=>`${m.role==='user'?'THEM':'PATHLIGHT'}: ${m.content}`).join('\n\n');
      const part1 = await callAPI([{role:'user',content:'Create my profile, signature strengths, and strength combinations.'}], `You are analyzing a career reflection conversation.\n\nCONVERSATION:\n${transcript}\n\nFind PATTERNS across all five topics.\n\n## Your Profile\n\n200 words. Analysis not summary. Core pattern, drive orientation, one blindspot, encouragement. No bold.\n\n## Your Signature Strengths\n\nEXACTLY 5. Specific combinations not generic.\nNaming: "The Invisible Architect", "Chaos Navigator" — not "Strategic Thinker".\n\nFor each:\n\n### [Name]\n\n[2-3 sentences referencing what they said.]\n\nWHAT MAKES THIS VALUABLE:\n[1-2 sentences]\n\nHOW TO DEPLOY THIS:\nThis week: [action]\nIn interviews: [first-person sentence]\nBest roles for this: [3-4 roles]\n\nWATCH OUT:\n[1-2 sentences]\n\n---\n\nAfter all 5:\n\nWHY THESE MATTER TOGETHER:\n[2-3 sentences]\n\nYOUR VALUE PROPOSITION:\n"[One sentence, first person]"\n\n## Your Strength Combinations\n\n3 pairings:\n\n### [A] + [B]\nWhat this creates: [1-2 sentences]\nWhy it\'s rare: [1 sentence]\nRoles that need this: [2-3]\n\nRAREST COMBINATION: [1-2 sentences]`, 4000);
      const part2 = await callAPI([{role:'user',content:'Create my deal-breakers, role territories, and career narrative.'}], `Completing report.\n\nCONVERSATION:\n${transcript}\n\nPART 1:\n${part1}\n\nNo bold.\n\n## Your Deal-Breakers\n\n3 MAX per category. 10 words each.\n\nDEALBREAKERS_WORK:\n- [item]\n\nDEALBREAKERS_JOB:\n- [if mentioned]\n\nDEALBREAKERS_LEADERSHIP:\n- [if mentioned]\n\nDEALBREAKERS_ENVIRONMENT:\n- [if mentioned]\n\n## Role Territories to Explore\n\n5 territories:\n\n### [Name]\n\nWHY THIS FITS: [2-3 sentences]\nWHAT TRANSFERS: [skills]\nPOSSIBLE GAPS: [honest]\nSALARY RANGE: [AUD]\nSEARCH TERMS: "[T1]", "[T2]", "[T3]"\nRESPECTS YOUR DEAL-BREAKERS: [which]\n\n## Your Career Narrative\n\nLINKEDIN VERSION:\n[150 words, first person]\n\nINTRO VERSION:\n[2-3 sentences]`, 3500);
      const full = part1+'\n\n'+part2;
      setSynthesisContent(full); setParsedData(parseSynthesis(full)); save({synthesisContent:full});
    } catch(e){console.error(e);} finally{setSynthesisGenerating(false);}
  };

  const parseSynthesis = (content) => {
    if (!content) return null;
    const s={profile:'',superpowers:[],superpowersSummary:{whyTogether:'',valueProp:''},strengthCombos:[],rarestCombo:'',dealbreakers:{work:[],job:[],leadership:[],environment:[]},territories:[],careerNarrative:'',shortIntro:''};
    try {
      const pm=content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths)/); if(pm) s.profile=clean(pm[1]);
      const ss=content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations)/);
      if(ss){const ft=ss[1];const labels=['WHAT MAKES THIS VALUABLE:','HOW TO DEPLOY THIS:','WATCH OUT:','---'];ft.split(/\n### /).filter(b=>b.trim()).forEach(block=>{const lines=block.split('\n');const name=clean(lines[0]);if(!name||name.includes('WHY THESE')||name.includes('YOUR VALUE'))return;let dl=[],i=1;while(i<lines.length&&!labels.some(l=>lines[i].trim().startsWith(l))){if(lines[i].trim())dl.push(lines[i].trim());i++;}const gs=(l)=>{const ix=block.indexOf(l);if(ix===-1)return'';const a=block.substring(ix+l.length);const nl=labels.find(x=>x!==l&&a.indexOf(x)>0);return clean(a.substring(0,nl?a.indexOf(nl):a.length));};const dr=gs('HOW TO DEPLOY THIS:');const gdf=(f)=>{const m=dr.match(new RegExp(f+':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)','s'));return m?clean(m[1]):'';};if(name)s.superpowers.push({name,description:clean(dl.join(' ')),valuable:gs('WHAT MAKES THIS VALUABLE:'),thisWeek:gdf('This week'),inInterviews:gdf('In interviews'),bestRoles:gdf('Best roles for this'),watchOut:gs('WATCH OUT:')});});const wt=ft.match(/WHY THESE MATTER TOGETHER:\n([\s\S]*?)(?=\nYOUR VALUE PROPOSITION:|$)/);if(wt)s.superpowersSummary.whyTogether=clean(wt[1]);const vp=ft.match(/YOUR VALUE PROPOSITION:\n"([^"]+)"/);if(vp)s.superpowersSummary.valueProp=vp[1];}
      const cs=content.match(/## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers)/);if(cs){cs[1].split(/\n### /).filter(b=>b.trim()).forEach(b=>{const l=b.split('\n');const t=clean(l[0]);if(t)s.strengthCombos.push({title:t,body:clean(l.slice(1).filter(x=>x.trim()&&!x.startsWith('RAREST')).join('\n'))});});const rm=cs[1].match(/RAREST COMBINATION:\s*([\s\S]*?)$/);if(rm)s.rarestCombo=clean(rm[1]);}
      const ds=content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories)/);if(ds){const dt=ds[1];const ei=(l)=>{const m=dt.match(new RegExp(l+':\\n([\\s\\S]*?)(?=\\nDEALBREAKERS_|\\n## |$)'));return m?m[1].trim().split('\n').filter(x=>x.trim().startsWith('-')).map(x=>clean(x.replace(/^-\s*/,''))):[]; };s.dealbreakers={work:ei('DEALBREAKERS_WORK'),job:ei('DEALBREAKERS_JOB'),leadership:ei('DEALBREAKERS_LEADERSHIP'),environment:ei('DEALBREAKERS_ENVIRONMENT')};}
      const ts=content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative)/);if(ts){ts[1].split(/\n### /).filter(b=>b.trim()).forEach(b=>{const l=b.split('\n');const nm=clean(l[0]);if(!nm)return;const bd=l.slice(1).join('\n');const gf=(lb)=>{const m=bd.match(new RegExp(lb+':\\s*(.+?)(?=\\n[A-Z]|$)','s'));return m?clean(m[1]):'';};s.territories.push({name:nm,whyFits:gf('WHY THIS FITS'),transfers:gf('WHAT TRANSFERS'),gaps:gf('POSSIBLE GAPS'),salary:gf('SALARY RANGE'),searchTerms:gf('SEARCH TERMS'),dealbreakers:gf('RESPECTS YOUR DEAL-BREAKERS')});});}
      const ln=content.match(/LINKEDIN VERSION:\n([\s\S]*?)(?=\nINTRO VERSION:)/);if(ln)s.careerNarrative=clean(ln[1]);
      const iv=content.match(/INTRO VERSION:\n([\s\S]*?)$/);if(iv)s.shortIntro=clean(iv[1]);
    } catch(e){console.error(e);return null;}
    return s;
  };

  const handlePayment = async () => { try { const r=await fetch('/api/stripe-checkout',{method:'POST',headers:{'Content-Type':'application/json'}}); window.location.href=(await r.json()).url; } catch(e){alert('Payment failed.');} };
  const downloadPDF = async () => { if(!synthesisContent)return; setPdfDownloading(true); try { const r=await fetch('/api/generate-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({synthesisContent})}); if(!r.ok)throw new Error(); const b=await r.blob();const u=window.URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='pathlight-career-report.pdf';document.body.appendChild(a);a.click();document.body.removeChild(a);window.URL.revokeObjectURL(u); } catch(e){alert('PDF generation failed.');} finally{setPdfDownloading(false);} };

  const Fonts = () => <Head><title>Pathlight</title></Head>;
  const Dark = ({children,center}) => <div className="pl-screen-enter" style={{minHeight:'100vh',background:'#0A0A0B',display:'flex',flexDirection:'column',alignItems:center?'center':'stretch',justifyContent:center?'center':'flex-start',position:'relative',overflow:'hidden',padding:center?'48px 24px':0}}>{children}</div>;

  if (screen==='loading') return <><Fonts/><Dark center><div style={{width:32,height:32,border:'2px solid rgba(255,255,255,0.1)',borderTopColor:'#B8A9FF',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/></Dark></>;

  if (screen==='landing') return (<><Fonts/><Dark center><Orb s={700} o={0.18}/><div style={{position:'absolute',top:'30%',left:'50%',transform:'translateX(-50%)',width:300,height:200,background:'radial-gradient(ellipse, rgba(255,184,140,0.06) 0%, transparent 70%)',filter:'blur(80px)',pointerEvents:'none'}}/><Grid o={0.03}/><div style={{textAlign:'center',zIndex:1}}><h1 style={{...S.display,fontSize:'clamp(4rem,12vw,8rem)',fontWeight:800,letterSpacing:'-0.05em',opacity:0,animation:'rSlideUp 1.2s ease 0.2s forwards'}}>Pathlight</h1><p style={{...S.bodyLg,marginTop:32,opacity:0,animation:'fadeIn 1s ease 0.8s forwards'}}>Find clarity in your career</p><div style={{marginTop:56,opacity:0,animation:'fadeIn 0.8s ease 1.4s forwards'}}><button onClick={()=>{setScreen('intro');setIntroPage(0);}} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 32px',background:'#F0EDE8',color:'#0A0A0B',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer',transition:'all 350ms'}}>Begin <ArrowRight size={16}/></button></div><p style={{...S.mono,color:'#5C5955',marginTop:20,opacity:0,animation:'fadeIn 0.8s ease 1.8s forwards'}}>20 minutes · private · ai-powered</p></div></Dark></>);

  if (screen==='intro'&&introPage===0) return (<><Fonts/><Dark center><Orb s={400} o={0.08}/><Grid o={0.02}/><div style={{maxWidth:560,width:'100%',zIndex:1}}><MonoLabel color="#5C5955">before we start</MonoLabel><h2 style={{...S.display,fontSize:'clamp(2.25rem,6vw,3.5rem)',marginBottom:8,opacity:0,animation:'rSlideUp 0.8s ease 0.1s forwards'}}>You're here because</h2><h2 style={{...S.display,fontSize:'clamp(2.25rem,6vw,3.5rem)',color:'#B8A9FF',marginBottom:32,opacity:0,animation:'rSlideUp 0.8s ease 0.25s forwards'}}>something isn't quite right.</h2><div style={{display:'flex',flexDirection:'column',gap:24,marginTop:40}}>{ ['Maybe you feel stuck in a role that doesn\'t fit anymore.','Maybe you lack direction.','Maybe you\'re ready for something bigger but don\'t know what.'].map((t,i)=><p key={i} style={{...S.bodyLg,fontSize:'1.125rem',opacity:0,animation:`fadeIn 0.7s ease ${0.5+i*0.2}s forwards`}}>{t}</p>)}</div><p style={{...S.bodyLg,color:'#F0EDE8',fontSize:'1.125rem',marginTop:40,opacity:0,animation:'fadeIn 0.7s ease 1.2s forwards'}}>That's okay. You're in the right place.</p><div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:24,marginTop:40,opacity:0,animation:'fadeIn 0.7s ease 1.5s forwards'}}><p style={{...S.body,color:'#5C5955'}}>This works like a conversation with a sharp friend who sees your blind spots. The more honest and specific you are, the more useful your report will be.</p></div><div style={{marginTop:56,display:'flex',justifyContent:'flex-end',opacity:0,animation:'fadeIn 0.6s ease 1.8s forwards'}}><button onClick={()=>setIntroPage(1)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 32px',background:'#F0EDE8',color:'#0A0A0B',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>Continue <ArrowRight size={16}/></button></div></div></Dark></>);

  if (screen==='intro'&&introPage===1) return (<><Fonts/><Dark center><Orb s={350} o={0.06}/><Grid o={0.02}/><div style={{maxWidth:560,width:'100%',zIndex:1}}><MonoLabel color="#5C5955">after one conversation</MonoLabel><DisplayH>What you'll walk away with</DisplayH>{[{t:'Five signature strengths — uniquely named and actionable',c:'#B8A9FF'},{t:'Deal-breakers you should never compromise on',c:'#FF8F8F'},{t:'Role territories that fit how you actually work',c:'#8CCFB8'},{t:'A career narrative ready for LinkedIn',c:'#FFB88C'}].map((item,i)=><div key={i} style={{display:'flex',alignItems:'flex-start',gap:20,padding:'24px 0',opacity:0,animation:`fadeIn 0.6s ease ${0.2+i*0.15}s forwards`}}><span style={{...S.mono,color:item.c,minWidth:24,paddingTop:4,fontSize:'0.75rem'}}>0{i+1}</span><p style={{...S.bodyLg,fontSize:'1.0625rem'}}>{item.t}</p></div>)}<div style={{marginTop:56,display:'flex',justifyContent:'space-between',alignItems:'center',opacity:0,animation:'fadeIn 0.6s ease 1s forwards'}}><button onClick={()=>setIntroPage(0)} style={{display:'inline-flex',alignItems:'center',gap:6,background:'none',border:'none',color:'#5C5955',...S.small,cursor:'pointer'}}><ArrowLeft size={14}/> Back</button><button onClick={()=>setScreen('consent')} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 32px',background:'#F0EDE8',color:'#0A0A0B',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>Let's start <ArrowRight size={16}/></button></div></div></Dark></>);

  if (screen==='consent'){const ok=consentChecks.terms&&consentChecks.age&&consentChecks.data;return(<><Fonts/><Dark center><Orb s={350} o={0.06}/><Grid o={0.02}/><div className="pl-screen-enter" style={{maxWidth:520,width:'100%',zIndex:1}}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:32}}><Lock size={20} style={{color:'#5C5955'}}/><div><div style={{...S.heading,fontSize:'1.375rem'}}>Before we begin</div><div style={{...S.mono,color:'#5C5955',marginTop:4}}>your privacy is protected</div></div></div><div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:12,padding:24,marginBottom:32}}><p style={{...S.body,color:'#5C5955'}}>Your data stays on your device. Responses are processed by AI to generate insights. We don't store your information on our servers.</p></div>{[{key:'terms',text:'I agree to the Terms of Service and understand this is a self-reflection tool, not professional career advice'},{key:'age',text:'I am 18 years of age or older'},{key:'data',text:'I understand my responses will be processed by AI'}].map((item)=><div key={item.key} onClick={()=>setConsentChecks(p=>({...p,[item.key]:!p[item.key]}))} style={{display:'flex',alignItems:'flex-start',gap:16,cursor:'pointer',padding:16,borderRadius:8,border:`1px solid ${consentChecks[item.key]?'rgba(184,169,255,0.3)':'rgba(255,255,255,0.06)'}`,background:consentChecks[item.key]?'rgba(184,169,255,0.06)':'#111113',transition:'all 200ms',marginBottom:8}}><div style={{width:20,height:20,minWidth:20,borderRadius:4,marginTop:2,border:`2px solid ${consentChecks[item.key]?'#B8A9FF':'rgba(255,255,255,0.1)'}`,background:consentChecks[item.key]?'#B8A9FF':'transparent',display:'flex',alignItems:'center',justifyContent:'center',transition:'all 200ms'}}>{consentChecks[item.key]&&<Check size={12} color="#0A0A0B"/>}</div><span style={S.body}>{item.text}</span></div>)}<button onClick={ok?startChat:undefined} disabled={!ok} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 36px',marginTop:32,background:ok?'#B8A9FF':'#1A1A1D',fontFamily:"'Inter',sans-serif",fontSize:'0.9375rem',fontWeight:500,color:ok?'#0A0A0B':'#3A3835',border:'none',borderRadius:4,cursor:ok?'pointer':'not-allowed',transition:'all 350ms'}}>{ok?'Start the conversation':'Please agree to all items'}</button><div style={{textAlign:'center',marginTop:16,...S.mono,color:'#3A3835'}}><Link href="/privacy" style={{color:'#5C5955'}}>privacy</Link>{' · '}<Link href="/terms" style={{color:'#5C5955'}}>terms</Link></div></div></Dark></>);}

  if (screen==='chat') return (<><Fonts/><div style={{minHeight:'100vh',background:'#F5F5F3',display:'flex',flexDirection:'column',position:'relative'}}><div style={{position:'fixed',inset:0,pointerEvents:'none',opacity:0.25,backgroundImage:'linear-gradient(#BFBDB8 1px, transparent 1px), linear-gradient(90deg, #BFBDB8 1px, transparent 1px)',backgroundSize:'48px 48px',zIndex:0}}/><div style={{padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',background:'rgba(245,245,243,0.9)',backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:10}}><span style={{fontFamily:"'Syne',sans-serif",fontSize:'1rem',fontWeight:700,letterSpacing:'-0.02em',color:'#111113'}}>Pathlight</span><span style={{...S.mono,color:'#555250',display:'flex',alignItems:'center',gap:6}}><Lock size={12}/> private</span></div><div style={{height:2,background:'transparent',margin:'0 24px',position:'relative',zIndex:1}}><div style={{height:'100%',background:'#7B6FBF',width:`${Math.min((userMsgCount/15)*100,100)}%`,transition:'width 500ms ease',borderRadius:1}}/></div><div style={{flex:1,overflowY:'auto',padding:'24px 16px',position:'relative',zIndex:1}}><div style={{maxWidth:640,margin:'0 auto',display:'flex',flexDirection:'column',gap:12}}>{parsedMessages.map((msg,idx)=><div key={idx} style={{alignSelf:msg.role==='user'?'flex-end':'flex-start',maxWidth:'85%',padding:'14px 18px',borderRadius:8,background:msg.role==='user'?'#111113':'rgba(255,255,255,0.85)',color:msg.role==='user'?'#F5F5F3':'#111113',border:msg.role==='user'?'none':'1px solid #E5E3DF',fontFamily:"'Inter',sans-serif",fontSize:'0.9375rem',fontWeight:400,lineHeight:1.65,whiteSpace:'pre-wrap',backdropFilter:msg.role==='user'?'none':'blur(8px)'}}>{msg.text}</div>)}{isLoading&&<div style={{alignSelf:'flex-start',padding:'14px 18px',background:'rgba(255,255,255,0.85)',border:'1px solid #E5E3DF',borderRadius:8,display:'flex',gap:4,backdropFilter:'blur(8px)'}}><span className="pl-dot"/><span className="pl-dot" style={{animationDelay:'0.2s'}}/><span className="pl-dot" style={{animationDelay:'0.4s'}}/></div>}<div ref={messagesEndRef}/></div></div><div style={{background:'rgba(245,245,243,0.9)',backdropFilter:'blur(12px)',padding:16,position:'relative',zIndex:1}}><div style={{maxWidth:640,margin:'0 auto'}}>{chatComplete?<div style={{textAlign:'center'}}><button onClick={()=>{setScreen('synthesis');generateSynthesis();}} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 28px',background:'#111113',color:'#F5F5F3',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>Generate My Report <ArrowRight size={16}/></button><p style={{...S.mono,color:'#555250',marginTop:8}}>takes about 45 seconds</p></div>:activeInteraction?<InteractionWidget interaction={activeInteraction} onSubmit={handleInteractionSubmit}/>:<div style={{display:'flex',gap:12}}><input ref={inputRef} type="text" value={userInput} onChange={e=>setUserInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleTextSubmit();}}} placeholder="Type your response..." disabled={isLoading} style={{flex:1,padding:'12px 16px',background:'rgba(245,245,243,0.6)',border:'1px solid #E5E3DF',borderRadius:4,fontFamily:"'Inter',sans-serif",fontSize:'0.9375rem',color:'#111113',outline:'none'}}/><button onClick={handleTextSubmit} disabled={isLoading||!userInput.trim()} style={{padding:'12px 16px',background:'#111113',color:'#F5F5F3',border:'none',borderRadius:4,cursor:'pointer',display:'flex',alignItems:'center',opacity:(!userInput.trim()||isLoading)?0.2:1}}><Send size={18}/></button></div>}</div></div><div style={{padding:'8px 24px',display:'flex',justifyContent:'space-between',background:'rgba(245,245,243,0.9)',...S.mono,color:'#555250',fontSize:'0.625rem',position:'relative',zIndex:1}}><div style={{display:'flex',gap:12}}><Link href="/privacy" style={{color:'#555250'}}>privacy</Link><Link href="/terms" style={{color:'#555250'}}>terms</Link></div><button onClick={resetProgress} style={{background:'none',border:'none',color:'#555250',...S.mono,fontSize:'0.625rem',cursor:'pointer'}}>clear data</button></div></div></>);

  if (screen==='reveal'&&revealStrength){const idx=parsedData?.superpowers?.indexOf(revealStrength)??0;return(<><Fonts/><Dark center><Orb s={400} o={0.2}/><Grid o={0.03}/><div style={{zIndex:1,textAlign:'center'}}><div style={{...S.mono,color:'#5C5955',opacity:0,animation:'rFade 0.6s ease 0.2s forwards'}}>strength_{String(idx+1).padStart(2,'0')} of 05</div><div style={{...S.mono,color:'#B8A9FF',letterSpacing:'0.15em',margin:'24px 0',opacity:0,animation:'rFade 0.6s ease 0.5s forwards'}}>Your Signature Strength</div><div style={{...S.display,fontSize:'clamp(2.5rem,8vw,4.5rem)',fontWeight:800,letterSpacing:'-0.04em',opacity:0,animation:'rSlideUp 1s ease 0.8s forwards'}}>{revealStrength.name}</div><div style={{width:32,height:2,background:'#B8A9FF',margin:'24px auto',opacity:0,animation:'rExpand 0.5s ease 1.4s forwards'}}/><div style={{...S.bodyLg,maxWidth:420,margin:'0 auto',opacity:0,animation:'rFade 0.8s ease 1.7s forwards'}}>{revealStrength.description}</div><div style={{marginTop:48,opacity:0,animation:'rFade 0.6s ease 2.2s forwards'}}><button onClick={()=>{setRevealStrength(null);setSynthesisScreen(1);setScreen('synthesis');}} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'12px 28px',background:'#F0EDE8',color:'#0A0A0B',...S.small,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>Continue <ArrowRight size={16}/></button></div></div></Dark></>);}

  if (screen==='synthesis'){
    if (synthesisGenerating||(!parsedData&&!synthesisContent)) return(<><Fonts/><Dark center><Orb s={400} o={0.2}/><div style={{zIndex:1,textAlign:'center'}}><MonoLabel>analyzing your conversation</MonoLabel><DisplayH>Building your report</DisplayH><div style={{width:32,height:32,border:'2px solid rgba(255,255,255,0.1)',borderTopColor:'#B8A9FF',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto'}}/><p style={{...S.mono,color:'#3A3835',marginTop:24}}>this takes about 45 seconds</p></div></Dark></>);
    if (synthesisContent&&!parsedData){setParsedData(parseSynthesis(synthesisContent));return null;}
    if (!parsedData) return null;

    const Wrap=({children})=>(<><Fonts/><div style={{minHeight:'100vh',background:'#0A0A0B',color:'#F0EDE8'}}><div className="pl-screen-enter" style={{maxWidth:640,margin:'0 auto',padding:'48px 24px'}}>{children}</div></div></>);

    if (synthesisScreen===0) return(<Wrap><p style={{...S.mono,color:'#5C5955',textAlign:'center',marginBottom:48}}>ai-generated insights to help you reflect</p><MonoLabel>your profile</MonoLabel><DisplayH>Here's what we see in you</DisplayH>{parsedData.profile.split('\n').filter(p=>p.trim()).map((p,i)=><p key={i} style={{...S.bodyLg,marginBottom:16}}>{p}</p>)}<NavRow onNext={()=>{if(parsedData.superpowers[0]){setRevealStrength(parsedData.superpowers[0]);setScreen('reveal');}else setSynthesisScreen(1);}} nextLabel="See Your Strengths"/></Wrap>);

    if (synthesisScreen===1){
      const Card=({pw,num})=>(<div style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden',marginBottom:16}}><div style={{padding:24,borderBottom:paymentCompleted?'1px solid rgba(255,255,255,0.06)':'none',display:'flex',gap:20}}><span style={{...S.mono,color:'#B8A9FF',paddingTop:4}}>{String(num).padStart(2,'0')}</span><div><div style={{...S.heading,fontSize:'clamp(1.375rem,3vw,1.75rem)',fontWeight:700,marginBottom:4}}>{pw.name}</div><p style={S.body}>{pw.description}</p></div></div>{paymentCompleted&&<div style={{padding:24,display:'grid',gap:20}}>{pw.valuable&&<div><div style={{...S.mono,color:'#FFB88C',marginBottom:4}}>What makes this valuable</div><p style={S.body}>{pw.valuable}</p></div>}<div><div style={{...S.mono,color:'#B8A9FF',marginBottom:8}}>How to deploy this</div>{pw.thisWeek&&<p style={{...S.body,marginBottom:8}}><strong style={{color:'#F0EDE8',fontWeight:500}}>This week:</strong> {pw.thisWeek}</p>}{pw.inInterviews&&<p style={{...S.body,marginBottom:8}}><strong style={{color:'#F0EDE8',fontWeight:500}}>In interviews:</strong> {pw.inInterviews}</p>}{pw.bestRoles&&<p style={S.body}><strong style={{color:'#F0EDE8',fontWeight:500}}>Best roles:</strong> {pw.bestRoles}</p>}</div>{pw.watchOut&&<div><div style={{...S.mono,color:'#FF8F8F',marginBottom:4}}>Watch out</div><p style={S.body}>{pw.watchOut}</p></div>}</div>}</div>);
      const Locked=({pw,num})=>(<div style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,position:'relative',overflow:'hidden',marginBottom:16}}><div style={{filter:'blur(6px)',opacity:0.25,userSelect:'none',display:'flex',gap:20}}><span style={{...S.mono,color:'#B8A9FF'}}>{String(num).padStart(2,'0')}</span><div><div style={{...S.heading,fontSize:'1.5rem',fontWeight:700,marginBottom:4}}>{pw.name}</div><p style={S.body}>{pw.description?.substring(0,60)}...</p></div></div><div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 20px',background:'#1A1A1D',border:'1px solid rgba(255,255,255,0.1)',borderRadius:4,...S.mono,color:'#5C5955'}}><Lock size={12}/> unlock full report</div></div></div>);
      return(<Wrap><MonoLabel>signature strengths</MonoLabel><DisplayH>What you've been bringing to the table</DisplayH><p style={{...S.body,marginBottom:32}}>Strengths you undervalue because they come naturally.</p>{paymentCompleted?<>{parsedData.superpowers.slice(0,5).map((pw,i)=><Card key={i} pw={pw} num={i+1}/>)}{parsedData.superpowersSummary.whyTogether&&<><MonoLabel>why these matter together</MonoLabel><p style={{...S.bodyLg,marginBottom:24}}>{parsedData.superpowersSummary.whyTogether}</p></>}{parsedData.superpowersSummary.valueProp&&<div style={{background:'#111113',border:'1px solid rgba(184,169,255,0.3)',borderRadius:12,padding:24,textAlign:'center',position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#B8A9FF,transparent)'}}/><p style={{...S.subhead,fontStyle:'italic'}}>"{parsedData.superpowersSummary.valueProp}"</p></div>}</>:<>{parsedData.superpowers.slice(0,2).map((pw,i)=><Card key={i} pw={pw} num={i+1}/>)}{parsedData.superpowers.slice(2,5).map((pw,i)=><Locked key={i} pw={pw} num={i+3}/>)}<div style={{background:'#0A0A0B',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'64px 24px',textAlign:'center',position:'relative',overflow:'hidden',marginTop:32}}><div style={{position:'absolute',top:'-10%',left:'50%',transform:'translateX(-50%)',width:500,height:300,background:'radial-gradient(ellipse,rgba(184,169,255,0.1) 0%,transparent 70%)',filter:'blur(60px)',pointerEvents:'none'}}/><Grid o={0.02}/><div style={{position:'relative',zIndex:1}}><MonoLabel>2 of 5 strengths revealed</MonoLabel><h3 style={{...S.display,fontSize:'clamp(2rem,5vw,3rem)',marginBottom:16}}>There's more to<br/>your story</h3><p style={{...S.body,maxWidth:380,margin:'0 auto 32px'}}>Your full report reveals the complete picture — the patterns, the rare combinations, and where to take them next.</p><div style={{display:'flex',flexDirection:'column',gap:6,maxWidth:300,margin:'0 auto 32px',textAlign:'left'}}>{['All 5 bespoke strengths with deployment guides','Rare strength combinations','Deal-breakers checklist','5 role territories to explore','Career narrative for LinkedIn','Downloadable PDF report'].map((f,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,...S.small}}><span style={{width:3,height:3,borderRadius:'50%',background:'#B8A9FF',flexShrink:0}}/>{f}</div>)}</div><div style={{marginBottom:24}}><span style={{fontFamily:"'Syne',sans-serif",fontSize:'3.5rem',fontWeight:700,letterSpacing:'-0.03em',color:'#F0EDE8'}}>$39</span><span style={{...S.mono,color:'#5C5955',marginLeft:4,verticalAlign:'super'}}>AUD</span></div><button onClick={handlePayment} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 36px',background:'#B8A9FF',color:'#0A0A0B',...S.body,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer'}}>Unlock Full Report <ArrowRight size={16}/></button><p style={{...S.mono,color:'#3A3835',marginTop:24}}>encrypted payment via stripe · data stays on your device</p></div></div></>}<NavRow onBack={()=>setSynthesisScreen(0)} onNext={paymentCompleted?()=>setSynthesisScreen(2):null} nextLabel="Strength Combinations"/></Wrap>);
    }

    if (synthesisScreen===2&&paymentCompleted) return(<Wrap><MonoLabel>strength combinations</MonoLabel><DisplayH>Where your strengths multiply</DisplayH><p style={{...S.body,marginBottom:32}}>Individual strengths are useful. Combinations make you irreplaceable.</p>{parsedData.strengthCombos.map((c,i)=><div key={i} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:12}}><div style={{...S.subhead,marginBottom:8}}>{c.title}</div><p style={{...S.body,whiteSpace:'pre-wrap'}}>{c.body}</p></div>)}{parsedData.rarestCombo&&<div style={{background:'#111113',border:'1px solid rgba(184,169,255,0.3)',borderRadius:12,padding:24,position:'relative',overflow:'hidden',marginTop:8}}><div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#B8A9FF,transparent)'}}/><MonoLabel>your rarest combination</MonoLabel><p style={S.body}>{parsedData.rarestCombo}</p></div>}<NavRow onBack={()=>setSynthesisScreen(1)} onNext={()=>setSynthesisScreen(3)} nextLabel="Deal-Breakers"/></Wrap>);

    if (synthesisScreen===3&&paymentCompleted){const db=parsedData.dealbreakers;return(<Wrap><MonoLabel>deal-breakers</MonoLabel><DisplayH>What doesn't work for you</DisplayH><p style={{...S.body,marginBottom:32}}>Use this when evaluating opportunities.</p>{[['About the work',db.work],['What comes with the job',db.job],['About leadership',db.leadership],['About the environment',db.environment]].map(([label,items])=>items.length>0&&<div key={label} style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:12}}><div style={{...S.subhead,marginBottom:16}}>{label}</div>{items.map((item,i)=><div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}><span style={{color:'#FF8F8F',fontFamily:"'Space Mono',monospace",fontSize:'0.8125rem'}}>—</span><p style={S.body}>{item}</p></div>)}</div>)}<NavRow onBack={()=>setSynthesisScreen(2)} onNext={()=>setSynthesisScreen(4)} nextLabel="Role Territories"/></Wrap>);}

    if (synthesisScreen===4&&paymentCompleted) return(<Wrap><MonoLabel>role territories</MonoLabel><DisplayH>Paths to explore</DisplayH><p style={{...S.body,marginBottom:32}}>Directions, not prescriptions. Tap to expand.</p>{parsedData.territories.map((t,i)=><div key={i} style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,overflow:'hidden',marginBottom:12}}><div onClick={()=>setExpandedTerritories(p=>({...p,[i]:!p[i]}))} style={{padding:'20px 24px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{...S.subhead}}>{t.name}</span><ChevronRight size={18} style={{color:'#5C5955',transform:expandedTerritories[i]?'rotate(90deg)':'none',transition:'transform 200ms'}}/></div>{expandedTerritories[i]&&<div style={{padding:'0 24px 24px',borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:20}}>{[['Why this fits',t.whyFits,'#B8A9FF'],['What transfers',t.transfers,'#FFB88C'],['Possible gaps',t.gaps,'#FF8F8F'],['Salary range',t.salary,'#5C5955'],['Search terms',t.searchTerms,'#5C5955'],['Respects your deal-breakers',t.dealbreakers,'#8CCFB8']].map(([l,v,c])=>v&&<div key={l} style={{marginBottom:16}}><div style={{...S.mono,color:c,marginBottom:4}}>{l}</div><p style={S.body}>{v}</p></div>)}</div>}</div>)}<NavRow onBack={()=>setSynthesisScreen(3)} onNext={()=>setSynthesisScreen(5)} nextLabel="Career Narrative"/></Wrap>);

    if (synthesisScreen===5&&paymentCompleted) return(<Wrap><MonoLabel>career narrative</MonoLabel><DisplayH>Your story, ready to use</DisplayH><p style={{...S.body,marginBottom:32}}>Copy, paste, make it yours.</p>{parsedData.careerNarrative&&<div style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{...S.subhead}}>LinkedIn / About</span><button onClick={()=>navigator.clipboard?.writeText(parsedData.careerNarrative)} style={{...S.mono,color:'#5C5955',background:'none',border:'none',cursor:'pointer'}}>copy</button></div><p style={{...S.bodyLg,whiteSpace:'pre-wrap'}}>{parsedData.careerNarrative}</p></div>}{parsedData.shortIntro&&<div style={{background:'#111113',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,marginBottom:16}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{...S.subhead}}>30-Second Introduction</span><button onClick={()=>navigator.clipboard?.writeText(parsedData.shortIntro)} style={{...S.mono,color:'#5C5955',background:'none',border:'none',cursor:'pointer'}}>copy</button></div><p style={{...S.bodyLg,whiteSpace:'pre-wrap'}}>{parsedData.shortIntro}</p></div>}<div style={{background:'#111113',border:'1px solid rgba(184,169,255,0.3)',borderRadius:12,padding:32,textAlign:'center',marginTop:32,position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:0,left:0,right:0,height:1,background:'linear-gradient(90deg,transparent,#B8A9FF,transparent)'}}/><FileText size={32} style={{color:'#B8A9FF',marginBottom:16}}/><div style={{...S.subhead,marginBottom:8}}>Download Your Report</div><button onClick={downloadPDF} disabled={pdfDownloading} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'14px 36px',background:'#B8A9FF',color:'#0A0A0B',...S.body,fontWeight:500,border:'none',borderRadius:4,cursor:'pointer',marginTop:12,opacity:pdfDownloading?0.5:1}}>{pdfDownloading?'Generating...':<><Download size={16}/> Download PDF</>}</button></div><div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:24,textAlign:'center',marginTop:16}}><div style={{...S.subhead,fontSize:'1rem',marginBottom:8}}>Help improve Pathlight</div><a href="https://forms.gle/fUaxKWAMbQZdbXNk7" target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',padding:'12px 28px',background:'transparent',color:'#F0EDE8',...S.small,border:'1px solid rgba(255,255,255,0.1)',borderRadius:4,textDecoration:'none',marginTop:8}}>Take 2-Min Survey</a></div><NavRow onBack={()=>setSynthesisScreen(4)}/></Wrap>);
  }

  return(<><Fonts/><Dark center><p style={S.body}>Something went wrong. <button onClick={resetProgress} style={{color:'#B8A9FF',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>Reset</button></p></Dark></>);
}
