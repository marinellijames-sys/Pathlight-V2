import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Check, AlertCircle, Download, RefreshCw, Lock, MessageCircle, FileText, Eye } from 'lucide-react';

// Journey structure
const SECTIONS = [
  {
    id: 'intro',
    title: 'Welcome to Pathlight',
    type: 'intro'
  },
  {
    id: 'consent',
    title: 'Privacy & Consent',
    type: 'consent'
  },
  {
    id: 'screener',
    title: 'Let\'s Start Here',
    type: 'screener',
    questions: [
      {
        id: 'stage',
        question: 'Where are you right now in your career journey?',
        options: [
          'Student or just starting out',
          'Early career (1-5 years)',
          'Mid-career feeling stuck',
          'Senior looking for a change',
          'Career break, returning to work',
          'Exploring something completely new'
        ]
      },
      {
        id: 'trigger',
        question: 'What brought you here today?',
        options: [
          'I feel trapped in my current situation',
          'I lack direction and don\'t know what I want',
          'I have a big decision to make',
          'Just curious and exploring',
          'I know I need a change but don\'t know how',
          'I want to understand my strengths better'
        ]
      },
      {
        id: 'energy',
        question: 'Have you worked in roles where you felt truly energized?',
        options: [
          'Yes, I know what energizes me',
          'Sometimes, but not consistently',
          'No, not really',
          'I\'m not sure what that would feel like'
        ]
      }
    ]
  },
  {
    id: 'energy',
    title: 'What Energizes You',
    subtitle: 'And what drains you',
    explainer: 'Energy is your compass. Think about work first - what tasks, projects, or situations make you feel alive? But also look beyond work: hobbies, volunteering, daily activities. Are you energized by the process or the outcome? The more specific examples you share, the better we can identify your patterns.',
    aiContext: 'exploring what energizes and drains them across work and life',
    maxAiResponses: 2,
    hasFollowUp: true
  },
  {
    id: 'strengths',
    title: 'What You\'re Naturally Good At',
    subtitle: 'That you don\'t realize',
    explainer: 'We\'re terrible at seeing our own strengths because they come easily to us. Think about what people ask you for help with. What do you do that others find difficult but you find simple? Share specific examples.',
    aiContext: 'identifying hidden strengths they undervalue',
    maxAiResponses: 2,
    hasFollowUp: true
  },
  {
    id: 'wins',
    title: 'Your Wins',
    subtitle: 'Building evidence',
    explainer: 'You\'ve accomplished more than you realize. These don\'t need to be work achievements - raising kids, overcoming challenges, learning new skills, helping others. Think of specific moments you\'re proud of.',
    aiContext: 'building confidence through past accomplishments',
    maxAiResponses: 2,
    hasFollowUp: true
  },
  {
    id: 'unlimited',
    title: 'Your Ideal Work Day',
    subtitle: 'If nothing was in your way',
    explainer: 'Describe your perfect work setup: What time do you start? Where are you working? What are you actually doing? How much are you making? What flexibility do you have? Be specific about the day-to-day, not just the dream job title.',
    aiContext: 'understanding ideal work conditions',
    maxAiResponses: 0,
    brainDump: true
  },
  {
    id: 'dealbreakers',
    title: 'Your Deal-Breakers',
    subtitle: 'What made you miserable before',
    explainer: 'The best way to know what you DON\'T want is to look at what\'s made you miserable. Think about jobs, bosses, work environments. List at least 10 specific things that drained you or made you dread Monday mornings.',
    aiContext: 'identifying non-negotiables from past negative experiences',
    maxAiResponses: 0,
    brainDump: true
  },
  {
    id: 'synthesis',
    title: 'Your Pathways Forward',
    type: 'synthesis'
  }
];

