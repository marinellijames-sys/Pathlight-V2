import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Sun, Check, AlertCircle, Download, RefreshCw, Lock } from 'lucide-react';

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

  // INTRO - PAGE 0: THE PROBLEM
  if (section.type === 'intro' && introPage === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-12 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage mb-8 shadow-soft">
            <Sun className="w-10 h-10 text-cream" />
          </div>
          
          <div className="space-y-8">
            <h1 className="text-4xl sm:text-5xl text-ink leading-tight font-serif">
              You're here because something isn't quite right.
            </h1>
            
            <div className="space-y-4 text-lg sm:text-xl text-charcoal leading-relaxed max-w-xl mx-auto">
              <p>Maybe you feel stuck in a role that doesn't fit anymore.</p>
              <p>Maybe you lack direction.</p>
              <p>Maybe you're ready for something bigger but don't know what.</p>
            </div>
          </div>

          <button
            onClick={() => setIntroPage(1)}
            className="btn-primary inline-flex items-center gap-3 mt-12"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 1: THE SOLUTION
  if (section.type === 'intro' && introPage === 1) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-2xl w-full fade-in">
          <h2 className="text-3xl sm:text-4xl text-ink text-center mb-12 font-serif">
            In the next 15 minutes, you'll discover:
          </h2>
          
          <div className="card space-y-8">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sage/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-sage"></span>
              </div>
              <p className="text-lg text-charcoal leading-relaxed pt-1.5">
                What truly energizes you (and what drains you)
              </p>
            </div>
            
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sage/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-sage"></span>
              </div>
              <p className="text-lg text-charcoal leading-relaxed pt-1.5">
                Your signature strengths you've been undervaluing
              </p>
            </div>
            
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sage/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-sage"></span>
              </div>
              <p className="text-lg text-charcoal leading-relaxed pt-1.5">
                Multiple career paths that align with how you work best
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-12">
            <button
              onClick={() => setIntroPage(0)}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={() => setIntroPage(2)}
              className="btn-primary flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // INTRO - PAGE 2: THE METHOD
  if (section.type === 'intro' && introPage === 2) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-10 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage mb-6 shadow-soft">
            <Sun className="w-10 h-10 text-cream" />
          </div>

          <div className="space-y-6">
            <p className="text-lg text-charcoal leading-relaxed">
              Pathlight is a career clarity tool that identifies your signature strengths - 
              the unique skills you've been undervaluing - and shows you exactly how to 
              leverage them in your career.
            </p>
            
            <p className="text-base text-driftwood">
              Your answers are saved as you go. This takes 15 minutes.
            </p>
          </div>

          <div className="flex gap-4 justify-center pt-6">
            <button
              onClick={() => setIntroPage(1)}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={nextSection}
              className="btn-primary flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CONSENT SCREEN
  if (section.type === 'consent') {
    const canProceed = consentChecks.terms && consentChecks.age && consentChecks.data;

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="max-w-2xl w-full fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-sage mb-6 shadow-soft">
              <Lock className="w-9 h-9 text-cream" />
            </div>
            <h1 className="text-3xl sm:text-4xl mb-2 text-ink font-serif">
              Before We Begin
            </h1>
            <p className="text-driftwood">Please read and agree to continue</p>
          </div>

          <div className="card space-y-6">
            <div className="callout">
              <p className="text-sm font-medium text-charcoal mb-2">
                Your privacy is protected
              </p>
              <p className="text-xs text-charcoal leading-relaxed">
                All data stays on your device. We never see your responses. 
                Note: Clearing your browser data will delete your progress. Bookmark this page to return.
              </p>
            </div>

            <div className="space-y-3 text-sm text-charcoal">
              <p className="font-medium">How Pathlight Works:</p>
              <ul className="space-y-2.5 ml-1">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                  <span>Your responses are processed using AI to generate personalized insights</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                  <span>Data is saved locally in your browser only - we don't store it on our servers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                  <span>Your responses are sent to Anthropic's API for real-time AI processing</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                  <span>Anthropic may retain logs for up to 30 days for safety and abuse prevention</span>
                </li>
              </ul>
            </div>

            <div className="callout">
              <p className="text-sm font-medium text-charcoal mb-2">
                This is a Self-Reflection Tool
              </p>
              <p className="text-xs text-charcoal leading-relaxed mb-2">
                Pathlight helps you understand your strengths and skills through AI-powered reflection. 
                It does not provide professional career counseling or specific career advice.
              </p>
              <p className="text-xs text-charcoal font-medium">
                For professional guidance on career decisions, consult a qualified career counselor.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChecks.terms}
                  onChange={(e) => setConsentChecks({...consentChecks, terms: e.target.checked})}
                  className="mt-1 h-4 w-4 rounded border-stone text-sage focus:ring-sage cursor-pointer"
                />
                <span className="text-sm text-charcoal group-hover:text-ink transition-medium">
                  I understand this is a self-reflection tool, not professional career advice. 
                  I will not make significant career decisions based solely on AI-generated insights.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChecks.age}
                  onChange={(e) => setConsentChecks({...consentChecks, age: e.target.checked})}
                  className="mt-1 h-4 w-4 rounded border-stone text-sage focus:ring-sage cursor-pointer"
                />
                <span className="text-sm text-charcoal group-hover:text-ink transition-medium">
                  I confirm that I am <strong>18 years of age or older</strong>.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentChecks.data}
                  onChange={(e) => setConsentChecks({...consentChecks, data: e.target.checked})}
                  className="mt-1 h-4 w-4 rounded border-stone text-sage focus:ring-sage cursor-pointer"
                />
                <span className="text-sm text-charcoal group-hover:text-ink transition-medium">
                  I understand my responses will be processed by AI and may be retained for up to 30 days. 
                  I will not enter sensitive personal information (financial data, health records, etc.).
                </span>
              </label>
            </div>

            <p className="text-xs text-driftwood text-center pt-2">
              By continuing, you consent to the processing of your responses as described above. 
              See our <a href="/privacy" className="text-sage hover:text-sage-dark transition-fast underline underline-offset-2">Privacy Policy</a> for details.
            </p>

            <button
              onClick={nextSection}
              disabled={!canProceed}
              className={`w-full py-4 px-6 rounded-xl font-medium text-base transition-medium ${
                canProceed
                  ? 'btn-primary'
                  : 'bg-sand text-driftwood cursor-not-allowed'
              }`}
            >
              {canProceed ? 'I Agree & Continue' : 'Please agree to all items above'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREENER
  if (section.type === 'screener') {
    const allAnswered = section.questions.every(q => screenerAnswers[q.id]);
    
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto px-6 py-16 fade-in">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl text-ink mb-2 font-serif">
              {section.title}
            </h2>
            <p className="text-driftwood">This helps us personalize your journey</p>
          </div>

          <div className="space-y-6">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="card">
                <h3 className="text-lg font-medium text-ink mb-5">{q.question}</h3>
                <div className="space-y-2.5">
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleScreenerAnswer(q.id, option)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl transition-medium text-sm ${
                        screenerAnswers[q.id] === option
                          ? 'bg-sage text-cream shadow-soft'
                          : 'bg-sand/50 hover:bg-sand text-charcoal'
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
            <div className="mt-10 flex justify-center">
              <button
                onClick={nextSection}
                className="btn-primary"
              >
                Continue
              </button>
            </div>
          )}
        </div>
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

  // REGULAR JOURNEY SECTION
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-6 py-16 fade-in">
        <div className="callout mb-6 text-center">
          <p className="text-xs text-charcoal">
            <strong>Private:</strong> Your data stays on your device  -  Bookmark this page to save progress
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-driftwood font-medium">
              {currentSection} of {SECTIONS.length - 1}
            </span>
          </div>
          <div className="progress-bar h-1.5">
            <div 
              className="progress-fill h-full"
              style={{ width: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl text-ink mb-1 font-serif">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-lg text-driftwood">{section.subtitle}</p>
          )}
        </div>

        <div className="callout mb-8">
          <p className="text-charcoal leading-relaxed">{section.explainer}</p>
        </div>

        <div className="card min-h-[400px] flex flex-col">
          <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-96">
            {sectionMessages.length === 0 && (
              <div className="text-center py-16 text-driftwood text-sm">
                {section.brainDump ? 'List everything that comes to mind...' : 'Share your thoughts below...'}
              </div>
            )}
            {sectionMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user'
                    ? 'message-user ml-8 sm:ml-12'
                    : 'message-ai mr-8 sm:mr-12'
                } transition-medium`}
              >
                <div className="leading-relaxed whitespace-pre-wrap text-sm">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-ai mr-8 sm:mr-12">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-sage rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {sectionMessages.length > 0 && (currentAiResponses >= maxAiResponses || section.brainDump) && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={nextSection}
                className="btn-primary"
              >
                {section.brainDump && sectionMessages.length < 5 
                  ? `Add more (aim for 10+ items)` 
                  : 'Continue to next section'}
              </button>
            </div>
          )}

          <div className="space-y-3">
            {currentAiResponses >= maxAiResponses && !section.brainDump && (
              <div className="bg-sage/10 rounded-xl p-3 text-xs text-charcoal flex items-center gap-2">
                <Check className="w-4 h-4 text-sage" />
                <span>Add more thoughts or continue when ready</span>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-sand">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={section.brainDump ? "Type and press Enter (aim for 10+ items)" : "Type your reflection..."}
                className="flex-1 px-4 py-3 rounded-xl border border-sand focus:outline-none focus:ring-sage bg-cream text-charcoal placeholder-driftwood text-sm transition-medium"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-sage hover:bg-sage-dark disabled:opacity-30 text-cream p-3 rounded-xl transition-medium shadow-soft"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={prevSection}
            disabled={currentSection <= 0}
            className="flex items-center gap-2 text-driftwood hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed transition-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <button
            onClick={resetProgress}
            className="text-xs text-driftwood hover:text-charcoal transition-medium"
          >
            Clear My Data
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-driftwood">
          <a href="/privacy" className="hover:text-charcoal transition-medium">Privacy Policy</a>
          {' - '}
          <a href="/terms" className="hover:text-charcoal transition-medium">Terms of Service</a>
          {' - '}
          <span>Your data stays on your device</span>
        </div>
      </div>
    </div>
  );
}
