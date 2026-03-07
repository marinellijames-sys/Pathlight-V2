// pages/example-report.jsx
// Full example PDF preview - shows complete report for fictional "Sarah Chen"
// This is what every user sees when clicking "See example report"

import React from 'react';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import Link from 'next/link';

export default function ExampleReport() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="px-6 py-4 border-b border-silver bg-paper sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-ash hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-light">Back to Pathlight</span>
          </Link>
          <span className="font-serif text-lg text-ink">Example Report</span>
        </div>
      </header>

      {/* Report Preview */}
      <main className="px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Banner */}
          <div className="bg-charcoal rounded-xl p-6 mb-8 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-white/80" />
            <h1 className="font-serif text-2xl mb-2 text-white">Sample Report: Sarah Chen</h1>
            <p className="text-white/70 font-light text-sm">
              This is exactly what your personalized report looks like
            </p>
          </div>

          {/* What's Included */}
          <div className="bg-linen border border-silver rounded-lg p-5 mb-8">
            <h2 className="font-serif text-lg text-ink mb-3">Your $39 report includes:</h2>
            <ul className="space-y-2 text-graphite font-light text-sm">
              {[
                'Your personalized profile summary',
                '4 Signature Strengths with actionable deployment guides',
                'Your deal-breakers (what to avoid in roles)',
                '3-5 Role Territories matched to your strengths',
                'Concrete next steps with timelines'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Report Pages */}
          <div className="space-y-8">
            {/* Page 1 - Cover */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8 text-center border-b border-silver">
                <h2 className="font-serif text-4xl text-ink mb-2">Pathlight</h2>
                <p className="text-ash font-light">Career Clarity Report</p>
                <div className="mt-8 pt-8 border-t border-silver">
                  <p className="text-stone text-sm">Prepared for</p>
                  <p className="font-serif text-2xl text-ink mt-1">Sarah Chen</p>
                  <p className="text-ash text-sm mt-1 font-light">Senior Accountant, 8 years experience</p>
                </div>
              </div>
            </div>

            {/* Page 2 - Profile */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Profile</h3>
                <p className="text-graphite font-light leading-relaxed">
                  Sarah, you're someone who brings unusual clarity to complexity. While your career has been built on precision and accuracy, what truly energizes you isn't the numbers themselves - it's the moment when you help someone understand their financial picture for the first time.
                </p>
                <p className="text-graphite font-light leading-relaxed mt-4">
                  You've been undervaluing your ability to translate technical information into plain language. The skills that feel effortless to you - pattern recognition, building trust with anxious clients, staying calm under deadline pressure - are exactly what set you apart. You're not stuck. You're standing at a crossroads with more options than you realize.
                </p>
              </div>
            </div>

            {/* Page 3 - Strengths */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-6">Your Signature Strengths</h3>
                  
                {/* Strength 1 */}
                <div className="bg-linen border border-silver rounded-lg p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">1</span>
                    <h4 className="font-serif text-lg text-ink">The Clarity Bringer</h4>
                  </div>
                  <p className="text-graphite font-light text-sm mb-4">
                    You have a rare gift for taking complex financial information and making it accessible without dumbing it down. Clients who come to you stressed leave feeling empowered. This isn't just "good communication" - it's a transferable skill valued across industries.
                  </p>
                  <div className="text-xs text-ash bg-paper rounded p-3 border border-silver">
                    <p className="font-medium text-graphite mb-2">How to deploy this strength:</p>
                    <ul className="space-y-1">
                      <li>- This week: Document one process that confuses new team members</li>
                      <li>- In interviews: "I translate complex information into confident decisions"</li>
                      <li>- Roles that need this: Financial Advisor, Operations Manager, Client Success</li>
                    </ul>
                  </div>
                </div>

                {/* Strength 2 */}
                <div className="bg-linen border border-silver rounded-lg p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">2</span>
                    <h4 className="font-serif text-lg text-ink">The Calm Under Pressure</h4>
                  </div>
                  <p className="text-graphite font-light text-sm mb-4">
                    End-of-month close, tax deadlines, audit scrambles - you've trained yourself to stay composed when others panic. This regulated nervous system is valuable leadership currency. People feel safe around you in high-stakes moments.
                  </p>
                  <div className="text-xs text-ash bg-paper rounded p-3 border border-silver">
                    <p className="font-medium text-graphite mb-2">How to deploy this strength:</p>
                    <ul className="space-y-1">
                      <li>- This week: Volunteer to lead the next high-pressure project</li>
                      <li>- In interviews: "I'm the person teams want in the room during a crisis"</li>
                      <li>- Roles that need this: Project Manager, Operations Lead, Crisis Management</li>
                    </ul>
                  </div>
                </div>

                {/* Strength 3 */}
                <div className="bg-linen border border-silver rounded-lg p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">3</span>
                    <h4 className="font-serif text-lg text-ink">The Pattern Spotter</h4>
                  </div>
                  <p className="text-graphite font-light text-sm mb-4">
                    You see connections others miss. Whether it's catching an anomaly in a spreadsheet or noticing that a client's "small question" reveals a bigger concern, your brain is wired to detect what doesn't fit. This is strategic thinking in disguise.
                  </p>
                  <div className="text-xs text-ash bg-paper rounded p-3 border border-silver">
                    <p className="font-medium text-graphite mb-2">How to deploy this strength:</p>
                    <ul className="space-y-1">
                      <li>- This week: When you spot something others miss, document it</li>
                      <li>- In interviews: "I catch problems before they become expensive"</li>
                      <li>- Roles that need this: Business Analyst, Risk Management, Strategy Consulting</li>
                    </ul>
                  </div>
                </div>

                {/* Strength 4 */}
                <div className="bg-linen border border-silver rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">4</span>
                    <h4 className="font-serif text-lg text-ink">The Trust Builder</h4>
                  </div>
                  <p className="text-graphite font-light text-sm mb-4">
                    Clients specifically request you. New hires seek you out for guidance. You create psychological safety without trying. This isn't just "being nice" - it's a leadership competency that many senior people never develop.
                  </p>
                  <div className="text-xs text-ash bg-paper rounded p-3 border border-silver">
                    <p className="font-medium text-graphite mb-2">How to deploy this strength:</p>
                    <ul className="space-y-1">
                      <li>- This week: Offer to mentor someone junior</li>
                      <li>- In interviews: "I build the relationships that make teams work"</li>
                      <li>- Roles that need this: Client Lead, People Manager, Account Director</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 4 - Deal-Breakers */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-6">Your Deal-Breakers</h3>
                <p className="text-graphite font-light text-sm mb-6">Use this list when evaluating opportunities. If a role hits multiple items here, it's probably not for you.</p>
                
                <div className="space-y-4">
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-medium text-ink text-sm mb-2">About the work</h4>
                    <ul className="text-graphite font-light text-sm space-y-1">
                      <li>- Repetitive data entry with no variety or problem-solving</li>
                      <li>- Work that stays in spreadsheets and never impacts real people</li>
                      <li>- Being siloed from the rest of the business</li>
                    </ul>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-medium text-ink text-sm mb-2">About leadership</h4>
                    <ul className="text-graphite font-light text-sm space-y-1">
                      <li>- Micromanagement and lack of autonomy</li>
                      <li>- Leaders who don't explain the "why"</li>
                      <li>- Environments where asking questions is seen as weakness</li>
                    </ul>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-medium text-ink text-sm mb-2">About the environment</h4>
                    <ul className="text-graphite font-light text-sm space-y-1">
                      <li>- Constant firefighting with no time for deep work</li>
                      <li>- Teams that don't collaborate or share information</li>
                      <li>- Cultures that reward politics over performance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 5 - Role Territories */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-6">Role Territories to Explore</h3>
                <p className="text-graphite font-light text-sm mb-6">These are directions based on your strengths, not prescriptions. Explore what resonates.</p>
                
                <div className="space-y-4">
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-serif text-ink mb-2">Financial Advisory / Wealth Management</h4>
                    <p className="text-graphite font-light text-sm">
                      Your clarity-bringing and trust-building strengths are exactly what high-net-worth clients need. You'd be translating complex financial concepts into confident decisions - but for people, not just spreadsheets. Look at firms that emphasize client relationships over product sales.
                    </p>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-serif text-ink mb-2">Operations / Process Improvement</h4>
                    <p className="text-graphite font-light text-sm">
                      Your pattern-spotting strength is underutilized in pure accounting. Operations roles would let you redesign how things work, not just report on them. Your calm under pressure means you'd thrive leading transformation projects.
                    </p>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-serif text-ink mb-2">Client Success / Account Management</h4>
                    <p className="text-graphite font-light text-sm">
                      Your trust-building is a competitive advantage in B2B relationships. Companies pay premium rates to retain clients - and you're naturally good at the human side that most "numbers people" struggle with. Tech companies especially value this combination.
                    </p>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <h4 className="font-serif text-ink mb-2">Internal Consulting / Business Partnering</h4>
                    <p className="text-graphite font-light text-sm">
                      Many large companies have Finance Business Partner roles that sit between the numbers and the business. You'd be the person who helps non-finance leaders understand what the data means for their decisions. Your communication strength is perfect for this.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 6 - Next Steps */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-6">Your Next Steps</h3>
                
                <div className="space-y-4">
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">1</span>
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-1">This Week</h4>
                        <p className="text-graphite font-light text-sm">
                          Have 2 coffee chats with people in Financial Advisory or Operations roles. Ask them: "What does a typical day look like?" and "What skills matter most?" LinkedIn is your friend here.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">2</span>
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-1">This Month</h4>
                        <p className="text-graphite font-light text-sm">
                          Update your LinkedIn headline to include "Clarity Bringer" language - something like "Helping clients understand their numbers and make confident decisions." Watch how people respond.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-linen border border-silver rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">3</span>
                      <div>
                        <h4 className="font-medium text-ink text-sm mb-1">This Quarter</h4>
                        <p className="text-graphite font-light text-sm">
                          Volunteer for one cross-functional project at work that lets you flex your pattern-spotting or trust-building muscles outside pure accounting. This builds evidence and expands your internal network.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-silver text-center">
                  <p className="text-graphite font-light">
                    You're not stuck. You're at a crossroads with more options than you realize.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center bg-linen border border-silver rounded-xl p-8">
            <p className="text-graphite font-light mb-4">
              Ready to discover your own strengths and career direction?
            </p>
            <Link 
              href="/"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Start Your Journey
            </Link>
            <p className="text-stone text-sm mt-4 font-light">
              15 minutes. $39. Instant PDF download.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
