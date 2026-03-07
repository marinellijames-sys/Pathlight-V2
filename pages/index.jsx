import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Check, AlertCircle, Download, RefreshCw, Lock, MessageCircle } from 'lucide-react';
import Torch from '../components/Torch';

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

  // INTRO - PAGE 0: Landing with animated torch
  if (section.type === 'intro' && introPage === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full text-center fade-in-up">
          {/* Animated torch */}
          <div className="flex justify-center mb-12">
            <Torch size={100} />
          </div>
          
          {/* Brand */}
          <h1 className="text-display text-ink tracking-tight mb-6">
            Pathlight
          </h1>
          
          <p className="text-xl md:text-2xl text-graphite leading-relaxed mb-12 max-w-lg mx-auto">
            Find clarity in your career. Discover what makes you come alive.
          </p>
          
          <button
            onClick={() => setIntroPage(1)}
            className="btn-ember inline-flex items-center gap-3"
          >
            Begin
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="mt-8 text-sm text-stone">
            15 minutes. Your data stays on your device.
          </p>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 1: The problem - direct, warm
  if (section.type === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <h2 className="text-headline text-ink tracking-tight mb-10 text-balance">
            You're here because something isn't quite right.
          </h2>
          
          <div className="space-y-6 text-lg text-graphite leading-relaxed stagger-children">
            <p>Maybe you feel stuck in a role that doesn't fit anymore.</p>
            <p>Maybe you lack direction.</p>
            <p>Maybe you're ready for something bigger but don't know what.</p>
          </div>
          
          <p className="mt-10 text-lg text-ink font-medium">
            That's okay. You're in the right place.
          </p>

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-silver">
            <button
              onClick={() => setIntroPage(0)}
              className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
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
      <div className="min-h-screen bg-mist flex items-center justify-center px-6 py-16">
        <div className="max-w-xl w-full fade-in-up">
          <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-6">
            In 15 minutes
          </p>
          
          <h2 className="text-headline text-ink tracking-tight mb-12">
            What you'll discover
          </h2>
          
          <div className="space-y-0 stagger-children">
            {[
              'What truly energizes you (and what drains you)',
              'Your signature strengths you\'ve been undervaluing',
              'Career paths that align with how you work best'
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4 py-5 border-b border-silver last:border-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ink text-white text-sm font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-lg text-graphite pt-1">{text}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={() => setIntroPage(1)}
              className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
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
      <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-mist flex items-center justify-center">
              <Lock className="w-5 h-5 text-graphite" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-ink">Before we begin</h1>
              <p className="text-sm text-stone">Your privacy is protected</p>
            </div>
          </div>

          <div className="bg-mist rounded-2xl p-6 mb-8">
            <p className="text-sm text-graphite leading-relaxed">
              Your data stays on your device. Responses are processed by AI to generate insights. 
              We don't store your information on our servers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { key: 'terms', text: 'I understand this is a self-reflection tool, not professional career advice' },
              { key: 'age', text: 'I am 18 years of age or older' },
              { key: 'data', text: 'I understand my responses will be processed by AI' }
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-4 cursor-pointer group p-4 rounded-xl border border-silver hover:border-stone transition-colors">
                <div className="pt-0.5">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    consentChecks[item.key] ? 'bg-ink border-ink' : 'border-silver'
                  }`}>
                    {consentChecks[item.key] && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={consentChecks[item.key]}
                    onChange={(e) => setConsentChecks({...consentChecks, [item.key]: e.target.checked})}
                    className="sr-only"
                  />
                </div>
                <span className="text-sm text-graphite leading-relaxed">{item.text}</span>
              </label>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={nextSection}
              disabled={!canProceed}
              className={`w-full py-4 px-6 rounded-full font-medium transition-all ${
                canProceed
                  ? 'btn-primary'
                  : 'bg-silver text-stone cursor-not-allowed'
              }`}
            >
              {canProceed ? 'Continue' : 'Please agree to all items'}
            </button>
            <p className="text-xs text-stone text-center mt-4">
              See our <a href="/privacy" className="text-graphite hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // SCREENER - One question at a time feel
  if (section.type === 'screener') {
    const allAnswered = section.questions.every(q => screenerAnswers[q.id]);
    const answeredCount = section.questions.filter(q => screenerAnswers[q.id]).length;
    
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Progress header */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
          <span className="text-sm font-semibold text-ink tracking-tight">Pathlight</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone font-medium">
              {answeredCount}/{section.questions.length}
            </span>
            <div className="w-16 h-1.5 bg-mist rounded-full overflow-hidden">
              <div 
                className="h-full bg-ember rounded-full transition-all duration-500"
                style={{ width: `${(answeredCount / section.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-xl w-full space-y-12 stagger-children">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="text-center">
                <h3 className="text-xl lg:text-2xl font-semibold text-ink tracking-tight mb-6">{q.question}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleScreenerAnswer(q.id, option)}
                      className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                        screenerAnswers[q.id] === option
                          ? 'bg-ink text-white'
                          : 'bg-mist hover:bg-silver text-graphite'
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
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-16">
          <div className="max-w-md w-full text-center fade-in-up">
            <div className="flex justify-center mb-8">
              <Torch size={80} />
            </div>
            <h2 className="text-headline text-ink tracking-tight mb-4">
              Ready for your results
            </h2>
            <p className="text-graphite mb-10">
              We'll analyze your responses to identify your strengths, suggest paths, and give you next steps.
            </p>
            <button
              onClick={generateSynthesis}
              disabled={isLoading}
              className="btn-ember inline-flex items-center gap-3 w-full justify-center"
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
        <div className="min-h-screen bg-white px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <div className="bg-glow rounded-xl p-4 mb-8 text-sm text-graphite">
              <strong>Note:</strong> These insights are AI-generated to help you reflect. Use them as a starting point.
            </div>

            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-4">Your Profile</p>
            <h2 className="text-headline text-ink tracking-tight mb-8">
              Here's what we see in you
            </h2>

            <div className="text-lg text-graphite leading-relaxed space-y-4 mb-10">
              {parsedData.profile.split('\n').map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>

            <p className="text-xl text-ink font-semibold mb-8">
              You're not stuck. You're at a crossroads with more options than you realize.
            </p>

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

    // Signature Strengths - FREE PREVIEW
    if (synthesisScreen === 1 && parsedData?.superpowers) {
      return (
        <div className="min-h-screen bg-white px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-4">Signature Strengths</p>
            <h2 className="text-headline text-ink tracking-tight mb-3">
              What you've been bringing to the table
            </h2>
            <p className="text-graphite mb-10">Strengths you likely undervalue because they come naturally.</p>

            {/* First strength - unlocked */}
            <div className="bg-glow border border-ember/30 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ember text-white font-semibold flex items-center justify-center">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-ink mb-2">{parsedData.superpowers[0].name}</h3>
                  <p className="text-graphite leading-relaxed mb-4">{parsedData.superpowers[0].description}</p>
                  <details className="group">
                    <summary className="cursor-pointer text-ember font-medium list-none flex items-center gap-2">
                      How to use this
                      <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-4 text-graphite text-sm leading-relaxed space-y-2">
                      {parsedData.superpowers[0].howTo.split('\n').filter(l => l.trim()).map((line, i) => (
                        <p key={i}>{line.replace(/^-\s*/, '').replace(/\*\*/g, '')}</p>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Remaining strengths - locked */}
            {parsedData.superpowers.slice(1, 4).map((power, idx) => (
              <div key={idx} className="relative mb-4">
                <div className="bg-mist rounded-2xl p-6 opacity-50 blur-[2px]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-silver" />
                    <div>
                      <h3 className="text-xl font-semibold text-ink mb-2">{power.name}</h3>
                      <p className="text-graphite">{power.description.substring(0, 80)}...</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
                    <Lock className="w-4 h-4 text-stone" />
                    <span className="text-sm font-medium text-graphite">Locked</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Payment wall */}
            {!paymentCompleted && (
              <div className="bg-ink text-white rounded-2xl p-8 text-center mt-10">
                <h3 className="text-2xl font-semibold mb-3">Unlock Your Complete Report</h3>
                <p className="text-white/80 mb-6 max-w-md mx-auto">
                  All 4 strengths, deal-breakers, role territories, and your concrete next steps.
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$39</span>
                  <span className="text-white/60 ml-1">AUD</span>
                </div>
                <button
                  onClick={handlePayment}
                  className="btn-ember inline-flex items-center gap-2"
                >
                  Unlock Full Report
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-white/50 mt-4">Secure payment via Stripe</p>
              </div>
            )}

            <div className="flex gap-4 justify-between mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(0)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              {paymentCompleted && (
                <button
                  onClick={() => setSynthesisScreen(2)}
                  className="btn-primary inline-flex items-center gap-2"
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
        <div className="min-h-screen bg-white px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-4">Deal-Breakers</p>
            <h2 className="text-headline text-ink tracking-tight mb-3">
              What doesn't work for you
            </h2>
            <p className="text-graphite mb-8">Use this list when evaluating opportunities.</p>

            <div className="space-y-4">
              {parsedData.dealbreakers.work.length > 0 && (
                <div className="border border-silver rounded-xl p-5">
                  <h3 className="font-semibold text-ink mb-3">About the work</h3>
                  <ul className="space-y-2 text-graphite text-sm">
                    {parsedData.dealbreakers.work.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ember mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.job.length > 0 && (
                <div className="border border-silver rounded-xl p-5">
                  <h3 className="font-semibold text-ink mb-3">What comes with the job</h3>
                  <ul className="space-y-2 text-graphite text-sm">
                    {parsedData.dealbreakers.job.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ember mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.leadership.length > 0 && (
                <div className="border border-silver rounded-xl p-5">
                  <h3 className="font-semibold text-ink mb-3">About leadership</h3>
                  <ul className="space-y-2 text-graphite text-sm">
                    {parsedData.dealbreakers.leadership.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ember mt-0.5">-</span>
                        <span>{item.replace(/^- /, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsedData.dealbreakers.environment.length > 0 && (
                <div className="border border-silver rounded-xl p-5">
                  <h3 className="font-semibold text-ink mb-3">About the environment</h3>
                  <ul className="space-y-2 text-graphite text-sm">
                    {parsedData.dealbreakers.environment.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-ember mt-0.5">-</span>
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
        <div className="min-h-screen bg-white px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-4">Role Territories</p>
            <h2 className="text-headline text-ink tracking-tight mb-3">
              Paths to explore
            </h2>
            <p className="text-graphite mb-8">These are directions, not prescriptions. Tap to expand.</p>

            <div className="space-y-3">
              {parsedData.territories.map((territory, idx) => (
                <details key={idx} className="group border border-silver rounded-xl overflow-hidden">
                  <summary className="cursor-pointer p-5 list-none hover:bg-mist transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-ink">{territory.name}</h3>
                      <ArrowRight className="w-5 h-5 text-stone group-open:rotate-90 transition-transform" />
                    </div>
                  </summary>
                  <div className="px-5 pb-5 text-graphite text-sm leading-relaxed border-t border-silver pt-4">
                    {territory.content}
                  </div>
                </details>
              ))}
            </div>

            <p className="text-center text-graphite mt-10">
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
        <div className="min-h-screen bg-white px-6 py-12">
          <div className="max-w-2xl mx-auto fade-in-up">
            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-4">Next Steps</p>
            <h2 className="text-headline text-ink tracking-tight mb-3">
              Your path forward
            </h2>
            <p className="text-graphite mb-10">You can actually do this.</p>

            <div className="space-y-4">
              {parsedData.nextSteps.map((step, idx) => (
                <div key={idx} className="border border-silver rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-ember text-white font-semibold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink mb-1">{step.timeframe}</h3>
                      <p className="text-graphite leading-relaxed">{step.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback CTA */}
            <div className="bg-glow border border-ember/20 rounded-2xl p-6 text-center mt-10">
              <Sparkles className="w-8 h-8 text-ember mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-ink mb-2">Help improve Pathlight</h3>
              <p className="text-graphite text-sm mb-4">
                You completed the beta! Your feedback makes this better.
              </p>
              <a
                href="https://forms.gle/fUaxKWAMbQZdbXNk7"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Take 2-Min Survey
              </a>
            </div>

            <div className="flex justify-start mt-10 pt-6 border-t border-silver">
              <button
                onClick={() => setSynthesisScreen(3)}
                className="flex items-center gap-2 text-stone hover:text-ink transition-colors"
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

  // REGULAR JOURNEY SECTION - Clean, focused
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-silver">
        <span className="text-sm font-semibold text-ink tracking-tight">Pathlight</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-stone font-medium">
            {currentSection}/{SECTIONS.length - 1}
          </span>
          <div className="w-20 h-1.5 bg-mist rounded-full overflow-hidden">
            <div 
              className="h-full bg-ember rounded-full transition-all duration-500"
              style={{ width: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Context - collapsible on mobile */}
        <div className="bg-mist px-6 py-6 lg:py-8 border-b border-silver">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-semibold tracking-widest uppercase text-ember mb-3">
              {section.subtitle || 'Reflection'}
            </p>
            <h1 className="text-2xl lg:text-3xl font-semibold text-ink tracking-tight mb-4">
              {section.title}
            </h1>
            <p className="text-graphite leading-relaxed">
              {section.explainer}
            </p>
            {section.brainDump && (
              <p className="mt-3 text-sm text-stone">
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
                <div className="w-14 h-14 rounded-full bg-mist flex items-center justify-center mb-5">
                  <MessageCircle className="w-6 h-6 text-stone" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">
                  {section.brainDump ? 'Start listing' : 'Share your thoughts'}
                </h3>
                <p className="text-stone max-w-sm">
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
        <div className="border-t border-silver bg-white p-4 lg:p-6">
          <div className="max-w-2xl mx-auto">
            {sectionMessages.length > 0 && (currentAiResponses >= maxAiResponses || section.brainDump) && (
              <div className="mb-4 flex items-center justify-between bg-glow rounded-xl px-5 py-3">
                <div className="flex items-center gap-2 text-sm text-graphite">
                  <Check className="w-4 h-4 text-ember" />
                  <span>Ready to continue</span>
                </div>
                <button
                  onClick={nextSection}
                  className="flex items-center gap-2 bg-ink hover:bg-charcoal text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all"
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
                className="bg-ink hover:bg-charcoal disabled:bg-silver disabled:text-stone text-white px-5 rounded-xl transition-all flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-silver flex items-center justify-between text-xs text-stone">
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
