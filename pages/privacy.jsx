import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Privacy() {
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
          <h1 className="text-4xl font-medium text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: January 2026</p>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Overview</h2>
              <p>
                Pathlight is a career clarity tool that helps you discover your strengths and identify potential career paths. 
                We take your privacy seriously and are committed to protecting your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Information We Collect</h2>
              <p>When you use Pathlight, we collect:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your responses to career reflection questions</li>
                <li>Information about your career history, strengths, and goals that you provide</li>
                <li>If you choose to upload a resume: the contents of that resume</li>
              </ul>
              <p className="mt-4">
                <strong>We do NOT collect:</strong> Your name, email address, phone number, or other identifying information 
                unless you explicitly provide it in your responses or uploaded documents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">How We Use Your Information</h2>
              <p>Your information is used solely to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Generate personalized career insights and recommendations</li>
                <li>Create your synthesis report identifying your superpowers and role territories</li>
                <li>Optimize your resume (if you use the paid upgrade feature)</li>
              </ul>
              <p className="mt-4">
                We do NOT use your information for marketing, advertising, or any other purpose.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">How We Store Your Information</h2>
              <p>
                Your data is stored <strong>locally in your browser</strong> using localStorage. We do not maintain a database 
                of user information on our servers.
              </p>
              <p className="mt-4">
                This means:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your data stays on your device</li>
                <li>We cannot access your responses or synthesis</li>
                <li>Clearing your browser data will delete all your Pathlight information</li>
                <li>Your data will not sync across devices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Third-Party Processing</h2>
              <p>
                We use <strong>Anthropic's Claude API</strong> to process your responses and generate insights. When you use Pathlight:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your responses are sent to Anthropic's servers for AI processing</li>
                <li>Anthropic may retain logs for up to 30 days for safety and abuse prevention</li>
                <li>Anthropic does not use your data to train their AI models</li>
                <li>Your data is transmitted securely using HTTPS encryption</li>
              </ul>
              <p className="mt-4">
                You can review Anthropic's privacy policy at: 
                <a href="https://www.anthropic.com/privacy" className="text-orange-600 hover:text-orange-700 ml-1">
                  https://www.anthropic.com/privacy
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access your data:</strong> All your data is stored locally in your browser and visible to you at all times</li>
                <li><strong>Delete your data:</strong> Click "Clear My Data" at any time to permanently delete all your information</li>
                <li><strong>Withdraw consent:</strong> Stop using Pathlight at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Data Security</h2>
              <p>
                We implement appropriate technical measures to protect your information:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>All data transmission uses HTTPS encryption</li>
                <li>API keys are stored securely on our servers (never in your browser)</li>
                <li>We do not store your responses on our servers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Resume Upload (Paid Feature)</h2>
              <p>
                If you choose to upgrade and upload your resume:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Your resume is sent to Anthropic's API for processing only</li>
                <li>We do not store your resume on our servers</li>
                <li>The optimized resume is generated and provided to you for download</li>
                <li>Your resume may contain personal information (name, address, phone, employment history)</li>
                <li>By uploading, you consent to this processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify users of any material changes by 
                updating the "Last updated" date at the top of this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-medium text-gray-900 mt-8 mb-4">Contact Us</h2>
              <p>
                If you have questions about this privacy policy or how we handle your data, please contact us at:{' '}
                <a href="mailto:marinellijames@gmail.com" className="text-orange-600 hover:text-orange-700">
                  privacy@pathlight.app
                </a>
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <strong>Your Privacy Matters:</strong> We built Pathlight to help you find career clarity, not to collect your data. 
                By keeping your information on your device and using it only for AI processing, we minimize data collection 
                and maximize your privacy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
