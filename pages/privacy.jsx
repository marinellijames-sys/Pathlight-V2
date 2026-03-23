import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

export default function Privacy() {
  const router = useRouter();

  const h2 = {
    fontFamily: "'Syne', sans-serif",
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#F0EDE8',
    marginTop: 40,
    marginBottom: 16,
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

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#5C5955', fontSize: '0.875rem', cursor: 'pointer', marginBottom: 40, fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft size={16} /> Back
        </button>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.6875rem', color: '#5C5955', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 40 }}>Last updated: March 2026</div>

        <h2 style={h2}>Overview</h2>
        <div style={p}>Candoor is a career clarity tool that helps you discover your strengths and identify potential career directions through AI-powered conversation. We take your privacy seriously and are committed to protecting your personal information.</div>

        <h2 style={h2}>Information We Collect</h2>
        <div style={p}>When you use Candoor, we collect:</div>
        <div style={li}><span style={dash}>—</span>Your responses to career reflection questions</div>
        <div style={li}><span style={dash}>—</span>Information about your career history, strengths, and goals that you provide</div>
        <div style={{ ...p, marginTop: 16 }}><span style={b}>We do NOT collect:</span> Your name, email address, phone number, or other identifying information unless you explicitly provide it in your responses.</div>

        <h2 style={h2}>How We Use Your Information</h2>
        <div style={p}>Your information is used solely to:</div>
        <div style={li}><span style={dash}>—</span>Generate your personalised career clarity report</div>
        <div style={li}><span style={dash}>—</span>Create your signature strengths, deal-breakers, and role territories</div>
        <div style={li}><span style={dash}>—</span>Generate shareable strength cards and career narrative</div>
        <div style={{ ...p, marginTop: 16 }}>We do NOT use your information for marketing, advertising, or any other purpose.</div>

        <h2 style={h2}>How We Store Your Information</h2>
        <div style={p}>Your data is stored <span style={b}>locally in your browser</span> using localStorage. We do not maintain a database of user information on our servers.</div>
        <div style={p}>This means:</div>
        <div style={li}><span style={dash}>—</span>Your data stays on your device</div>
        <div style={li}><span style={dash}>—</span>We cannot access your responses or report</div>
        <div style={li}><span style={dash}>—</span>Clearing your browser data will delete all your Candoor information</div>
        <div style={li}><span style={dash}>—</span>Your data will not sync across devices</div>

        <h2 style={h2}>Third-Party Processing</h2>
        <div style={p}>We use <span style={b}>{"Anthropic's Claude API"}</span> to process your responses and generate insights. When you use Candoor:</div>
        <div style={li}><span style={dash}>—</span>{"Your responses are sent to Anthropic's servers for AI processing"}</div>
        <div style={li}><span style={dash}>—</span>Anthropic may retain logs for up to 30 days for safety and abuse prevention</div>
        <div style={li}><span style={dash}>—</span>Anthropic does not use your data to train their AI models</div>
        <div style={li}><span style={dash}>—</span>Your data is transmitted securely using HTTPS encryption</div>
        <div style={{ ...p, marginTop: 16 }}>We use <span style={b}>Stripe</span> for payment processing. Stripe handles all payment data directly. We do not see or store your card details.</div>
        <div style={p}>{"You can review Anthropic's privacy policy at: "}<a href="https://www.anthropic.com/privacy" style={a}>anthropic.com/privacy</a></div>

        <h2 style={h2}>Your Rights</h2>
        <div style={p}>You have the right to:</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Access your data:</span> All your data is stored locally in your browser and visible to you at all times</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Delete your data:</span> {"Click \"clear data\" at any time to permanently delete all your information"}</div>
        <div style={li}><span style={dash}>—</span><span style={b}>Withdraw consent:</span> Stop using Candoor at any time</div>

        <h2 style={h2}>Data Security</h2>
        <div style={p}>We implement appropriate technical measures to protect your information:</div>
        <div style={li}><span style={dash}>—</span>All data transmission uses HTTPS encryption</div>
        <div style={li}><span style={dash}>—</span>API keys are stored securely on our servers, never in your browser</div>
        <div style={li}><span style={dash}>—</span>We do not store your responses on our servers</div>

        <h2 style={h2}>Changes to This Policy</h2>
        <div style={p}>We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Last updated" date at the top of this policy.</div>

        <h2 style={h2}>Contact Us</h2>
        <div style={p}>If you have questions about this privacy policy or how we handle your data, please contact us at: <a href="mailto:hello@candoor.com" style={a}>hello@candoor.com</a></div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ ...p, fontSize: '0.8125rem', color: '#5C5955' }}><span style={{ color: '#A8A4A0', fontWeight: 500 }}>Your Privacy Matters:</span> We built Candoor to help you understand your strengths, not to collect your data. By keeping your information on your device and using it only for AI processing, we minimise data collection and maximise your privacy.</div>
        </div>
      </div>
    </div>
  );
}
