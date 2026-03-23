import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Terms() {
  const router = useRouter();

  const h2 = {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#F0EDE8',
    marginTop: 40,
    marginBottom: 16,
  };

  const h3 = {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.125rem',
    fontWeight: 500,
    color: '#F0EDE8',
    marginTop: 24,
    marginBottom: 8,
  };

  const p = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.9375rem',
    fontWeight: 300,
    lineHeight: 1.7,
    color: '#A8A4A0',
    marginBottom: 12,
  };

  const b = { color: '#F0EDE8', fontWeight: 500 };

  const li = {
    ...p,
    paddingLeft: 20,
    marginBottom: 8,
  };

  const dash = {
    color: '#5C5955',
    marginRight: 8,
  };

  const a = {
    color: '#B8A9FF',
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
  };

  const callout = {
    background: 'rgba(184,169,255,0.06)',
    border: '1px solid rgba(184,169,255,0.2)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    marginTop: 16,
  };

  const warning = {
    background: 'rgba(255,143,143,0.06)',
    border: '1px solid rgba(255,143,143,0.15)',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    marginTop: 16,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#5C5955', fontSize: '0.875rem', cursor: 'pointer', marginBottom: 40, fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.03em', marginBottom: 8 }}>Terms of Service</h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 24 }}>Last updated: March 2026</div>

        {/* Plain English Summary */}
        <div style={callout}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 12 }}>Plain English Summary</div>
          <div style={{ ...p, fontSize: '0.875rem' }}><span style={b}>What this is:</span> These are the rules for using Candoor. By using the service, you agree to these terms.</div>
          <div style={{ ...p, fontSize: '0.875rem', marginBottom: 4 }}><span style={b}>Key points:</span></div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>You must be 18+ to use Candoor</div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>This is a self-reflection tool, not professional career advice</div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>{"We're not liable if you make career decisions based on AI insights"}</div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>Your data stays on your device (localStorage)</div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>The career clarity report costs $39 AUD</div>
          <div style={{ ...li, fontSize: '0.875rem' }}><span style={dash}>—</span>Australian law applies</div>
        </div>

        {/* 1 */}
        <h2 style={h2}>1. Acceptance of Terms</h2>
        <h3 style={h3}>1.1 Agreement to Terms</h3>
        <div style={p}>{"By accessing or using Candoor (\"the Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to these Terms, you may not access or use the Service."}</div>
        <h3 style={h3}>1.2 Changes to Terms</h3>
        <div style={p}>We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Service. Your continued use of the Service after changes are posted constitutes acceptance of the modified Terms.</div>
        <h3 style={h3}>1.3 Who Can Use Candoor</h3>
        <div style={p}>You must be at least 18 years of age to use the Service. By using the Service, you represent and warrant that you are at least 18 years old.</div>

        {/* 2 */}
        <h2 style={h2}>2. Description of Service</h2>
        <h3 style={h3}>2.1 What Candoor Is</h3>
        <div style={p}>Candoor is a self-reflection tool that uses artificial intelligence to help users identify their strengths, deal-breakers, and potential career directions through guided conversation and AI-powered analysis.</div>
        <h3 style={h3}>2.2 What Candoor Is NOT</h3>
        <div style={p}>Candoor is NOT:</div>
        <div style={li}><span style={dash}>—</span>Professional career counselling or vocational guidance</div>
        <div style={li}><span style={dash}>—</span>A substitute for licensed career advisors or counsellors</div>
        <div style={li}><span style={dash}>—</span>A guarantee of career success or job placement</div>
        <div style={li}><span style={dash}>—</span>Psychological assessment or mental health counselling</div>
        <div style={li}><span style={dash}>—</span>Financial, legal, or medical advice</div>
        <h3 style={h3}>2.3 Service Components</h3>
        <div style={p}>The Service includes:</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Free:</span> AI-guided career conversation, profile overview, and 2 signature strengths</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Paid ($39 AUD):</span> Full career clarity report including all 5 signature strengths, strength combinations, deal-breakers, role territories, career narrative, downloadable PDF, and shareable strength cards</div>

        {/* 3 */}
        <h2 style={h2}>3. User Responsibilities</h2>
        <h3 style={h3}>3.1 Accurate Information</h3>
        <div style={p}>You agree to provide accurate and honest responses during your conversation. The quality of insights generated depends on the quality of information you provide.</div>
        <h3 style={h3}>3.2 Appropriate Use</h3>
        <div style={p}>You agree NOT to:</div>
        <div style={li}><span style={dash}>—</span>Use the Service for any illegal purpose</div>
        <div style={li}><span style={dash}>—</span>Enter false, misleading, or fraudulent information</div>
        <div style={li}><span style={dash}>—</span>Attempt to reverse-engineer, hack, or compromise the Service</div>
        <div style={li}><span style={dash}>—</span>Use automated tools to access the Service</div>
        <div style={li}><span style={dash}>—</span>Enter highly sensitive personal information (financial data, health records, government IDs, passwords)</div>
        <h3 style={h3}>3.3 Professional Advice</h3>
        <div style={p}>You acknowledge that Candoor does not provide professional career advice. You agree not to make significant career, educational, or life decisions based solely on AI-generated insights. You are encouraged to consult qualified professionals before making important decisions.</div>

        {/* 4 */}
        <h2 style={h2}>4. Data and Privacy</h2>
        <div style={p}>Your use of the Service is also governed by our <a href="/privacy" style={a}>Privacy Policy</a>. Key points:</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Local Storage:</span> Your responses are stored locally in your browser. We do not store your responses on our servers.</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Third-Party Processing:</span> {"Your responses are sent to Anthropic's Claude API for AI processing. Anthropic may retain logs for up to 30 days."}</div>
        <div style={li}><span style={dash}>—</span><span style={b}>No Guarantee of Data Persistence:</span> Browser updates or device changes may result in data loss. We are not liable for data loss.</div>

        {/* 5 */}
        <h2 style={h2}>5. Limitation of Liability</h2>
        <div style={warning}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#FF8F8F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Important Disclaimer</div>
          <div style={{ ...p, fontSize: '0.875rem' }}>AI-GENERATED INSIGHTS ARE PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ACCURACY, COMPLETENESS, OR SUITABILITY FOR ANY PARTICULAR PURPOSE.</div>
        </div>
        <div style={{ ...p, color: '#F0EDE8' }}>YOU ACKNOWLEDGE THAT YOU ARE SOLELY RESPONSIBLE FOR ANY DECISIONS YOU MAKE BASED ON INSIGHTS GENERATED BY THE SERVICE.</div>
        <div style={p}>We are not liable for:</div>
        <div style={li}><span style={dash}>—</span>Service interruptions, downtime, or unavailability</div>
        <div style={li}><span style={dash}>—</span>Data loss due to browser storage limitations</div>
        <div style={li}><span style={dash}>—</span>Bugs, errors, or inaccuracies in the Service</div>
        <div style={li}><span style={dash}>—</span>Third-party service failures (including Anthropic API)</div>
        <div style={{ ...p, marginTop: 16 }}>To the maximum extent permitted by law, our total liability shall not exceed the amount you paid us in the preceding 12 months, or AUD $100, whichever is less.</div>

        {/* 6 */}
        <h2 style={h2}>6. Payment Terms</h2>
        <div style={li}><span style={dash}>—</span><span style={b}>Pricing:</span> The full career clarity report costs AUD $39</div>
        <div style={li}><span style={dash}>—</span><span style={b}>No Refunds:</span> All sales are final once the report is generated and delivered</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Refund Exception:</span> If we fail to generate your report due to technical error, we will retry at no cost or provide a full refund</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Payment Processing:</span> Payments processed through Stripe. We do not store your payment details.</div>

        {/* 7 */}
        <h2 style={h2}>7. Termination</h2>
        <div style={p}>{"You may stop using the Service at any time by clearing your browser data or using the \"clear data\" option."}</div>
        <div style={p}>We reserve the right to suspend or terminate your access at any time, or to modify or discontinue the Service without notice.</div>

        {/* 8 */}
        <h2 style={h2}>8. Governing Law</h2>
        <div style={p}>These Terms are governed by the laws of the State of Victoria, Australia. Any disputes shall be subject to the exclusive jurisdiction of Victorian courts.</div>
        <div style={p}>Before filing legal action, you agree to contact us at <a href="mailto:hello@candoor.com" style={a}>hello@candoor.com</a> to attempt informal resolution.</div>
        <div style={p}>Any claim must be filed within one (1) year after it arose, or be forever barred.</div>

        {/* Contact */}
        <h2 style={h2}>Contact Us</h2>
        <div style={p}>Questions about these Terms? Contact us at: <a href="mailto:hello@candoor.com" style={a}>hello@candoor.com</a></div>

        {/* Acknowledgment */}
        <div style={{ ...callout, marginTop: 40 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#F0EDE8', marginBottom: 8 }}>Acknowledgment</div>
          <div style={{ ...p, fontSize: '0.875rem' }}>BY USING CANDOOR, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.</div>
        </div>
      </div>
    </div>
  );
}
