import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Terms() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-amber-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="bg-white rounded-3xl p-10 shadow-xl">
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

          {/* Plain English Summary */}
          <div className="bg-blue-50 border-l-2 border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-3">Plain English Summary</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>What this document is:</strong> These are the rules for using Pathlight. By using the service, you agree to these terms.</p>
              <p className="mt-3"><strong>Key points:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>You must be 18+ to use Pathlight</li>
                <li>This is a self-reflection tool, not professional career advice</li>
                <li>We're not liable if you make career decisions based on AI insights</li>
                <li>Your data stays on your device (localStorage)</li>
                <li>Free version is free; resume optimizer costs $20</li>
                <li>We can change or shut down the service anytime</li>
                <li>Australian law applies</li>
              </ul>
              <p className="mt-3 text-xs text-gray-600"><strong>Not a lawyer?</strong> This is a legally binding contract. Read it carefully. If you don't agree, don't use Pathlight.</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none space-y-8 text-gray-700">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">1. Acceptance of Terms</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">1.1 Agreement to Terms</h3>
              <p>By accessing or using Pathlight ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Service.</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">1.2 Changes to Terms</h3>
              <p>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Service. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">1.3 Who Can Use Pathlight</h3>
              <p>You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that you are at least 18 years old.</p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">2. Description of Service</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">2.1 What Pathlight Is</h3>
              <p>Pathlight is a self-reflection tool that uses artificial intelligence to help users identify their strengths, skills, and potential career directions through guided reflection and AI-powered analysis.</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">2.2 What Pathlight Is NOT</h3>
              <p>Pathlight is NOT:</p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li>Professional career counseling or vocational guidance</li>
                <li>A substitute for licensed career advisors or counselors</li>
                <li>A guarantee of career success or job placement</li>
                <li>Psychological assessment or mental health counseling</li>
                <li>Financial, legal, or medical advice</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">2.3 Service Components</h3>
              <p>The Service includes:</p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li><strong>Free Version:</strong> Guided reflection questions and AI-generated synthesis identifying strengths and potential role territories</li>
                <li><strong>Paid Version:</strong> Resume optimization service based on identified strengths ($20 per resume)</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">2.4 Beta Testing Disclaimer</h3>
              <p>Pathlight is currently in beta testing. The Service may contain bugs, errors, or inaccuracies. Features may change or be discontinued without notice. Use during beta testing is at your own risk.</p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">3. User Responsibilities</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.1 Accurate Information</h3>
              <p>You agree to provide accurate and honest responses during your reflection journey. The quality of insights generated depends on the quality of information you provide.</p>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.2 Appropriate Use</h3>
              <p>You agree NOT to:</p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Enter false, misleading, or fraudulent information</li>
                <li>Attempt to reverse-engineer, hack, or compromise the Service</li>
                <li>Use automated tools (bots, scrapers) to access the Service</li>
                <li>Share your responses or synthesis in ways that misrepresent the Service</li>
                <li>Enter highly sensitive personal information (financial data, health records, government IDs, passwords, etc.)</li>
              </ul>
              
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">3.3 Professional Advice</h3>
              <p>You acknowledge that Pathlight does not provide professional career advice. You agree not to make significant career, educational, or life decisions based solely on AI-generated insights. You are encouraged to consult qualified career counselors, advisors, or other professionals before making important decisions.</p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">4. Data and Privacy</h2>
              
              <p>Your use of the Service is also governed by our <a href="/privacy" className="text-orange-600 hover:text-orange-700 underline">Privacy Policy</a>. Key points:</p>
              
              <ul className="list-disc ml-6 space-y-2 mt-3">
                <li><strong>Local Storage:</strong> Your responses are stored locally in your browser using localStorage. We do not store your responses on our servers.</li>
                <li><strong>Third-Party Processing:</strong> Your responses are sent to Anthropic's Claude API for AI processing. Anthropic may retain logs for up to 30 days.</li>
                <li><strong>No Guarantee of Data Persistence:</strong> Browser updates or device changes may result in data loss. We are not liable for data loss.</li>
                <li><strong>Bookmark to Save:</strong> You must bookmark the page to preserve your progress.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">5. Limitation of Liability</h2>
              
              <div className="bg-yellow-50 border-l-2 border-yellow-300 rounded-lg p-4 my-4">
                <p className="font-medium text-gray-900 mb-2">⚠️ Important Disclaimer</p>
                <p className="text-sm">AI-GENERATED INSIGHTS ARE PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ACCURACY, COMPLETENESS, OR SUITABILITY FOR ANY PARTICULAR PURPOSE.</p>
              </div>
              
              <p><strong>YOU ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR ANY DECISIONS YOU MAKE BASED ON INSIGHTS GENERATED BY THE SERVICE.</strong> We are not liable for consequences resulting from career decisions, job changes, or other actions taken based on Service use.</p>
              
              <p className="mt-4">We are not liable for:</p>
              <ul className="list-disc ml-6 space-y-1 mt-2">
                <li>Service interruptions, downtime, or unavailability</li>
                <li>Data loss due to browser storage limitations</li>
                <li>Bugs, errors, or inaccuracies in the Service</li>
                <li>Third-party service failures (including Anthropic API)</li>
              </ul>
              
              <p className="mt-4">To the maximum extent permitted by law, our total liability shall not exceed the amount you paid us in the preceding 12 months, or AUD $100, whichever is less.</p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">6. Payment Terms (Paid Features)</h2>
              
              <ul className="space-y-3">
                <li><strong>Pricing:</strong> Resume optimization costs AUD $20 per resume</li>
                <li><strong>No Refunds:</strong> All sales are final once the optimized resume is generated and delivered</li>
                <li><strong>Refund Exception:</strong> If we fail to generate your resume due to technical error, we will retry at no cost or provide a full refund</li>
                <li><strong>Payment Processing:</strong> Payments processed through third-party processors (e.g., Stripe)</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">7. Termination</h2>
              
              <p>You may stop using the Service at any time by clearing your browser data or using the "Clear My Data" button.</p>
              
              <p className="mt-3">We reserve the right to suspend or terminate your access at any time, or to modify or discontinue the Service without notice.</p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">8. Governing Law</h2>
              
              <p>These Terms are governed by the laws of the State of Victoria, Australia. Any disputes shall be subject to the exclusive jurisdiction of Victorian courts.</p>
              
              <p className="mt-3">Before filing legal action, you agree to contact us at <a href="mailto:marinellijames@gmail.com" className="text-orange-600 hover:text-orange-700 underline">marinellijames@gmail.com</a> to attempt informal resolution.</p>
              
              <p className="mt-3">Any claim must be filed within one (1) year after it arose, or be forever barred.</p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mb-4">Contact Us</h2>
              <p>
                Questions about these Terms? Contact us at:{' '}
                <a href="mailto:marinellijames@gmail.com" className="text-orange-600 hover:text-orange-700 underline">
                  marinellijames@gmail.com
                </a>
              </p>
            </section>

            {/* Acknowledgment */}
            <section className="bg-gray-50 rounded-lg p-6 mt-8">
              <h2 className="text-xl font-medium text-gray-900 mb-3">Acknowledgment</h2>
              <p className="text-sm">BY USING PATHLIGHT, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.</p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