export default function Pathlight() {
  const [currentSection, setCurrentSection] = useState(0);
  const [introPage, setIntroPage] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [conversations, setConversations] = useState({});
  const [screenerAnswers, setScreenerAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [aiResponseCount, setAiResponseCount] = useState({});
  const [synthesisGenerated, setSynthesisGenerated] = useState(false);
  const [synthesisScreen, setSynthesisScreen] = useState(0);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [consentChecks, setConsentChecks] = useState({
    terms: false,
    age: false,
    data: false
  });
  const messagesEndRef = useRef(null);

  // Parse synthesis markdown
  const parseSynthesis = (content) => {
    if (!content) return null;

    const sections = {
      profile: '',
      superpowers: [],
      superpowersSummary: { whyTogether: '', valueProp: '' },
      dealbreakers: { work: [], job: [], leadership: [], environment: [] },
      territories: [],
      nextSteps: []
    };

    try {
      const profileMatch = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths|$)/);
      if (profileMatch) sections.profile = profileMatch[1].trim();

      const superpowersSection = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Deal-Breakers|$)/);
      if (superpowersSection) {
        const fullText = superpowersSection[1];
        const powerBlocks = fullText.split(/\n### /);
        
        powerBlocks.forEach((block) => {
          if (!block.trim()) return;
          const lines = block.split('\n');
          const nameLine = lines[0];
          const nameMatch = nameLine.match(/\*\*([^*]+)\*\*/);
          if (!nameMatch) return;
          const name = nameMatch[1];
          if (name.includes('Why these matter') || name.includes('Your unique value')) return;
          
          let description = '';
          let descStart = 1;
          while (descStart < lines.length && !lines[descStart].trim()) descStart++;
          if (descStart < lines.length) {
            let descLines = [];
            for (let i = descStart; i < lines.length && !lines[i].includes('*How to deploy this:*'); i++) {
              if (lines[i].trim()) descLines.push(lines[i].trim());
            }
            description = descLines.join(' ');
          }
          
          const howToStart = block.indexOf('*How to deploy this:*');
          if (howToStart !== -1) {
            let howToEnd = block.length;
            const whyIndex = block.indexOf('**Why these matter');
            if (whyIndex !== -1 && whyIndex > howToStart) {
              howToEnd = whyIndex;
            }
            const howToText = block.substring(howToStart + '*How to deploy this:*'.length, howToEnd).trim();
            if (name && description && howToText) {
              sections.superpowers.push({ name, description, howTo: howToText });
            }
          }
        });
        
        const whyMatch = fullText.match(/\*\*Why these matter together:\*\*([\s\S]*?)(?=\*\*Your unique value|$)/);
        if (whyMatch) sections.superpowersSummary.whyTogether = whyMatch[1].trim();
        
        const valuePropMatch = fullText.match(/\*\*Your unique value proposition:\*\*\s*\n?"([^"]+)"/);
        if (valuePropMatch) sections.superpowersSummary.valueProp = valuePropMatch[1];
      }

      const dealbreakersSection = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories|$)/);
      if (dealbreakersSection) {
        const text = dealbreakersSection[1];
        const workMatch = text.match(/\*\*❌ About the work:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        const jobMatch = text.match(/\*\*❌ What comes with the job:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        const leadershipMatch = text.match(/\*\*❌ About leadership:\*\*\n([\s\S]*?)(?=\n\*\*❌|$)/);
        const environmentMatch = text.match(/\*\*❌ About the environment:\*\*\n([\s\S]*?)(?=\n\*|$)/);
        
        if (workMatch) sections.dealbreakers.work = workMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (jobMatch) sections.dealbreakers.job = jobMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (leadershipMatch) sections.dealbreakers.leadership = leadershipMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (environmentMatch) sections.dealbreakers.environment = environmentMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
      }

      const territoriesSection = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Next Three Steps|$)/);
      if (territoriesSection) {
        const text = territoriesSection[1];
        const territoryBlocks = text.split(/\n(?=\*\*[A-Z])/);
        
        territoryBlocks.forEach(block => {
          const nameMatch = block.match(/\*\*([^*]+)\*\*/);
          if (nameMatch && block.length > 50) {
            sections.territories.push({
              name: nameMatch[1],
              content: block.substring(nameMatch[0].length).trim()
            });
          }
        });
      }

      const stepsSection = content.match(/## Next Three Steps\n\n([\s\S]*?)$/);
      if (stepsSection) {
        const stepMatches = stepsSection[1].matchAll(/\d+\.\s+\*\*([^*]+)\*\*[:\s]+([\s\S]*?)(?=\n\d+\.|$)/g);
        for (const match of stepMatches) {
          sections.nextSteps.push({
            timeframe: match[1],
            action: match[2].trim()
          });
        }
      }
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }

    return sections;
  };

  useEffect(() => {
    loadProgress();
    
    // Check for payment success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setPaymentCompleted(true);
      localStorage.setItem('pathlight-payment', 'completed');
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentSection]);

  const loadProgress = () => {
    try {
      const saved = localStorage.getItem('pathlight-progress');
      const paymentStatus = localStorage.getItem('pathlight-payment');
      
      if (saved) {
        const data = JSON.parse(saved);
        setConversations(data.conversations || {});
        setScreenerAnswers(data.screenerAnswers || {});
        setCurrentSection(data.currentSection || 0);
        setAiResponseCount(data.aiResponseCount || {});
        setSynthesisGenerated(data.synthesisGenerated || false);
      }
      
      if (paymentStatus === 'completed') {
        setPaymentCompleted(true);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  const saveProgress = (newConversations, newSection, newAiCount, newScreener, newSynthesis) => {
    try {
      localStorage.setItem('pathlight-progress', JSON.stringify({
        conversations: newConversations || conversations,
        currentSection: newSection !== undefined ? newSection : currentSection,
        aiResponseCount: newAiCount || aiResponseCount,
        screenerAnswers: newScreener || screenerAnswers,
        synthesisGenerated: newSynthesis !== undefined ? newSynthesis : synthesisGenerated,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const resetProgress = () => {
    if (confirm('Start a fresh journey? All your progress will be reset.')) {
      localStorage.removeItem('pathlight-progress');
      localStorage.removeItem('pathlight-payment');
      setConversations({});
      setScreenerAnswers({});
      setCurrentSection(0);
      setAiResponseCount({});
      setSynthesisGenerated(false);
      setPaymentCompleted(false);
      setIntroPage(0);
    }
  };

  const section = SECTIONS[currentSection];
  const sectionMessages = conversations[section.id] || [];
  const currentAiResponses = aiResponseCount[section.id] || 0;
  const maxAiResponses = section.maxAiResponses || 2;

  const handleScreenerAnswer = (questionId, answer) => {
    const newAnswers = { ...screenerAnswers, [questionId]: answer };
    setScreenerAnswers(newAnswers);
    saveProgress(conversations, currentSection, aiResponseCount, newAnswers, synthesisGenerated);
  };

  const sendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessage = { role: 'user', content: userInput };
    const sectionId = section.id;
    const updatedMessages = [...sectionMessages, newMessage];
    
    const newConversations = {
      ...conversations,
      [sectionId]: updatedMessages
    };
    
    setConversations(newConversations);
    setUserInput('');
    
    // Brain dump sections - no AI response
    if (section.brainDump || sectionId === 'unlimited' || sectionId === 'dealbreakers') {
      await saveProgress(newConversations, currentSection, aiResponseCount, screenerAnswers, synthesisGenerated);
      return;
    }
    
    if (currentAiResponses >= maxAiResponses) {
      await saveProgress(newConversations, currentSection, aiResponseCount, screenerAnswers, synthesisGenerated);
      return;
    }
    
    setIsLoading(true);

    try {
      const isLastResponse = currentAiResponses + 1 === maxAiResponses;
      
      const hasFollowUp = section.hasFollowUp;
      const isFirstResponse = currentAiResponses === 0;
      const isSecondResponse = currentAiResponses === 1;
      
      let systemPrompt = `You are a warm, insightful career coach helping someone discover what truly matters in their work and life.

Current section: "${section.title}" - ${section.aiContext}
Section explainer: ${section.explainer}

Context about this person:
- Career stage: ${screenerAnswers.stage || 'unknown'}
- What brought them here: ${screenerAnswers.trigger || 'unknown'}
- Energy awareness: ${screenerAnswers.energy || 'unknown'}

CRITICAL: This is response ${currentAiResponses + 1} of ${maxAiResponses}.

${hasFollowUp && isFirstResponse ? `
THIS IS YOUR FIRST RESPONSE - ASK A PROBING FOLLOW-UP QUESTION.

Your role:
- Acknowledge what they shared briefly (1 sentence)
- Ask ONE probing follow-up question that digs DEEPER into their answer
- Focus on the WHY behind what they said
- Ask for a specific moment or example that illustrates their point
- Keep your response to 3-4 sentences maximum

${section.id === 'energy' ? `
For ENERGY specifically, probe:
- If they mentioned an activity, ask: "What specifically about that made you feel alive? Was it the challenge, the people, the result?"
- If vague, ask: "Can you walk me through a specific day or project where you felt that energy?"
- Probe the opposite too: "And what's the flip side - what drains you?"
` : ''}

${section.id === 'strengths' ? `
For STRENGTHS specifically, probe:
- Ask: "When you do that, what do others struggle with that you find easy?"
- Or: "Can you give me a specific example of when someone came to you for help with this?"
- Or: "What would someone watching you do this notice that you might not?"
` : ''}

${section.id === 'wins' ? `
For WINS specifically, probe:
- Ask: "What did you have to overcome to achieve that?"
- Or: "What skills or strengths did that require from you?"
- Or: "How did you feel in the moment of that win? What made it meaningful?"
` : ''}

End with something like: "I want to understand this more deeply."
` : ''}

${hasFollowUp && isSecondResponse ? `
THIS IS YOUR SECOND (FINAL) RESPONSE - REFLECT AND SUMMARIZE.

Your role:
- Provide a brief, insightful reflection on what they've shared (2-3 sentences)
- Use pattern language: "What I'm hearing is..." or "There's a clear theme of..."
- Reference SPECIFIC things they mentioned from BOTH responses
- Note any insights about their underlying motivations
- End warmly: "Feel free to add more thoughts or continue when ready."
- Do NOT ask more questions
` : ''}

${!hasFollowUp && isLastResponse ? `
This is your FINAL response for this section.

Your role:
- Provide a brief, insightful reflection on what they've shared (2-3 sentences)
- Use pattern language: "It sounds like..." or "What stands out is..."
- Reference SPECIFIC things they mentioned
- End warmly: "Feel free to add more thoughts or continue when ready."
- Do NOT ask more questions
` : ''}

${!hasFollowUp && !isLastResponse ? `
This is your first response.

Your role:
- Ask ONE focused follow-up question that requests SPECIFIC, DETAILED examples
- Keep it to 2-3 sentences maximum
- End with: "The more specific you are, the better I can identify patterns."
` : ''}`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: updatedMessages
        })
      });

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      const finalConversations = {
        ...conversations,
        [sectionId]: finalMessages
      };

      const newAiCount = {
        ...aiResponseCount,
        [sectionId]: currentAiResponses + 1
      };

      setConversations(finalConversations);
      setAiResponseCount(newAiCount);
      await saveProgress(finalConversations, currentSection, newAiCount, screenerAnswers, synthesisGenerated);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSynthesis = async () => {
    if (synthesisGenerated) return;
    
    setIsLoading(true);
    const sectionId = 'synthesis';

    try {
      let allData = `Screener Context:
- Career stage: ${screenerAnswers.stage}
- What brought them: ${screenerAnswers.trigger}
- Energy awareness: ${screenerAnswers.energy}

`;

      SECTIONS.forEach(s => {
        if (conversations[s.id] && s.type !== 'intro' && s.type !== 'screener' && s.type !== 'synthesis' && s.type !== 'consent') {
          allData += `\n${s.title}:\n`;
          conversations[s.id].forEach(msg => {
            if (msg.role === 'user') {
              allData += `- ${msg.content}\n`;
            }
          });
        }
      });

      const systemPrompt = `You are creating a personalized career clarity report called "Your Pathways Forward."

Here's everything this person shared:
${allData}

Create their complete output with these sections. Use warm, second-person language ("you"). Be specific, reference actual things they said.

IMPORTANT: Look for clues about their drive orientation:
- If they mention targets, revenue, business outcomes, winning, deals → They're commercially driven (close to P&L)
- If they mention craft, quality, helping individuals, mastering skills → They're craft/care driven (far from P&L)
- If both or unclear → They may be in the middle (product, operations, customer success type roles)

Note this orientation in their profile and use it to guide role territory suggestions.

FORMAT AS MARKDOWN with clear headers.

# Your Pathways Forward

## Your Profile

Write a 200-word narrative (max) that captures:
- What energizes them (specific activities)
- Their core strengths
- Their drive orientation if clear
- End with encouragement

## Your Signature Strengths

Identify EXACTLY 4 unique combinations of their strengths. Name each one distinctively and concretely.

CRITICAL NAMING RULES:
- DO NOT use abstract labels like "Strategic Thinker", "People Person", "Problem Solver"
- DO NOT use frameworks (Gallup, Lominger, generic competencies)
- DO use names that describe the SPECIFIC ACTION or OUTCOME: "The Invisible Architect", "Chaos Navigator", "People Accelerator", "Deal Closer", "System Builder"
- Base the name on ACTUAL things they said they do, not abstract concepts
- Make it memorable and ownable - they should be able to say "Yeah, that's exactly what I do"

For each strength:
### **[Concrete Strength Name]**

2-3 sentence description that references SPECIFIC things they mentioned doing.

*How to deploy this:*
- **This week:** [Specific action they can take this week]
- **In interviews:** [Exact language they can use, with "Say:" followed by quote]
- **Roles that leverage this:** [3-5 specific role types]
- **Why it's valuable:** [Why this matters to businesses, with specific business impact]

**Why these matter together:**
[Explain their unique combination - 2-3 sentences about how these strengths work together]

**Your unique value proposition:**
"[One compelling sentence in quotes that captures their distinct value]"

## Your Deal-Breakers

*Use this list when evaluating opportunities. Even if a role looks perfect, if it has these elements, you'll end up miserable again.*

Based on what made them miserable, identify the KEY themes and consolidate to 3 MAXIMUM per category. Be ruthlessly selective.

Make each point:
- SHORT (10 words or less)
- PUNCHY (direct, no fluff)
- UNAPOLOGETIC (this is non-negotiable)
- SPECIFIC to what they actually said

Format:
**❌ About the work:**
- [Specific deal-breaker from their experience]
- [Specific deal-breaker from their experience]
- [Specific deal-breaker from their experience]

**❌ What comes with the job:**
- [Max 3 points about conditions: hours, travel, flexibility, commute]

**❌ About leadership:**
- [Max 3 points about management styles they can't tolerate]

**❌ About the environment:**
- [Max 3 points about culture/team dynamics to avoid]

## Role Territories to Explore

Suggest 5-7 specific ROLE TERRITORIES (not vague career paths). 

CRITICAL: Match territories to their drive orientation:
- If commercially driven → Sales, Revenue Operations, Commercial Strategy, Business Development, Account Management
- If craft/care driven → Specialist roles, Healthcare, Education, Research, Quality-focused roles
- If middle ground → Customer Success, Product, Operations, Implementation, Enablement

For each territory:
**Territory Name** (e.g., "Customer Success in SaaS", "Revenue Operations", "Implementation Consulting")
Why it matches their profile - reference specific strengths and energy sources they mentioned.
Typical entry salary range (be realistic based on their experience level).
What's transferable from their background (specific).
Search terms to use: "Job Title 1", "Job Title 2", "Job Title 3"
Respects their deal-breakers: [Note which specific ones] ✓

## Next Three Steps

1. **This week:** [Specific, achievable action - like "Research 3 companies in [territory] and read 5 job postings"]
2. **This month:** [Concrete next step - like "Connect with 2 people working in [territory] on LinkedIn"]
3. **Next 90 days:** [Bigger but clear action - like "Take [specific course/skill] or volunteer for [specific project]"]

Keep it warm, specific, and actionable.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Please create my Pathways Forward report.' }]
        })
      });

      const data = await response.json();
      const synthesisContent = data.content[0].text;

      const newConversations = {
        ...conversations,
        [sectionId]: [{ role: 'assistant', content: synthesisContent }]
      };

      setConversations(newConversations);
      setSynthesisGenerated(true);
      await saveProgress(newConversations, currentSection, aiResponseCount, screenerAnswers, true);
    } catch (error) {
      console.error('Synthesis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < SECTIONS.length - 1) {
      const newSection = currentSection + 1;
      setCurrentSection(newSection);
      saveProgress(conversations, newSection, aiResponseCount, screenerAnswers, synthesisGenerated);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      const newSection = currentSection - 1;
      setCurrentSection(newSection);
      saveProgress(conversations, newSection, aiResponseCount, screenerAnswers, synthesisGenerated);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  const downloadPDF = async () => {
    const synthesisContent = conversations.synthesis?.[0]?.content;
    if (!synthesisContent) {
      alert('No report content found. Please generate your report first.');
      return;
    }

    setPdfDownloading(true);
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ synthesisContent })
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pathlight-career-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setPdfReady(true);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setPdfDownloading(false);
    }
  };

  if (loadingStorage) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex items-center gap-3 text-charcoal">
          <div className="w-6 h-6 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          <span className="text-base font-light tracking-wide">Loading your journey...</span>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 0: Flashlight landing on black
  if (section.type === 'intro' && introPage === 0) {
    return (
      <div className="landing-dark">
        <div className="text-center">
          {/* Flashlight beam with flicker animation */}
          <div className="relative">
            {/* Beam glow behind text */}
            <div 
              className="absolute inset-0 flicker-on"
              style={{
                background: 'radial-gradient(ellipse 300px 200px at center, rgba(255,254,248,0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
            
            {/* Pathlight wordmark */}
            <h1 
              className="font-serif text-5xl md:text-7xl lg:text-8xl text-beam flicker-on beam-glow relative z-10"
              style={{ fontWeight: 400 }}
            >
              Pathlight
            </h1>
          </div>
          
          {/* Tagline and button fade in after flicker stabilizes */}
          <p className="text-stone text-lg md:text-xl mt-8 fade-in-delayed font-light">
            Find clarity in your career
          </p>
          
          <button
            onClick={() => setIntroPage(1)}
            className="mt-12 fade-in-delayed bg-transparent border border-stone/50 text-beam px-8 py-3 rounded hover:bg-beam/10 hover:border-beam/50 transition-all font-sans font-light tracking-wide"
          >
            Begin
          </button>
          
          <p className="mt-6 text-stone/60 text-sm fade-in-delayed font-light">
            15 minutes. Private.
          </p>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 1: The problem - direct, warm
  if (section.type === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-10 text-balance">
            You're here because something isn't quite right.
          </h2>
          
          <div className="space-y-5 text-lg text-graphite leading-relaxed font-light stagger-children">
            <p>Maybe you feel stuck in a role that doesn't fit anymore.</p>
            <p>Maybe you lack direction.</p>
            <p>Maybe you're ready for something bigger but don't know what.</p>
          </div>
          
          <p className="mt-10 text-lg text-ink">
            That's okay. You're in the right place.
          </p>

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-silver">
            <button
              onClick={() => setIntroPage(0)}
              className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={() => setIntroPage(2)}
              className="btn-primary inline-flex items-center gap-3"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 2: What you'll discover
  if (section.type === 'intro' && introPage === 2) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <p className="text-xs tracking-widest uppercase text-ash mb-6 font-medium">
            In 15 minutes
          </p>
          
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-12">
            What you'll discover
          </h2>
          
          <div className="space-y-0 stagger-children">
            {[
              'What truly energizes you (and what drains you)',
              'Your signature strengths you\'ve been undervaluing',
              'Career paths that align with how you work best'
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4 py-5 border-b border-silver last:border-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-charcoal text-cream text-sm font-medium flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-lg text-graphite pt-1 font-light">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={() => setIntroPage(1)}
              className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={nextSection}
              className="btn-primary inline-flex items-center gap-3"
            >
              Let's start
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONSENT SCREEN - Clean, minimal
  if (section.type === 'consent') {
    const canProceed = consentChecks.terms && consentChecks.age && consentChecks.data;

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
              Your data stays on your device. Responses are processed by AI to generate insights. 
              We don't store your information on our servers.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { key: 'terms', text: 'I understand this is a self-reflection tool, not professional career advice' },
              { key: 'age', text: 'I am 18 years of age or older' },
              { key: 'data', text: 'I understand my responses will be processed by AI' }
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-4 cursor-pointer group p-4 rounded-lg border border-silver hover:border-ash transition-colors bg-paper">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    consentChecks[item.key] ? 'bg-charcoal border-charcoal' : 'border-silver bg-white'
                  }`}>
                    {consentChecks[item.key] && <Check className="w-3 h-3 text-cream" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={consentChecks[item.key]}
                    onChange={(e) => setConsentChecks({...consentChecks, [item.key]: e.target.checked})}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm text-graphite leading-relaxed font-light">{item.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={nextSection}
              disabled={!canProceed}
              className={`w-full py-4 px-6 rounded-lg font-medium transition-all ${
                canProceed
                  ? 'btn-primary'
                  : 'bg-silver text-stone cursor-not-allowed'
              }`}
            >
              {canProceed ? 'Continue' : 'Please agree to all items'}
            </button>
            <p className="text-xs text-stone text-center mt-4 font-light">
              See our <a href="/privacy" className="text-ash hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SCREENER
  if (section.type === 'screener') {
    const allAnswered = section.questions.every(q => screenerAnswers[q.id]);
    const answeredCount = section.questions.filter(q => screenerAnswers[q.id]).length;
    
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        {/* Progress header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
          <span className="font-serif text-lg text-ink">Pathlight</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone font-light">
              {answeredCount}/{section.questions.length}
            </span>
            <div className="w-16 h-1 bg-silver rounded-full overflow-hidden">
              <div 
                className="h-full bg-charcoal rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / section.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-xl w-full space-y-12 stagger-children">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="text-center">
                <h3 className="font-serif text-xl lg:text-2xl text-ink mb-6">{q.question}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleScreenerAnswer(q.id, option)}
                      className={`px-5 py-2.5 rounded-lg text-sm font-light transition-all ${
                        screenerAnswers[q.id] === option
                          ? 'bg-charcoal text-cream'
                          : 'bg-linen hover:bg-silver text-graphite border border-silver'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {allAnswered && (
              <div className="text-center pt-4">
                <button
                  onClick={nextSection}
                  className="btn-primary inline-flex items-center gap-3"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // SYNTHESIS SCREEN
  if (section.type === 'synthesis') {
    const synthesisContent = conversations[section.id]?.[0]?.content;
    const parsedData = parseSynthesis(synthesisContent);

    // Not generated yet
    if (!synthesisContent) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center fade-in-up">
            <Sparkles className="w-12 h-12 text-ash mx-auto mb-6" />
            <h2 className="font-serif text-3xl text-ink mb-4">
              Ready for your results
            </h2>
            <p className="text-graphite mb-10 font-light">
              We'll analyze your responses to generate your personalized report.
            </p>
            <button
              onClick={generateSynthesis}
              disabled={isLoading}
              className="btn-primary inline-flex items-center gap-3 w-full justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate My Pathways
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
            {isLoading && (
              <p className="mt-4 text-sm text-stone">This takes 30-45 seconds</p>
            )}
          </div>
        </div>
      );
    }

    // Profile screen
    if (synthesisScreen === 0 && parsedData) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <div className="bg-linen rounded-lg p-4 mb-8 text-sm text-graphite border border-silver font-light">
              These insights are AI-generated to help you reflect. Use them as a starting point.
            </div>

            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Your Profile</p>
            <h2 className="font-serif text-3xl text-ink mb-8">
              Here's what we see in you
            </h2>

            <div className="text-lg text-graphite leading-relaxed space-y-4 mb-10 font-light">
              {parsedData.profile.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <button
              onClick={() => setSynthesisScreen(1)}
              className="btn-primary inline-flex items-center gap-3"
            >
              See Your Signature Strengths
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
    }

    // Signature Strengths - FREE PREVIEW (1 teaser)
    if (synthesisScreen === 1 && parsedData?.superpowers) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Signature Strengths</p>
            <h2 className="font-serif text-3xl text-ink mb-3">
              What you've been bringing to the table
            </h2>
            <p className="text-graphite mb-10 font-light">Strengths you likely undervalue because they come naturally.</p>

            {/* First strength - unlocked teaser */}
            <div className="bg-paper border border-silver rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-charcoal text-cream font-medium flex items-center justify-center">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-ink mb-2">{parsedData.superpowers[0].name}</h3>
                  <p className="text-graphite leading-relaxed font-light">{parsedData.superpowers[0].description}</p>
                </div>
              </div>
            </div>

            {/* Remaining strengths - locked */}
            {parsedData.superpowers.slice(1, 4).map((power, idx) => (
              <div key={idx} className="relative mb-4">
                <div className="bg-linen rounded-xl p-6 opacity-40 blur-[2px]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-silver" />
                    <div>
                      <h3 className="font-serif text-xl text-ink mb-2">{power.name}</h3>
                      <p className="text-graphite font-light">{power.description.substring(0, 60)}...</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-paper rounded-lg px-4 py-2 shadow-md flex items-center gap-2 border border-silver">
                    <Lock className="w-4 h-4 text-stone" />
                    <span className="text-sm text-graphite">Locked</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Payment wall */}
            {!paymentCompleted && (
              <div className="bg-charcoal rounded-xl p-8 text-center mt-10">
                <FileText className="w-10 h-10 mx-auto mb-4 text-white/80" />
                <h3 className="font-serif text-2xl mb-3 text-white">Unlock Your Full PDF Report</h3>
                <p className="text-white/70 mb-6 max-w-md mx-auto font-light">
                  All 4 strengths with action guides, deal-breakers, role territories, and next steps. Download instantly.
                </p>
                
                {/* See example button */}
                <a
                  href="/example-report"
                  target="_blank"
                  className="mb-6 text-white/70 hover:text-white underline text-sm inline-flex items-center gap-2 mx-auto font-light"
                >
                  <Eye className="w-4 h-4" />
                  See example report
                </a>
                
                <div className="mb-6">
                  <span className="text-4xl font-serif text-white">$39</span>
                  <span className="text-white/60 ml-1">AUD</span>
                </div>
                <button
                  onClick={handlePayment}
                  className="bg-white text-charcoal px-8 py-3 rounded-lg font-medium hover:bg-cream transition-colors inline-flex items-center gap-2"
                >
                  Unlock Full Report
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-white/50 mt-4 font-light">Secure payment via Stripe. Instant PDF download.</p>
              </div>
            )}

            {/* PDF Download button after payment */}
            {paymentCompleted && (
              <div className="bg-paper border border-charcoal rounded-xl p-6 text-center mt-10">
                <FileText className="w-10 h-10 mx-auto mb-4 text-charcoal" />
                <h3 className="font-serif text-xl mb-2">Your Report is Ready</h3>
                <p className="text-graphite mb-6 font-light text-sm">
                  Download your full PDF report with all insights.
                </p>
                <button
                  onClick={downloadPDF}
                  disabled={pdfDownloading}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {pdfDownloading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF Report
                    </>
                  )}
                </button>
                {pdfReady && (
                  <p className="mt-3 text-sm text-ash">PDF downloaded successfully.</p>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(0)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              {paymentCompleted && (
                <button
                  onClick={() => setSynthesisScreen(2)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Continue Reading
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Deal-Breakers (paid only)
    if (synthesisScreen === 2 && parsedData?.dealbreakers && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Deal-Breakers</p>
            <h2 className="font-serif text-3xl text-ink mb-3">
              What doesn't work for you
            </h2>
            <p className="text-graphite mb-8 font-light">Use this list when evaluating opportunities.</p>

            <div className="space-y-4">
              {parsedData.dealbreakers.work.length > 0 && (
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <h3 className="font-serif text-lg text-ink mb-3">About the work</h3>
                  <ul className="space-y-2 text-graphite text-sm font-light">
                    {parsedData.dealbreakers.work.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ash mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.job.length > 0 && (
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <h3 className="font-serif text-lg text-ink mb-3">What comes with the job</h3>
                  <ul className="space-y-2 text-graphite text-sm font-light">
                    {parsedData.dealbreakers.job.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ash mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.leadership.length > 0 && (
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <h3 className="font-serif text-lg text-ink mb-3">About leadership</h3>
                  <ul className="space-y-2 text-graphite text-sm font-light">
                    {parsedData.dealbreakers.leadership.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ash mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.environment.length > 0 && (
                <div className="bg-paper border border-silver rounded-lg p-5">
                  <h3 className="font-serif text-lg text-ink mb-3">About the environment</h3>
                  <ul className="space-y-2 text-graphite text-sm font-light">
                    {parsedData.dealbreakers.environment.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ash mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(1)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setSynthesisScreen(3)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Explore Role Territories
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Role Territories (paid only)
    if (synthesisScreen === 3 && parsedData?.territories && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Role Territories</p>
            <h2 className="font-serif text-3xl text-ink mb-3">
              Paths to explore
            </h2>
            <p className="text-graphite mb-8 font-light">These are directions, not prescriptions. Tap to expand.</p>

            <div className="space-y-3">
              {parsedData.territories.map((territory, idx) => (
                <details key={idx} className="group bg-paper border border-silver rounded-lg overflow-hidden">
                  <summary className="cursor-pointer p-5 list-none hover:bg-linen transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg text-ink">{territory.name}</h3>
                      <ArrowRight className="w-5 h-5 text-stone group-open:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 text-graphite text-sm leading-relaxed border-t border-silver pt-4 font-light">
                    {territory.content}
                  </div>
                </details>
              ))}
            </div>

            <p className="text-center text-ash mt-10 font-light">
              You're not limited by your current industry.
            </p>

            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(2)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => setSynthesisScreen(4)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Your Next Steps
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Next Steps (paid only)
    if (synthesisScreen === 4 && parsedData?.nextSteps && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs tracking-widest uppercase text-ash mb-4 font-medium">Next Steps</p>
            <h2 className="font-serif text-3xl text-ink mb-3">
              Your path forward
            </h2>
            <p className="text-graphite mb-10 font-light">You can actually do this.</p>

            <div className="space-y-4">
              {parsedData.nextSteps.map((step, idx) => (
                <div key={idx} className="bg-paper border border-silver rounded-lg p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-charcoal text-cream font-medium flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-lg text-ink mb-1">{step.timeframe}</h3>
                      <p className="text-graphite leading-relaxed font-light">{step.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PDF Download */}
            <div className="bg-paper border border-charcoal rounded-xl p-6 text-center mt-10">
              <FileText className="w-10 h-10 mx-auto mb-4 text-charcoal" />
              <h3 className="font-serif text-xl mb-2">Download Your Report</h3>
              <p className="text-graphite mb-4 font-light text-sm">
                Keep your full report for reference.
              </p>
              <button
                onClick={downloadPDF}
                disabled={pdfDownloading}
                className="btn-primary inline-flex items-center gap-2"
              >
                {pdfDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Download PDF
                  </>
                )}
              </button>
            </div>

            {/* Feedback CTA */}
            <div className="bg-linen border border-silver rounded-xl p-6 text-center mt-6">
              <Sparkles className="w-8 h-8 text-ash mx-auto mb-3" />
              <h3 className="font-serif text-lg text-ink mb-2">Help improve Pathlight</h3>
              <p className="text-graphite text-sm mb-4 font-light">
                You completed the beta! Your feedback makes this better.
              </p>
              <a
                href="https://forms.gle/fUaxKWAMbQZdbXNk7"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-block"
              >
                Take 2-Min Survey
              </a>
            </div>

            <div className="flex justify-start mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(3)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors font-light"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // REGULAR JOURNEY SECTION
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
        <span className="font-serif text-lg text-ink">Pathlight</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-stone font-light">
            {currentSection}/{SECTIONS.length - 1}
          </span>
          <div className="w-20 h-1 bg-silver rounded-full overflow-hidden">
            <div 
              className="h-full bg-charcoal rounded-full transition-all duration-500"
              style={{ width: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Context */}
        <div className="bg-linen px-6 py-6 lg:py-8 border-b border-silver">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs tracking-widest uppercase text-ash mb-3 font-medium">
              {section.subtitle || 'Reflection'}
            </p>
            <h1 className="font-serif text-2xl lg:text-3xl text-ink mb-4">
              {section.title}
            </h1>
            <p className="text-graphite leading-relaxed font-light">
              {section.explainer}
            </p>
            {section.brainDump && (
              <p className="mt-3 text-sm text-stone font-light">
                Tip: Aim for 10+ items. Press Enter after each one.
              </p>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-2xl mx-auto space-y-4">
            {sectionMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                <div className="w-14 h-14 rounded-full bg-linen flex items-center justify-center mb-5 border border-silver">
                  <MessageCircle className="w-6 h-6 text-ash" />
                </div>
                <h3 className="font-serif text-lg text-ink mb-2">
                  {section.brainDump ? 'Start listing' : 'Share your thoughts'}
                </h3>
                <p className="text-stone max-w-sm font-light">
                  {section.brainDump 
                    ? 'One item at a time. No wrong answers.'
                    : 'Write naturally. Take your time.'}
                </p>
              </div>
            ) : (
              sectionMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] message-${msg.role}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
            
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

        {/* Input area */}
        <div className="border-t border-silver bg-paper p-4 lg:p-6">
          <div className="max-w-2xl mx-auto">
            {sectionMessages.length > 0 && (currentAiResponses >= maxAiResponses || section.brainDump) && (
              <div className="mb-4 flex items-center justify-between bg-linen rounded-lg px-5 py-3 border border-silver">
                <div className="flex items-center gap-2 text-sm text-graphite font-light">
                  <Check className="w-4 h-4 text-charcoal" />
                  <span>Ready to continue</span>
                </div>
                <button
                  onClick={nextSection}
                  className="flex items-center gap-2 bg-charcoal hover:bg-ink text-cream px-5 py-2.5 rounded-lg font-medium text-sm transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={section.brainDump ? "Type and press Enter..." : "What comes to mind?"}
                className="input flex-1"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-charcoal hover:bg-ink disabled:bg-silver disabled:text-stone text-cream px-5 rounded-lg transition-all flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-silver flex items-center justify-between text-xs text-stone font-light">
        <button
          onClick={prevSection}
          disabled={currentSection <= 0}
          className="flex items-center gap-2 hover:text-ink disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Private
          </span>
          <button onClick={resetProgress} className="hover:text-ink transition-colors">
            Clear
          </button>
        </div>
      </footer>
    </div>
  );
}
