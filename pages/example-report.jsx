// pages/example-report.jsx
// Example PDF preview page - shows what the paid report looks like

import React from 'react';
import { ArrowLeft, Download, Lock, FileText } from 'lucide-react';
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
          <div className="bg-charcoal text-cream rounded-xl p-6 mb-8 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3" />
            <h1 className="font-serif text-2xl mb-2">Sample Pathlight Report</h1>
            <p className="text-cream/70 font-light text-sm">
              This is what your personalized PDF report will look like
            </p>
          </div>

          {/* Simulated PDF Pages */}
          <div className="space-y-8">
            {/* Page 1 */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                {/* Header */}
                <div className="border-b border-silver pb-6 mb-8">
                  <h2 className="font-serif text-4xl text-ink">Pathlight</h2>
                  <p className="text-stone text-sm mt-2">Your Personalized Career Report</p>
                </div>

                {/* Profile Section */}
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Profile</h3>
                  <p className="text-graphite font-light leading-relaxed">
                    You're someone who thrives at the intersection of strategy and human connection. 
                    Your energy comes from solving complex problems while building genuine relationships. 
                    You've proven you can navigate ambiguity and bring clarity to chaos...
                  </p>
                </section>

                {/* Strengths Preview */}
                <section>
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Signature Strengths</h3>
                  
                  {/* Strength 1 - Full */}
                  <div className="bg-linen border border-silver rounded-lg p-5 mb-4">
                    <h4 className="font-serif text-lg text-ink mb-2">The Systems Translator</h4>
                    <p className="text-graphite font-light text-sm mb-3">
                      You have a rare ability to see how complex systems work and explain them in ways others understand. 
                      While others get lost in details, you naturally zoom out to see patterns.
                    </p>
                    <div className="text-xs text-ash">
                      <p className="font-medium text-graphite mb-1">How to deploy this:</p>
                      <ul className="space-y-1 ml-3">
                        <li>• This week: Map out a process that's been confusing your team</li>
                        <li>• In interviews: "I translate complexity into clarity"</li>
                        <li>• Roles: Systems Analyst, Solutions Architect, Strategy Consultant</li>
                      </ul>
                    </div>
                  </div>

                  {/* Strength 2-4 - Blurred/Locked */}
                  {[
                    'The Bridge Builder',
                    'The Quiet Strategist', 
                    'The Energy Reader'
                  ].map((name, idx) => (
                    <div key={idx} className="relative mb-4">
                      <div className="bg-linen border border-silver rounded-lg p-5 opacity-30 blur-[3px]">
                        <h4 className="font-serif text-lg text-ink mb-2">{name}</h4>
                        <p className="text-graphite font-light text-sm">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore...
                        </p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-paper px-4 py-2 rounded-lg shadow-md border border-silver flex items-center gap-2">
                          <Lock className="w-4 h-4 text-stone" />
                          <span className="text-sm text-graphite">In full report</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>

            {/* Page 2 Preview */}
            <div className="bg-paper border border-silver rounded-lg shadow-lg overflow-hidden relative">
              <div className="p-8 opacity-30 blur-[2px]">
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Deal-Breakers</h3>
                  <p className="text-graphite font-light">About the work: Repetitive tasks with no variety...</p>
                </section>
                
                <section className="mb-8">
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Role Territories to Explore</h3>
                  <p className="text-graphite font-light">Customer Success in SaaS, Revenue Operations...</p>
                </section>
                
                <section>
                  <h3 className="font-serif text-xl text-ink border-b border-silver pb-2 mb-4">Your Next Three Steps</h3>
                  <p className="text-graphite font-light">This week: Research 3 companies in your target territory...</p>
                </section>
              </div>
              
              {/* Locked overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-paper/50">
                <div className="bg-charcoal text-cream px-8 py-6 rounded-xl text-center shadow-xl">
                  <Lock className="w-8 h-8 mx-auto mb-3" />
                  <p className="font-serif text-lg mb-2">Full Report</p>
                  <p className="text-cream/70 text-sm font-light mb-4">Deal-breakers, territories, next steps</p>
                  <Link 
                    href="/"
                    className="bg-cream text-charcoal px-6 py-2 rounded-lg text-sm font-medium hover:bg-paper transition-colors inline-block"
                  >
                    Get Your Report - $39
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4"
            >
              Start Your Journey
            </Link>
            <p className="text-stone text-sm mt-4 font-light">
              15 minutes. Get your personalized PDF report.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
