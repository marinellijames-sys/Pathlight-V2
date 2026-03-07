// pages/example-report.jsx
// Generic example PDF preview - shows what the paid report looks like
// Uses fictional "Sarah Chen" accountant example

import React from 'react';
import { ArrowLeft, Lock, FileText, Check } from 'lucide-react';
import Link from 'next/link';

export default function ExampleReport() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="px-6 py-4 border-b border-silver bg-paper">
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
              See what your personalized PDF report includes
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

          {/* Simulated PDF Pages */}
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
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Profile</h3>
                  <p className="text-graphite font-light leading-relaxed">
                    Sarah, you're someone who brings unusual clarity to complexity. While your career has been built on precision and accuracy, what truly energizes you isn't the numbers themselves - it's the moment when you help someone understand their financial picture for the first time.
                  </p>
                  <p className="text-graphite font-light leading-relaxed mt-4">
                    You've been undervaluing your ability to translate technical information into plain language. The skills that feel effortless to you - pattern recognition, building trust with anxious clients, staying calm under deadline pressure - are exactly what set you apart.
                  </p>
                </section>
              </div>
            </div>

            {/* Page 3 - Strengths */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-6">Your Signature Strengths</h3>
                  
                {/* Strength 1 - Full */}
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

                {/* Strength 2 - Full */}
                <div className="bg-linen border border-silver rounded-lg p-5 mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">2</span>
                    <h4 className="font-serif text-lg text-ink">The Calm Under Pressure</h4>
                  </div>
                  <p className="text-graphite font-light text-sm mb-4">
                    End-of-month close, tax deadlines, audit scrambles - you've trained yourself to stay composed when others panic. This regulated nervous system is valuable leadership currency. People feel safe around you.
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

                {/* Strength 3-4 - Blurred */}
                {['The Pattern Spotter', 'The Trust Builder'].map((name, idx) => (
                  <div key={idx} className="relative mb-4">
                    <div className="bg-linen border border-silver rounded-lg p-5 opacity-30 blur-[3px]">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-charcoal text-white text-sm flex items-center justify-center">{idx + 3}</span>
                        <h4 className="font-serif text-lg text-ink">{name}</h4>
                      </div>
                      <p className="text-graphite font-light text-sm">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor...
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-paper px-4 py-2 rounded-lg shadow-md border border-silver flex items-center gap-2">
                        <Lock className="w-4 h-4 text-stone" />
                        <span className="text-sm text-graphite">In your report</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Page 4 Preview - Deal-Breakers & Territories */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden relative">
              <div className="p-8 opacity-30 blur-[2px]">
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Deal-Breakers</h3>
                  <div className="space-y-3">
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>About the work:</strong> Repetitive data entry with no variety or problem-solving...</p>
                    </div>
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>About leadership:</strong> Micromanagement and lack of autonomy...</p>
                    </div>
                  </div>
                </section>
                
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Role Territories to Explore</h3>
                  <div className="space-y-2">
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>Financial Advisory:</strong> Your clarity strength + trust-building...</p>
                    </div>
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>Operations Management:</strong> Your pattern-spotting + calm under pressure...</p>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Next Three Steps</h3>
                  <div className="space-y-2">
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>This week:</strong> Have 2 coffee chats with people in your target roles...</p>
                    </div>
                    <div className="bg-linen rounded p-3">
                      <p className="text-graphite font-light text-sm"><strong>This month:</strong> Update your LinkedIn headline to reflect your strengths...</p>
                    </div>
                  </div>
                </section>
              </div>
              
              {/* Locked overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-paper/60">
                <div className="bg-charcoal px-8 py-6 rounded-xl text-center shadow-xl">
                  <Lock className="w-8 h-8 mx-auto mb-3 text-white/80" />
                  <p className="font-serif text-lg mb-2 text-white">Continue in Your Report</p>
                  <p className="text-white/70 text-sm font-light mb-4">Deal-breakers, role territories, next steps</p>
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
              15 minutes. Instant PDF download.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
