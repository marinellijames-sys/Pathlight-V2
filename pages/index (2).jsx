import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowRight, ArrowLeft, Sparkles, Sun, Check, AlertCircle, Download, RefreshCw } from 'lucide-react';

// Journey structure
const SECTIONS = [
  {
    id: 'consent',
    title: 'Privacy & Consent',
    type: 'consent'
  },
  {
    id: 'welcome',
    title: 'Welcome to Pathlight',
    type: 'intro'
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
    explainer: 'Energy is your compass. Think about work first - what tasks, projects, or situations make you feel alive? But also look beyond work: hobbies, volunteering, daily activities. Are you energized by the process or the outcome? For example, do you like cleaning because you enjoy organizing, or because you love the clean result? The more specific examples you share, the better we can identify your patterns.',
    aiContext: 'exploring what energizes and drains them across work and life'
  },
  {
    id: 'strengths',
    title: 'What You\'re Naturally Good At',
    subtitle: 'That you don\'t realize',
    explainer: 'We\'re terrible at seeing our own strengths because they come easily to us. Think about what people ask you for help with. What do you do that others find difficult but you find simple? Share specific examples - the more detail, the clearer the patterns.',
    aiContext: 'identifying hidden strengths they undervalue'
  },
  {
    id: 'wins',
    title: 'Your Wins',
    subtitle: 'Building evidence',
    explainer: 'You\'ve accomplished more than you realize. These don\'t need to be work achievements - raising kids, overcoming challenges, learning new skills, helping others. Think of specific moments you\'re proud of. You CAN do hard things.',
    aiContext: 'building confidence through past accomplishments'
  },
  {
    id: 'unlimited',
    title: 'Dream Without Limits',
    subtitle: 'Think bigger',
    explainer: 'Life gets on top of us and we play small. If nothing was in your way - money, time, responsibilities all handled - what would your work and life look like? Be specific about what you want. Think big. You can achieve your goals too quickly if you aim too low.',
    aiContext: 'encouraging them to think beyond current constraints'
  },
  {
    id: 'dealbreakers',
    title: 'Your Deal-Breakers',
    subtitle: 'What made you miserable before',
    explainer: 'The best way to know what you DON\'T want is to look at what\'s made you miserable. Think about jobs, bosses, work environments - what made you dread Monday mornings? What specific situations drained you? These aren\'t weaknesses in you - they\'re signals. Be specific about what didn\'t work.',
    aiContext: 'identifying non-negotiables from past negative experiences'
  },
  {
    id: 'synthesis',
    title: 'Your Pathways Forward',
    type: 'synthesis'
  }
];

