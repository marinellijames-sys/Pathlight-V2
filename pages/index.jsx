import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Sun, Check, AlertCircle, Download, RefreshCw, Lock, MessageCircle } from 'lucide-react';

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
    maxAiResponses: 1
  },
  {
    id: 'strengths',
    title: 'What You\'re Naturally Good At',
    subtitle: 'That you don\'t realize',
    explainer: 'We\'re terrible at seeing our own strengths because they come easily to us. Think about what people ask you for help with. What do you do that others find difficult but you find simple? Share specific examples.',
    aiContext: 'identifying hidden strengths they undervalue',
    maxAiResponses: 1
  },
  {
    id: 'wins',
    title: 'Your Wins',
    subtitle: 'Building evidence',
    explainer: 'You\'ve accomplished more than you realize. These don\'t need to be work achievements - raising kids, overcoming challenges, learning new skills, helping others. Think of specific moments you\'re proud of.',
    aiContext: 'building confidence through past accomplishments',
    maxAiResponses: 1
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
      
      let systemPrompt = `You are a warm, insightful career coach helping someone discover what truly matters in their work and life.

Current section: "${section.title}" - ${section.aiContext}
Section explainer: ${section.explainer}

Context about this person:
- Career stage: ${screenerAnswers.stage || 'unknown'}
- What brought them here: ${screenerAnswers.trigger || 'unknown'}
- Energy awareness: ${screenerAnswers.energy || 'unknown'}

CRITICAL: This is response ${currentAiResponses + 1} of ${maxAiResponses}.

${section.id === 'energy' ? `
SPECIAL INSTRUCTIONS FOR ENERGY SECTION:
- Probe for BOTH work examples AND life examples
- If they only mention work, ask about life (hobbies, volunteering, etc)
- If they only mention life, ask about work tasks and projects
- Ask about process vs outcome
- Push for SPECIFIC examples and details
- Look for clues about commercial drive (targets, revenue, business outcomes) vs craft/care drive (quality, mastery, helping individuals)
` : ''}

${isLastResponse ? `
This is your FINAL response for this section.

Your role:
- Provide a brief, insightful reflection on what they've shared (2-3 sentences)
- Use pattern language: "It sounds like..." or "What stands out is..." or "There's a theme of..."
- Reference SPECIFIC things they mentioned
- If they mentioned business outcomes/targets/revenue, note: "I'm noticing you're energized by tangible business results"
- If they mentioned craft/care/helping individuals, note: "I'm hearing you're driven by quality and direct impact on people"
- End warmly: "Feel free to add more thoughts or continue when ready."
- Do NOT ask more questions

Example tone:
"It sounds like you're energized by work that involves creative problem-solving and direct collaboration with people. The pattern I'm hearing is that you need both intellectual challenge AND human connection. Feel free to add anything else or move forward when you're ready."
` : `
This is your first response.

Your role:
- Ask ONE focused follow-up question that requests SPECIFIC, DETAILED examples
- Ask for a particular moment, situation, or day
- Ask what they were actually DOING (the activities, not just feelings)
- Ask what SPECIFICALLY made it energizing or draining
- Keep it to 2-3 sentences maximum
- End with: "The more specific you are, the better I can identify patterns."

Good examples:
- "Can you walk me through a specific moment when you felt that energy? What were you actually doing?"
- "Think about a particular project where you felt really engaged. What were you doing? Was it the conversations, the problem-solving, the creating?"
- "Tell me about one time when you felt that drain. What was happening? What specifically made it exhausting?"

ALWAYS end with: "The more specific you are, the better I can identify patterns."

Tone: Warm, curious, directive about wanting specifics.
`}`;

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

Write a 250-word narrative that captures:
- What energizes them (specific activities and outcomes)
- Their core strengths they couldn't see
- What they've proven they can do
- Their drive orientation (if clear): "I'm noticing you're energized by [tangible business outcomes/mastering your craft/directly helping people]..."
- "You're not stuck - you're standing at a crossroads with more options than you realize."

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

  // INTRO - PAGE 0: THE PROBLEM - Full bleed editorial
  if (section.type === 'intro' && introPage === 0) {
    return (
      <div className="min-h-screen bg-linen flex flex-col lg:flex-row">
        {/* Left: Large typography */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="max-w-xl">
            <p className="text-xs font-medium tracking-widest uppercase text-sage mb-8">
              Career Clarity
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-ink font-serif leading-[1.1] mb-8">
              You're here because something isn't quite right.
            </h1>
            <div className="h-px w-16 bg-sage mb-8" />
            <div className="space-y-4 text-lg lg:text-xl text-charcoal/80 leading-relaxed">
              <p>Maybe you feel stuck in a role that doesn't fit anymore.</p>
              <p>Maybe you lack direction.</p>
              <p>Maybe you're ready for something bigger but don't know what.</p>
            </div>
            <button
              onClick={() => setIntroPage(1)}
              className="mt-12 group flex items-center gap-3 text-sage hover:text-sage-dark transition-colors"
            >
              <span className="text-sm font-medium tracking-wide uppercase">Continue</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        {/* Right: Visual element */}
        <div className="hidden lg:flex lg:w-2/5 bg-sage/10 items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-sage/20 flex items-center justify-center">
            <Sun className="w-16 h-16 text-sage" />
          </div>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 1: THE SOLUTION - Clean list
  if (section.type === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-3xl w-full">
          <p className="text-xs font-medium tracking-widest uppercase text-sage mb-4 text-center">
            15 Minutes
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl text-ink text-center font-serif leading-tight mb-16">
            What you'll discover
          </h2>
          
          <div className="space-y-0">
            {[
              { num: '01', text: 'What truly energizes you (and what drains you)' },
              { num: '02', text: 'Your signature strengths you\'ve been undervaluing' },
              { num: '03', text: 'Multiple career paths that align with how you work best' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-baseline gap-6 py-8 border-b border-sand/60 group">
                <span className="text-xs font-mono text-sage tracking-wider">{item.num}</span>
                <p className="text-lg lg:text-xl text-charcoal leading-relaxed group-hover:text-ink transition-colors">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-12 pt-8">
            <button
              onClick={() => setIntroPage(0)}
              className="flex items-center gap-2 text-driftwood hover:text-charcoal transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
            <button
              onClick={() => setIntroPage(2)}
              className="group flex items-center gap-3 bg-sage hover:bg-sage-dark text-cream px-8 py-4 rounded-full transition-all"
            >
              <span className="font-medium">Continue</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 2: THE METHOD - Minimal CTA
  if (section.type === 'intro' && introPage === 2) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage mb-10">
            <Sun className="w-8 h-8 text-cream" />
          </div>

          <h2 className="text-3xl lg:text-4xl text-ink font-serif leading-tight mb-6">
            Pathlight
          </h2>
          
          <p className="text-lg lg:text-xl text-charcoal/80 leading-relaxed mb-4 max-w-lg mx-auto">
            A career clarity tool that identifies your signature strengths and shows you exactly how to leverage them.
          </p>
          
          <p className="text-sm text-driftwood mb-12">
            Your answers are saved locally. Takes about 15 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIntroPage(1)}
              className="px-6 py-3 text-driftwood hover:text-charcoal transition-colors text-sm"
            >
              Back
            </button>
            <button
              onClick={nextSection}
              className="group bg-ink hover:bg-charcoal text-cream px-10 py-4 rounded-full font-medium transition-all flex items-center justify-center gap-3"
            >
              Begin Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONSENT SCREEN - Clean two-column
  if (section.type === 'consent') {
    const canProceed = consentChecks.terms && consentChecks.age && consentChecks.data;

    return (
      <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
        {/* Left: Info */}
        <aside className="lg:w-2/5 bg-linen p-8 lg:p-12 xl:p-16 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
          <div className="max-w-md">
            <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center mb-8">
              <Lock className="w-5 h-5 text-sage" />
            </div>
            
            <h1 className="text-3xl lg:text-4xl text-ink font-serif leading-tight mb-6">
              Your privacy matters
            </h1>
            
            <p className="text-charcoal/80 leading-relaxed mb-8">
              All data stays on your device. We never see your responses. Clearing browser data deletes progress.
            </p>

            <div className="space-y-4 text-sm text-charcoal/70">
              <p className="text-xs font-medium tracking-widest uppercase text-sage mb-3">How it works</p>
              {[
                'AI generates personalized insights from your responses',
                'Data saved locally in your browser only',
                'Responses sent to Anthropic API for processing',
                'Logs may be retained 30 days for safety'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Consent form */}
        <main className="flex-1 p-8 lg:p-12 xl:p-16 flex items-center">
          <div className="max-w-lg mx-auto lg:mx-0 w-full">
            <p className="text-xs font-medium tracking-widest uppercase text-sage mb-8">
              Please confirm
            </p>

            <div className="space-y-6">
              {/* Checkbox items */}
              <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl hover:bg-linen transition-colors">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    consentChecks.terms ? 'bg-sage border-sage' : 'border-stone'
                  }`}>
                    {consentChecks.terms && <Check className="w-3 h-3 text-cream" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={consentChecks.terms}
                    onChange={(e) => setConsentChecks({...consentChecks, terms: e.target.checked})}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm text-charcoal leading-relaxed">
                  I understand this is a self-reflection tool, not professional career advice
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl hover:bg-linen transition-colors">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    consentChecks.age ? 'bg-sage border-sage' : 'border-stone'
                  }`}>
                    {consentChecks.age && <Check className="w-3 h-3 text-cream" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={consentChecks.age}
                    onChange={(e) => setConsentChecks({...consentChecks, age: e.target.checked})}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm text-charcoal leading-relaxed">
                  I am 18 years of age or older
                </span>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl hover:bg-linen transition-colors">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    consentChecks.data ? 'bg-sage border-sage' : 'border-stone'
                  }`}>
                    {consentChecks.data && <Check className="w-3 h-3 text-cream" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={consentChecks.data}
                    onChange={(e) => setConsentChecks({...consentChecks, data: e.target.checked})}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm text-charcoal leading-relaxed">
                  I understand my responses will be processed by AI and won't enter sensitive personal information
                </span>
              </label>
            </div>

            <div className="mt-10 pt-8 border-t border-sand">
              <button
                onClick={nextSection}
                disabled={!canProceed}
                className={`w-full py-4 px-6 rounded-full font-medium transition-all ${
                  canProceed
                    ? 'bg-ink hover:bg-charcoal text-cream'
                    : 'bg-sand text-driftwood cursor-not-allowed'
                }`}
              >
                {canProceed ? 'Continue' : 'Please agree to all items'}
              </button>
              <p className="text-xs text-driftwood text-center mt-4">
                See our <a href="/privacy" className="text-sage hover:underline">Privacy Policy</a> for details
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // SCREENER - Minimal single-question focus
  if (section.type === 'screener') {
    const allAnswered = section.questions.every(q => screenerAnswers[q.id]);
    const answeredCount = section.questions.filter(q => screenerAnswers[q.id]).length;
    
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        {/* Progress header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-sand/50">
          <span className="text-sm text-charcoal font-medium">Pathlight</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-driftwood">
              {answeredCount} of {section.questions.length}
            </span>
            <div className="w-20 h-1 bg-sand rounded-full overflow-hidden">
              <div 
                className="h-full bg-sage rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / section.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-xl w-full">
            <p className="text-xs font-medium tracking-widest uppercase text-sage mb-8 text-center">
              Quick Questions
            </p>
            
            <div className="space-y-10">
              {section.questions.map((q, idx) => (
                <div key={q.id} className="text-center">
                  <h3 className="text-xl lg:text-2xl font-serif text-ink mb-8">{q.question}</h3>
                  <div className="flex flex-wrap justify-center gap-3">
                    {q.options.map(option => (
                      <button
                        key={option}
                        onClick={() => handleScreenerAnswer(q.id, option)}
                        className={`px-6 py-3 rounded-full text-sm transition-all ${
                          screenerAnswers[q.id] === option
                            ? 'bg-sage text-cream'
                            : 'bg-linen hover:bg-sand text-charcoal'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {allAnswered && (
              <div className="mt-16 text-center">
                <button
                  onClick={nextSection}
                  className="group bg-ink hover:bg-charcoal text-cream px-10 py-4 rounded-full font-medium transition-all inline-flex items-center gap-3"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 fade-in">
            <div className="card text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage mb-6 shadow-soft">
                <Sparkles className="w-10 h-10 text-cream" />
              </div>
              <h3 className="text-2xl text-ink mb-3 font-serif">Ready to see your pathways?</h3>
              <p className="text-base text-driftwood mb-8 max-w-md mx-auto leading-relaxed">
                We'll analyze everything you've shared to identify your signature strengths, suggest role territories, and give you concrete next steps.
              </p>
              <button
                onClick={generateSynthesis}
                disabled={isLoading}
                className="btn-primary inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    Generating... (30-45 seconds)
                  </>
                ) : (
                  <>
                    Generate My Pathways
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Profile screen
    if (synthesisScreen === 0 && parsedData) {
      return (
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 fade-in">
            <div className="callout">
              <p className="text-sm font-medium text-charcoal mb-1">
                AI-Generated Insights
              </p>
              <p className="text-xs text-charcoal leading-relaxed">
                This synthesis is AI-generated to help you reflect on your strengths and skills. 
                Use these insights as a starting point for reflection and discussion with career professionals.
              </p>
            </div>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage mb-4 shadow-soft">
                <Sun className="w-8 h-8 text-cream" />
              </div>
              <h2 className="text-3xl text-ink mb-2 font-serif">Your Profile</h2>
            </div>

            <div className="card">
              <div className="prose-kinfolk" style={{ fontSize: '17px', lineHeight: '1.75' }}>
                {parsedData.profile.split('\n').map((para, idx) => (
                  <p key={idx} className="mb-4">{para}</p>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-xl text-charcoal font-serif mb-8">
                You're not stuck. You're standing at a crossroads with more options than you realize.
              </p>
              <button
                onClick={() => setSynthesisScreen(1)}
                className="btn-primary inline-flex items-center gap-2"
              >
                Discover Your Signature Strengths
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Signature Strengths - FREE PREVIEW (1 shown, 3 locked)
    if (synthesisScreen === 1 && parsedData?.superpowers) {
      return (
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage mb-4 shadow-soft">
                <Sparkles className="w-8 h-8 text-cream" />
              </div>
              <h2 className="text-3xl text-ink mb-2 font-serif">Your Signature Strengths</h2>
              <p className="text-driftwood">Look at what you've been bringing to the table all along</p>
            </div>

            {/* Show first strength fully */}
            <div className="bg-sage/10 rounded-2xl p-8 shadow-soft border border-sage/30">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage flex items-center justify-center text-cream text-xl font-medium">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl text-ink mb-3 font-serif">{parsedData.superpowers[0].name}</h3>
                  <p className="text-charcoal mb-4 leading-relaxed" style={{ fontSize: '17px', lineHeight: '1.75' }}>
                    {parsedData.superpowers[0].description}
                  </p>
                  <details className="group">
                    <summary className="cursor-pointer text-sage-dark font-medium hover:text-sage list-none flex items-center gap-2 transition-medium">
                      How to use this
                      <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-4 pl-4 text-charcoal text-sm leading-relaxed space-y-3">
                      {parsedData.superpowers[0].howTo.split('\n').map((line, lineIdx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        
                        const bulletMatch = trimmed.match(/^-\s+\*\*([^*]+)\*\*[:\s]+(.*)/);
                        if (bulletMatch) {
                          const label = bulletMatch[1].replace(/:$/, '');
                          return (
                            <div key={lineIdx} className="flex gap-2">
                              <span className="text-sage font-bold mt-0.5">•</span>
                              <div>
                                <span className="font-medium text-ink">{label}:</span>
                                <span className="ml-1">{bulletMatch[2]}</span>
                              </div>
                            </div>
                          );
                        }
                        
                        return <p key={lineIdx}>{trimmed}</p>;
                      })}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Show remaining 3 locked */}
            {parsedData.superpowers.slice(1, 4).map((power, idx) => (
              <div key={idx} className="relative">
                <div className="bg-linen rounded-2xl p-8 shadow-soft opacity-40 blur-sm pointer-events-none">
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage flex items-center justify-center text-cream text-xl font-medium">
                      {idx + 2}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl text-ink mb-3 font-serif">{power.name}</h3>
                      <p className="text-charcoal leading-relaxed">
                        {power.description.substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-cream rounded-xl p-6 shadow-soft-lg text-center">
                    <Lock className="w-8 h-8 text-sage mx-auto mb-2" />
                    <p className="text-sm text-charcoal font-medium">Unlock with full report</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Payment wall */}
            {!paymentCompleted && (
              <div className="card text-center space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage/15 mb-4">
                  <Sparkles className="w-8 h-8 text-sage" />
                </div>
                <h3 className="text-2xl text-ink font-serif">Unlock Your Complete Report</h3>
                <p className="text-base text-charcoal leading-relaxed max-w-lg mx-auto">
                  Get all 4 signature strengths, how they work together, your deal-breakers, 
                  5-7 role territories to explore, and your next 3 concrete steps.
                </p>
                <div className="bg-sage/10 rounded-xl p-5 max-w-md mx-auto">
                  <p className="text-3xl font-semibold text-sage-dark mb-1">$39 AUD</p>
                  <p className="text-sm text-driftwood">One-time payment - Instant access</p>
                </div>
                <button
                  onClick={handlePayment}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Unlock Full Report
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-driftwood">Secure payment via Stripe</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setSynthesisScreen(0)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              {paymentCompleted && (
                <button
                  onClick={() => setSynthesisScreen(2)}
                  className="btn-primary flex items-center gap-2"
                >
                  See Deal-Breakers
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
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terracotta/15 mb-4 shadow-soft">
                <AlertCircle className="w-8 h-8 text-terracotta" />
              </div>
              <h2 className="text-3xl text-ink mb-2 font-serif">Your Deal-Breakers</h2>
              <p className="text-driftwood">You've learned what doesn't work. That's wisdom.</p>
            </div>

            <div className="bg-terracotta/10 rounded-xl p-8 text-center mb-6 border-l-2 border-terracotta">
              <p className="text-charcoal text-lg leading-relaxed">
                Use this list when evaluating opportunities. Even if a role looks perfect, if it has these elements, you'll end up miserable again.
              </p>
            </div>

            <div className="grid gap-6">
              {parsedData.dealbreakers.work.length > 0 && (
                <div className="card border-l-4 border-terracotta">
                  <h3 className="text-lg font-medium text-ink mb-3 flex items-center gap-2">
                    About the work
                  </h3>
                  <ul className="space-y-2 text-charcoal text-sm">
                    {parsedData.dealbreakers.work.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-terracotta mt-1">•</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.job.length > 0 && (
                <div className="card border-l-4 border-terracotta">
                  <h3 className="text-lg font-medium text-ink mb-3">
                    What comes with the job
                  </h3>
                  <ul className="space-y-2 text-charcoal text-sm">
                    {parsedData.dealbreakers.job.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-terracotta mt-1">•</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.leadership.length > 0 && (
                <div className="card border-l-4 border-terracotta">
                  <h3 className="text-lg font-medium text-ink mb-3">
                    About leadership
                  </h3>
                  <ul className="space-y-2 text-charcoal text-sm">
                    {parsedData.dealbreakers.leadership.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-terracotta mt-1">•</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.environment.length > 0 && (
                <div className="card border-l-4 border-terracotta">
                  <h3 className="text-lg font-medium text-ink mb-3">
                    About the environment
                  </h3>
                  <ul className="space-y-2 text-charcoal text-sm">
                    {parsedData.dealbreakers.environment.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-terracotta mt-1">•</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setSynthesisScreen(1)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={() => setSynthesisScreen(3)}
                className="btn-primary flex items-center gap-2"
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
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage mb-4 shadow-soft">
                <Sparkles className="w-8 h-8 text-cream" />
              </div>
              <h2 className="text-3xl text-ink mb-2 font-serif">Role Territories to Explore</h2>
              <p className="text-driftwood">Here are territories waiting for someone exactly like you</p>
            </div>

            <div className="space-y-4">
              {parsedData.territories.map((territory, idx) => (
                <details key={idx} className="group card overflow-hidden">
                  <summary className="cursor-pointer hover:bg-sand/50 transition-medium list-none -m-10 sm:-m-12 p-10 sm:p-12">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl text-ink mb-1 font-serif">{territory.name}</h3>
                        <p className="text-sm text-driftwood">Click to explore</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-driftwood group-open:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="text-charcoal text-sm leading-relaxed whitespace-pre-wrap border-t border-sand pt-6 -mx-10 sm:-mx-12 px-10 sm:px-12 -mb-10 sm:-mb-12 pb-10 sm:pb-12">
                    <div>{territory.content}</div>
                  </div>
                </details>
              ))}
            </div>

            <div className="text-center pt-8">
              <p className="text-lg text-charcoal mb-8 max-w-xl mx-auto">
                You're not limited by your current industry. These are territories to explore, not prescriptions.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setSynthesisScreen(2)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  onClick={() => setSynthesisScreen(4)}
                  className="btn-primary flex items-center gap-2"
                >
                  Get Your Next Steps
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Next Steps (paid only)
    if (synthesisScreen === 4 && parsedData?.nextSteps && paymentCompleted) {
      return (
        <div className="min-h-screen bg-cream">
          <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage mb-4 shadow-soft">
                <Check className="w-8 h-8 text-cream" />
              </div>
              <h2 className="text-3xl text-ink mb-2 font-serif">Your Path Forward</h2>
              <p className="text-driftwood">You can actually do this</p>
            </div>

            <div className="space-y-6">
              {parsedData.nextSteps.map((step, idx) => (
                <div key={idx} className="card">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage flex items-center justify-center text-cream font-medium text-lg shadow-soft">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-ink mb-2">{step.timeframe}</h3>
                      <p className="text-charcoal leading-relaxed">{step.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card bg-sage/10 text-center border-l-2 border-sage">
              <Sparkles className="w-10 h-10 text-sage mx-auto mb-4" />
              <h3 className="text-xl text-ink mb-3 font-serif">Help Improve Pathlight</h3>
              <p className="text-charcoal mb-6 leading-relaxed">
                You just completed the beta version! Your feedback will help make this better for others.
              </p>
              <a
                href="https://forms.gle/fUaxKWAMbQZdbXNk7"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Take 2-Minute Survey
              </a>
              <p className="text-xs text-driftwood mt-4">Your honest feedback helps. Thanks!</p>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <button
                onClick={() => setSynthesisScreen(3)}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // REGULAR JOURNEY SECTION - Editorial Design
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-sand/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center">
            <Sun className="w-4 h-4 text-cream" />
          </div>
          <span className="text-sm font-medium text-charcoal tracking-wide">Pathlight</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs text-driftwood tracking-widest uppercase">
            Step {currentSection} of {SECTIONS.length - 1}
          </span>
          <div className="w-24 h-1 bg-sand rounded-full overflow-hidden">
            <div 
              className="h-full bg-sage rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content - two column on desktop */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Context panel */}
        <aside className="lg:w-2/5 xl:w-1/3 bg-linen p-8 lg:p-12 lg:sticky lg:top-0 lg:h-screen lg:overflow-auto">
          <div className="max-w-md mx-auto lg:mx-0">
            <p className="text-xs text-sage font-medium tracking-widest uppercase mb-6">
              {section.subtitle || 'Reflection'}
            </p>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-ink font-serif leading-tight mb-8">
              {section.title}
            </h1>
            
            <div className="prose-kinfolk">
              <p className="text-charcoal/80 leading-relaxed text-base lg:text-lg">
                {section.explainer}
              </p>
            </div>

            {/* Prompts/hints */}
            {section.brainDump && (
              <div className="mt-8 p-5 bg-cream rounded-xl">
                <p className="text-xs text-sage font-medium tracking-wider uppercase mb-3">Tips</p>
                <ul className="space-y-2 text-sm text-charcoal/70">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                    <span>Aim for 10+ items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                    <span>Press Enter after each one</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-sage mt-2 flex-shrink-0" />
                    <span>No idea is too small</span>
                  </li>
                </ul>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-sand/50">
              <p className="text-xs text-driftwood flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Your responses stay on your device
              </p>
            </div>
          </div>
        </aside>

        {/* Right: Conversation */}
        <main className="flex-1 flex flex-col bg-cream lg:border-l border-sand/50">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
              {sectionMessages.length === 0 ? (
                /* Beautiful empty state */
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mb-6">
                    <MessageCircle className="w-7 h-7 text-sage" />
                  </div>
                  <h3 className="text-xl font-serif text-ink mb-3">
                    {section.brainDump ? 'Start listing your thoughts' : 'Begin your reflection'}
                  </h3>
                  <p className="text-driftwood max-w-sm leading-relaxed">
                    {section.brainDump 
                      ? 'Type one item at a time and press Enter. There are no wrong answers here.'
                      : 'Take your time. Write naturally, as if you were talking to a thoughtful friend.'}
                  </p>
                </div>
              ) : (
                /* Messages */
                sectionMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
                        msg.role === 'user'
                          ? 'bg-sage text-cream rounded-2xl rounded-br-md'
                          : 'bg-linen text-charcoal rounded-2xl rounded-bl-md'
                      } px-5 py-4 shadow-sm`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-linen text-charcoal rounded-2xl rounded-bl-md px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-sage/60 rounded-full animate-pulse" />
                      <span className="w-2 h-2 bg-sage/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-sage/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area - fixed at bottom */}
          <div className="border-t border-sand/50 bg-cream p-4 lg:p-6">
            <div className="max-w-2xl mx-auto">
              {/* Continue button when ready */}
              {sectionMessages.length > 0 && (currentAiResponses >= maxAiResponses || section.brainDump) && (
                <div className="mb-4 flex items-center justify-between bg-sage/5 rounded-xl px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-charcoal">
                    <Check className="w-4 h-4 text-sage" />
                    <span>Ready to continue, or add more thoughts</span>
                  </div>
                  <button
                    onClick={nextSection}
                    className="flex items-center gap-2 bg-sage hover:bg-sage-dark text-cream px-5 py-2.5 rounded-lg font-medium text-sm transition-all"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={section.brainDump ? "Type an item and press Enter..." : "What comes to mind?"}
                    className="w-full px-5 py-4 rounded-xl bg-linen border-0 text-charcoal placeholder-driftwood focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all text-base"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !userInput.trim()}
                  className="bg-sage hover:bg-sage-dark disabled:bg-sand disabled:text-driftwood text-cream px-5 rounded-xl transition-all flex items-center justify-center"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-sand/50 flex items-center justify-between text-xs text-driftwood">
        <button
          onClick={prevSection}
          disabled={currentSection <= 0}
          className="flex items-center gap-2 hover:text-charcoal disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
        <div className="flex items-center gap-4">
          <a href="/privacy" className="hover:text-charcoal transition-colors">Privacy</a>
          <span className="text-sand">|</span>
          <button onClick={resetProgress} className="hover:text-charcoal transition-colors">
            Clear data
          </button>
        </div>
      </footer>
    </div>
  );
}