export default function Pathlight() {
  const [currentSection, setCurrentSection] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [conversations, setConversations] = useState({});
  const [screenerAnswers, setScreenerAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const [aiResponseCount, setAiResponseCount] = useState({});
  const [synthesisGenerated, setSynthesisGenerated] = useState(false);
  const [synthesisScreen, setSynthesisScreen] = useState(0);
  const [consentChecks, setConsentChecks] = useState({
    terms: false,
    age: false,
    data: false
  });
  const messagesEndRef = useRef(null);

  const MAX_AI_RESPONSES = 2;

  // Parse synthesis markdown into structured data
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
      // Extract profile
      const profileMatch = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Superpowers|$)/);
      if (profileMatch) sections.profile = profileMatch[1].trim();

      // Extract superpowers section
      const superpowersSection = content.match(/## Your Superpowers\n\n([\s\S]*?)(?=\n## Your Deal-Breakers|$)/);
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

      // Extract deal-breakers
      const dealbreakersSection = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories|$)/);
      if (dealbreakersSection) {
        const text = dealbreakersSection[1];
        const workMatch = text.match(/\*\*âŒ About the work:\*\*\n([\s\S]*?)(?=\n\*\*âŒ|$)/);
        const jobMatch = text.match(/\*\*âŒ What comes with the job:\*\*\n([\s\S]*?)(?=\n\*\*âŒ|$)/);
        const leadershipMatch = text.match(/\*\*âŒ About leadership:\*\*\n([\s\S]*?)(?=\n\*\*âŒ|$)/);
        const environmentMatch = text.match(/\*\*âŒ About the environment:\*\*\n([\s\S]*?)(?=\n\*|$)/);
        
        if (workMatch) sections.dealbreakers.work = workMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (jobMatch) sections.dealbreakers.job = jobMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (leadershipMatch) sections.dealbreakers.leadership = leadershipMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
        if (environmentMatch) sections.dealbreakers.environment = environmentMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => l.trim());
      }

      // Extract territories
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

      // Extract next steps
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

  // CRITICAL FIX: Load progress from localStorage on mount
  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, currentSection]);

  // CRITICAL FIX: Load saved progress
  const loadProgress = () => {
    try {
      const saved = localStorage.getItem('pathlight-progress');
      if (saved) {
        const data = JSON.parse(saved);
        setConversations(data.conversations || {});
        setScreenerAnswers(data.screenerAnswers || {});
        setCurrentSection(data.currentSection || 0);
        setAiResponseCount(data.aiResponseCount || {});
        setSynthesisGenerated(data.synthesisGenerated || false);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  // CRITICAL FIX: Save progress to localStorage
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

  // CRITICAL FIX: Reset progress
  const resetProgress = () => {
    if (confirm('Start a fresh journey? All your progress will be reset.')) {
      localStorage.removeItem('pathlight-progress');
      setConversations({});
      setScreenerAnswers({});
      setCurrentSection(0);
      setAiResponseCount({});
      setSynthesisGenerated(false);
    }
  };

  const section = SECTIONS[currentSection];
  const sectionMessages = conversations[section.id] || [];
  const currentAiResponses = aiResponseCount[section.id] || 0;

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
    
    if (currentAiResponses >= MAX_AI_RESPONSES) {
      await saveProgress(newConversations, currentSection, aiResponseCount, screenerAnswers, synthesisGenerated);
      return;
    }
    
    setIsLoading(true);

    try {
      const isLastResponse = currentAiResponses + 1 === MAX_AI_RESPONSES;
      
      let systemPrompt = `You are a warm, direct career coach. Keep responses SHORT and conversational.

Current section: "${section.title}" - ${section.aiContext}
Section explainer: ${section.explainer}

Context about this person:
- Career stage: ${screenerAnswers.stage || 'unknown'}
- What brought them here: ${screenerAnswers.trigger || 'unknown'}
- Energy awareness: ${screenerAnswers.energy || 'unknown'}

CRITICAL: This is response ${currentAiResponses + 1} of ${MAX_AI_RESPONSES}.

${section.id === 'energy' ? `
ENERGY SECTION FOCUS:
- Ask about BOTH work AND life examples
- Probe for process vs outcome (do they like the doing or the result?)
- Look for clues: commercial drive (targets, deals, revenue) vs craft drive (quality, mastery, helping individuals)
- Keep questions SHORT and specific
` : ''}

${isLastResponse ? `
This is your FINAL response.

Your response should be 2-3 sentences maximum:
- Brief pattern you noticed: "It sounds like..." or "What stands out is..."
- Reference SPECIFIC things they mentioned (not generic summaries)
- End warmly: "Feel free to add more or continue when ready."
- Do NOT ask more questions

Example:
"It sounds like you're energized by solving problems that have clear business impact. You need both the intellectual challenge AND the tangible result. Feel free to add anything else or move forward when you're ready."
` : `
This is your first response.

Your response should be 1-2 sentences + ONE focused question:
- Ask for a concrete example (not "tell me about a specific time")
- Use casual language: "Give me an example..." or "Walk me through a moment when..."
- Focus on WHAT they were doing, not how they felt
- End with: "The more specific, the better."

Good examples:
- "Give me an example of a day when you felt that energy. What were you actually doing?"
- "Walk me through a project where you felt engaged. What specifically made it click?"
- "Think of a time you felt drained. What was happening?"

NEVER say:
- "Tell me about a specific time..."
- "Can you elaborate?"
- "That's really interesting, can you share more?"

Keep it SHORT. One question only. Be conversational.
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
- If they mention targets, revenue, business outcomes, winning, deals â†’ They're commercially driven (close to P&L)
- If they mention craft, quality, helping individuals, mastering skills â†’ They're craft/care driven (far from P&L)
- If both or unclear â†’ They may be in the middle (product, operations, customer success type roles)

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

## Your Superpowers

Identify 3-4 unique combinations of their strengths. Name each one distinctively and concretely.

CRITICAL NAMING RULES:
- DO NOT use abstract labels like "Strategic Thinker", "People Person", "Problem Solver"
- DO NOT use frameworks (Gallup, Lominger, generic competencies)
- DO use names that describe the SPECIFIC ACTION or OUTCOME: "The Invisible Architect", "Chaos Navigator", "People Accelerator", "Deal Closer", "System Builder"
- Base the name on ACTUAL things they said they do, not abstract concepts
- Make it memorable and ownable - they should be able to say "Yeah, that's exactly what I do"

For each superpower:
### **[Concrete Superpower Name]**

2-3 sentence description that references SPECIFIC things they mentioned doing.

*How to deploy this:*
- **This week:** [Specific action they can take this week]
- **In interviews:** [Exact language they can use, with "Say:" followed by quote]
- **Roles that leverage this:** [3-5 specific role types]
- **Why it's valuable:** [Why this matters to businesses, with specific business impact]

**Why these matter together:**
[Explain their unique combination - 2-3 sentences about how these superpowers work together]

**Your unique value proposition:**
"[One compelling sentence in quotes that captures their distinct value]"

## Your Deal-Breakers

*Use this list when evaluating opportunities. Even if a role looks perfect, if it has these elements, you'll end up miserable again.*

Based on what made them miserable, identify the KEY themes and consolidate to 3 MAXIMUM per category. Be ruthlessly selective - only include the most important deal-breakers.

Make each point:
- SHORT (10 words or less)
- PUNCHY (direct, no fluff)
- UNAPOLOGETIC (this is non-negotiable)
- SPECIFIC to what they actually said

Format:
**âŒ About the work:**
- [Specific deal-breaker from their experience]
- [Specific deal-breaker from their experience]
- [Specific deal-breaker from their experience]

**âŒ What comes with the job:**
- [Max 3 points about conditions: hours, travel, flexibility, commute]

**âŒ About leadership:**
- [Max 3 points about management styles they can't tolerate]

**âŒ About the environment:**
- [Max 3 points about culture/team dynamics to avoid]

Example good points:
- "Micromanagement - you need autonomy"
- "No clear strategy - chaos drains you"
- "More than 20% travel"

Example bad points (too long):
- "Working in environments where there is constant uncertainty and leadership doesn't provide clear direction which makes it hard to do your best work"

## Role Territories to Explore

Suggest 5-7 specific ROLE TERRITORIES (not vague career paths). 

CRITICAL: Match territories to their drive orientation:
- If commercially driven â†’ Sales, Revenue Operations, Commercial Strategy, Business Development, Account Management
- If craft/care driven â†’ Specialist roles, Healthcare, Education, Research, Quality-focused roles
- If middle ground â†’ Customer Success, Product, Operations, Implementation, Enablement

For each territory:
**Territory Name** (e.g., "Customer Success in SaaS", "Revenue Operations", "Implementation Consulting")
Why it matches their profile - reference specific strengths and energy sources they mentioned.
Typical entry salary range (be realistic based on their experience level).
What's transferable from their background (specific).
Search terms to use: "Job Title 1", "Job Title 2", "Job Title 3"
Respects their deal-breakers: [Note which specific ones] âœ“

Be creative - suggest territories they wouldn't think of. Connect their unique strengths to roles that exist but they don't know about. Help them see beyond their current industry.

## Next Three Steps

1. **This week:** [Specific, achievable action - like "Research 3 companies in [territory] and read 5 job postings to see what resonates"]
2. **This month:** [Concrete next step - like "Connect with 2 people working in [territory] on LinkedIn and ask about their path"]
3. **Next 90 days:** [Bigger but clear action - like "Take [specific course/skill] or volunteer for [specific project] to build experience in [area]"]

Keep it warm, specific, and actionable. Make them feel seen, capable, and hopeful about moving forward.`;

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

  if (loadingStorage) {
    return (
      <>
        <div className="page-fade-overlay" />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            <span className="text-base">Loading your journey...</span>
          </div>
        </div>
      </>
    );
  }

  // Consent Screen
  if (section.type === 'consent') {
    const canProceed = consentChecks.terms && consentChecks.age && consentChecks.data;

    return (
      <>
        <div className="page-fade-overlay" />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-amber-400 mb-6 shadow-lg">
                <Sun className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-medium mb-2 text-gray-900 tracking-tight">
                Before We Begin
              </h1>
              <p className="text-gray-600">Please read and agree to continue</p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl space-y-6">
              <div className="bg-green-50 border-l-2 border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  ðŸ”’ Your privacy is protected
                </p>
                <p className="text-xs text-gray-700">
                  All data stays on your device. We never see your responses. 
                  Note: Clearing your browser data will delete your progress. Bookmark this page to return.
                </p>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900">How Pathlight Works:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Your responses are processed using AI to generate personalized insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Data is saved locally in your browser only - we don't store it on our servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Your responses are sent to Anthropic's API for real-time AI processing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Anthropic may retain logs for up to 30 days for safety and abuse prevention</span>
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50/50 border-l-2 border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  ðŸ’¡ This is a Self-Reflection Tool
                </p>
                <p className="text-xs text-gray-700 mb-2">
                  Pathlight helps you understand your strengths and skills through AI-powered reflection. 
                  It does not provide professional career counseling or specific career advice.
                </p>
                <p className="text-xs text-gray-700 font-medium">
                  For professional guidance on career decisions, consult a qualified career counselor.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentChecks.terms}
                    onChange={(e) => setConsentChecks({...consentChecks, terms: e.target.checked})}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    I understand this is a self-reflection tool, not professional career advice. 
                    I will not make significant career decisions based solely on AI-generated insights.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentChecks.age}
                    onChange={(e) => setConsentChecks({...consentChecks, age: e.target.checked})}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    I confirm that I am <strong>18 years of age or older</strong>.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentChecks.data}
                    onChange={(e) => setConsentChecks({...consentChecks, data: e.target.checked})}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    I understand my responses will be processed by AI and may be retained for up to 30 days. 
                    I will not enter sensitive personal information (financial data, health records, etc.).
                  </span>
                </label>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                By continuing, you consent to the processing of your responses as described above. 
                See our <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">Privacy Policy</a> for details.
              </p>

              <button
                onClick={nextSection}
                disabled={!canProceed}
                className={`w-full py-4 px-6 rounded-full font-medium text-base transition-all ${
                  canProceed
                    ? 'bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 text-white hover:shadow-xl cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canProceed ? 'I Agree & Continue' : 'Please agree to all items above'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Welcome Screen
  if (section.type === 'intro') {
    return (
      <>
        <div className="page-fade-overlay" />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-amber-400 mb-8 shadow-lg">
              <Sun className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-medium mb-3 text-gray-900 tracking-tight">
              Pathlight
            </h1>
            <p className="text-lg text-gray-600">
              Illuminate your path forward
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl space-y-5">
            <p className="text-base text-gray-700 leading-relaxed">
              You're here because something isn't quite right. Maybe you feel trapped. Maybe you lack direction. Maybe you're ready for something different but don't know what.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              This isn't about finding the perfect job title or industry. It's about understanding what you want to <span className="text-gray-900 font-medium">do</span> every day, what energizes you, and the impact you want to have.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              In the next 20 minutes, you'll discover your unique strengths, identify what to avoid, and get specific pathways forward.
            </p>
            <div className="pt-4 pb-2">
              <p className="text-sm text-gray-500 text-center">
                Your answers are saved as you go
              </p>
            </div>

            <button
              onClick={nextSection}
              className="w-full bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-6 py-4 rounded-full text-base font-medium transition-all shadow-lg"
            >
              Get started
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Screener
  if (section.type === 'screener') {
    const allAnswered = section.questions.every(q => screenerAnswers[q.id]);
    
    return (
      <>
        <div className="page-fade-overlay" />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="mb-10">
            <h2 className="text-4xl font-medium text-gray-900 mb-2 tracking-tight">
              {section.title}
            </h2>
            <p className="text-gray-600">This helps us personalize your journey</p>
          </div>

          <div className="space-y-6">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-3xl p-7 shadow-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{q.question}</h3>
                <div className="space-y-2">
                  {q.options.map(option => (
                    <button
                      key={option}
                      onClick={() => handleScreenerAnswer(q.id, option)}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all text-sm ${
                        screenerAnswers[q.id] === option
                          ? 'bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 text-white shadow-md'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
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
            <div className="mt-8 flex justify-center">
              <button
                onClick={nextSection}
                className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  // Synthesis screen - keeping original complex rendering logic
  if (section.type === 'synthesis') {
    const synthesisContent = conversations[section.id]?.[0]?.content;
    const parsedData = parseSynthesis(synthesisContent);

    return (
      <>
        <div className="page-fade-overlay" />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50">
        <div className="max-w-3xl mx-auto px-6 py-16">
          {!synthesisContent ? (
            <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-amber-400 mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900 mb-3">Ready to see your pathways?</h3>
              <p className="text-base text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                We'll analyze everything you've shared to identify your superpowers, suggest role territories, and give you concrete next steps.
              </p>
              <button
                onClick={generateSynthesis}
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl disabled:opacity-50 text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg inline-flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate My Pathways
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="bg-orange-50/50 border-l-2 border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  ðŸ’¡ AI-Generated Insights
                </p>
                <p className="text-xs text-gray-700">
                  This synthesis is AI-generated to help you reflect on your strengths and skills. 
                  Use these insights as a starting point for reflection and discussion with career professionals.
                </p>
              </div>

              {synthesisScreen === 0 && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-amber-400 mb-4">
                      <Sun className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Your Profile</h2>
                  </div>

                  <div className="bg-white rounded-3xl p-10 shadow-xl">
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                      {parsedData?.profile.split('\n').map((para, idx) => (
                        <p key={idx} className="mb-4">{para}</p>
                      ))}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xl text-gray-800 font-medium mb-8">
                      You're not stuck. You're standing at a crossroads with more options than you realize.
                    </p>
                    <button
                      onClick={() => setSynthesisScreen(1)}
                      className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg inline-flex items-center gap-2"
                    >
                      Discover Your Superpowers
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {synthesisScreen === 1 && parsedData?.superpowers && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 via-orange-400 to-amber-400 mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Your Superpowers</h2>
                    <p className="text-gray-600">Look at what you've been bringing to the table all along</p>
                  </div>

                  <div className="space-y-6">
                    {parsedData.superpowers.map((power, idx) => (
                      <div 
                        key={idx}
                        className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl p-8 shadow-lg border-2 border-pink-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-medium text-gray-900 mb-3">{power.name}</h3>
                            <p className="text-gray-700 mb-4 leading-relaxed">{power.description}</p>
                            <details className="group">
                              <summary className="cursor-pointer text-pink-600 font-medium hover:text-pink-700 list-none flex items-center gap-2">
                                How to use this
                                <ArrowRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                              </summary>
                              <div className="mt-4 pl-4 text-gray-700 text-sm leading-relaxed space-y-3">
                                {power.howTo.split('\n').map((line, lineIdx) => {
                                  const trimmed = line.trim();
                                  if (!trimmed) return null;
                                  
                                  const bulletMatch = trimmed.match(/^-\s+\*\*([^*]+)\*\*[:\s]+(.*)/);
                                  if (bulletMatch) {
                                    const label = bulletMatch[1].replace(/:$/, '');
                                    return (
                                      <div key={lineIdx} className="flex gap-2">
                                        <span className="text-pink-500 font-bold mt-0.5">â€¢</span>
                                        <div>
                                          <span className="font-medium text-gray-900">{label}:</span>
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
                    ))}
                  </div>

                  <div className="text-center pt-8">
                    {parsedData.superpowersSummary?.whyTogether && (
                      <div className="bg-white rounded-3xl p-8 shadow-lg mb-6 text-left">
                        <h3 className="text-xl font-medium text-gray-900 mb-3">Why these matter together</h3>
                        <p className="text-gray-700 leading-relaxed mb-4">{parsedData.superpowersSummary.whyTogether}</p>
                        {parsedData.superpowersSummary.valueProp && (
                          <>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Your unique value proposition</h4>
                            <p className="text-pink-600 text-lg font-medium leading-relaxed">"{parsedData.superpowersSummary.valueProp}"</p>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
                      These aren't just skills - this is <strong>your</strong> unique combination. This is what makes you valuable.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setSynthesisScreen(0)}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        onClick={() => setSynthesisScreen(2)}
                        className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg flex items-center gap-2"
                      >
                        See What to Avoid
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {synthesisScreen === 2 && parsedData?.dealbreakers && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Your Deal-Breakers</h2>
                    <p className="text-gray-600">You've learned what doesn't work. That's wisdom.</p>
                  </div>

                  <div className="bg-amber-50 rounded-3xl p-8 text-center mb-6">
                    <p className="text-gray-900 text-lg font-medium leading-relaxed">
                      Use this list when evaluating opportunities. Even if a role looks perfect, if it has these elements, you'll end up miserable again.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {parsedData.dealbreakers.work.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-red-400">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-red-500">âŒ</span> About the work
                        </h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {parsedData.dealbreakers.work.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-red-400 mt-1">â€¢</span>
                              <span>{item.replace(/^- /, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedData.dealbreakers.job.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-orange-400">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-orange-500">âŒ</span> What comes with the job
                        </h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {parsedData.dealbreakers.job.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-orange-400 mt-1">â€¢</span>
                              <span>{item.replace(/^- /, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedData.dealbreakers.leadership.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-amber-400">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-amber-500">âŒ</span> About leadership
                        </h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {parsedData.dealbreakers.leadership.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 mt-1">â€¢</span>
                              <span>{item.replace(/^- /, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {parsedData.dealbreakers.environment.length > 0 && (
                      <div className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-yellow-400">
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <span className="text-yellow-500">âŒ</span> About the environment
                        </h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                          {parsedData.dealbreakers.environment.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-yellow-400 mt-1">â€¢</span>
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
                      className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={() => setSynthesisScreen(3)}
                      className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg flex items-center gap-2"
                    >
                      Explore Your Pathways
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {synthesisScreen === 3 && parsedData?.territories && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Role Territories to Explore</h2>
                    <p className="text-gray-600">Here are territories waiting for someone exactly like you</p>
                  </div>

                  <div className="space-y-4">
                    {parsedData.territories.map((territory, idx) => (
                      <details key={idx} className="group bg-white rounded-3xl shadow-lg overflow-hidden">
                        <summary className="cursor-pointer p-6 hover:bg-gray-50 transition-colors list-none">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-medium text-gray-900 mb-1">{territory.name}</h3>
                              <p className="text-sm text-gray-600">Click to explore</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-gray-400 group-open:rotate-90 transition-transform" />
                          </div>
                        </summary>
                        <div className="px-6 pb-6 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap border-t border-gray-100">
                          <div className="pt-4">{territory.content}</div>
                        </div>
                      </details>
                    ))}
                  </div>

                  <div className="text-center pt-8">
                    <p className="text-lg text-gray-700 mb-8 max-w-xl mx-auto">
                      You're not limited by your current industry. These are territories to explore, not prescriptions.
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => setSynthesisScreen(2)}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        onClick={() => setSynthesisScreen(4)}
                        className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg flex items-center gap-2"
                      >
                        Get Your Next Steps
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {synthesisScreen === 4 && parsedData?.nextSteps && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 mb-4">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-medium text-gray-900 mb-2">Your Path Forward</h2>
                    <p className="text-gray-600">You can actually do this</p>
                  </div>

                  <div className="space-y-6">
                    {parsedData.nextSteps.map((step, idx) => (
                      <div key={idx} className="bg-white rounded-3xl p-8 shadow-lg">
                        <div className="flex items-start gap-6">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold text-lg">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{step.timeframe}</h3>
                            <p className="text-gray-700 leading-relaxed">{step.action}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 rounded-3xl p-8 shadow-lg text-center">
                    <Sparkles className="w-10 h-10 text-pink-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-3">ðŸ™ Help Improve Pathlight</h3>
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      You just completed the beta version! Your feedback will help make this better for others.
                    </p>
                    <a
                      href="https://forms.gle/fUaxKWAMbQZdbXNk7"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-8 py-4 rounded-full text-base font-medium transition-all shadow-lg"
                    >
                      Take 2-Minute Survey
                    </a>
                    <p className="text-xs text-gray-600 mt-4">Your honest feedback helps. Thanks!</p>
                  </div>

                  <div className="flex gap-4 justify-center pt-4">
                    <button
                      onClick={() => setSynthesisScreen(3)}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
      </>
    );
  }

  // Regular Journey Section
  return (
    <>
      <div className="page-fade-overlay" />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="bg-green-50/50 border-l-2 border-green-200 rounded-lg p-3 mb-6 text-center">
          <p className="text-xs text-gray-700">
            ðŸ”’ <strong>Private:</strong> Your data stays on your device  â€¢  Bookmark this page to save progress
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500 font-medium">
              {currentSection} of {SECTIONS.length - 1}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 transition-all duration-500 rounded-full"
              style={{ width: `${(currentSection / (SECTIONS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-medium text-gray-900 mb-1 tracking-tight">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="text-lg text-gray-600">{section.subtitle}</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-pink-100 to-orange-100 rounded-3xl p-6 mb-8 shadow-sm">
          <p className="text-gray-800 leading-relaxed">{section.explainer}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl min-h-[400px] flex flex-col">
          <div className="flex-1 space-y-4 mb-6 overflow-y-auto max-h-96">
            {sectionMessages.length === 0 && (
              <div className="text-center py-16 text-gray-400 text-sm">
                Share your thoughts below...
              </div>
            )}
            {sectionMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-pink-500 via-orange-500 to-amber-500 text-white ml-12'
                    : 'bg-gray-50 text-gray-800 mr-12'
                } rounded-2xl p-4 shadow-sm`}
              >
                <div className="leading-relaxed whitespace-pre-wrap text-sm">
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="bg-gray-50 text-gray-800 mr-12 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {sectionMessages.length > 0 && (
            <div className="mb-4 flex justify-center">
              <button
                onClick={nextSection}
                className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-xl text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg text-sm"
              >
                Continue
              </button>
            </div>
          )}

          <div className="space-y-3">
            {currentAiResponses >= MAX_AI_RESPONSES && (
              <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-600 flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-500" />
                <span>Add more thoughts or continue when ready</span>
              </div>
            )}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your reflection..."
                className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900 placeholder-gray-400 text-sm"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !userInput.trim()}
                className="bg-gradient-to-r from-pink-500 via-orange-500 to-amber-500 hover:shadow-lg disabled:opacity-30 text-white p-3 rounded-full transition-all shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={prevSection}
            disabled={currentSection <= 1}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <button
            onClick={resetProgress}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear My Data
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          {' â€¢ '}
          <span>Your data stays on your device</span>
        </div>
      </div>
    </div>
    </>
  );
}
