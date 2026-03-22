import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer';

// ═══════════════════════════════════════════════
// PATHLIGHT — PDF Report Generator
//
// POST /api/generate-pdf
// Body: { synthesisContent: string }
// Returns: application/pdf blob
// ═══════════════════════════════════════════════

// ── Colours ──
const C = {
  void: '#0A0A0B',
  surface: '#111113',
  elevated: '#1A1A1D',
  textPrimary: '#F0EDE8',
  textBody: '#A8A4A0',
  textMuted: '#5C5955',
  textGhost: '#3A3835',
  accent: '#B8A9FF',
  accentDim: '#7B6FBF',
  warm: '#FFB88C',
  cool: '#8CCFB8',
  sharp: '#FF8F8F',
  borderSubtle: '#1E1E21',
  borderAccent: '#3D3566',
};

// ── Styles ──
const s = StyleSheet.create({
  page: {
    backgroundColor: C.void,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    color: C.textBody,
  },
  // Cover
  coverPage: {
    backgroundColor: C.void,
    paddingHorizontal: 50,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  coverTitle: {
    fontSize: 42,
    fontweight: 'bold',
    color: C.textPrimary,
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 12,
    fontweight: 'normal',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  coverLine: {
    width: 40,
    height: 2,
    backgroundColor: C.accent,
    marginVertical: 24,
  },
  coverMeta: {
    fontSize: 9,
    color: C.textGhost,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 40,
  },
  // Section headers
  sectionLabel: {
    fontSize: 8,
    fontweight: 'normal',
    color: C.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontweight: 'bold',
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 16,
    lineHeight: 1.2,
  },
  // Body text
  bodyLg: {
    fontSize: 11,
    fontweight: 'normal',
    color: C.textBody,
    lineHeight: 1.7,
    marginBottom: 10,
  },
  body: {
    fontSize: 10,
    fontweight: 'normal',
    color: C.textBody,
    lineHeight: 1.65,
    marginBottom: 6,
  },
  // Cards
  card: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  cardAccent: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderAccent,
  },
  // Strength
  strengthNum: {
    fontSize: 8,
    color: C.accent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  strengthName: {
    fontSize: 16,
    fontweight: 'bold',
    color: C.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  // Sub-section labels
  labelWarm: {
    fontSize: 7,
    fontweight: 'normal',
    color: C.warm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  labelAccent: {
    fontSize: 7,
    fontweight: 'normal',
    color: C.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  labelSharp: {
    fontSize: 7,
    fontweight: 'normal',
    color: C.sharp,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  labelCool: {
    fontSize: 7,
    fontweight: 'normal',
    color: C.cool,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  labelMuted: {
    fontSize: 7,
    fontweight: 'normal',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginTop: 12,
  },
  // Inline bold
  bold: {
    fontweight: 'bold',
    color: C.textPrimary,
  },
  // Combo title
  comboTitle: {
    fontSize: 13,
    fontweight: 'bold',
    color: C.textPrimary,
    marginBottom: 6,
  },
  // Dealbreaker dash
  dbRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  dbDash: {
    fontSize: 10,
    color: C.sharp,
  },
  // Territory
  territoryName: {
    fontSize: 14,
    fontweight: 'bold',
    color: C.textPrimary,
    marginBottom: 8,
  },
  // Value prop
  valueProp: {
    fontSize: 12,
    fontweight: 'bold',
    color: C.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: C.borderSubtle,
    marginVertical: 20,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 7,
    color: C.textGhost,
    letterSpacing: 1,
  },
  // Narrative box
  narrativeBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  narrativeLabel: {
    fontSize: 9,
    fontweight: 'bold',
    color: C.textPrimary,
    marginBottom: 8,
  },
});

// ── Parser (lightweight, inline) ──
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();
}

function parseForPDF(content) {
  const r = {
    profile: '',
    strengths: [],
    whyTogether: '',
    valueProp: '',
    combos: [],
    rarestCombo: '',
    dealbreakers: { work: [], job: [], leadership: [], environment: [] },
    territories: [],
    careerNarrative: '',
    shortIntro: '',
  };

  try {
    const pm = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths)/);
    if (pm) r.profile = cleanText(pm[1]);

    const ss = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations)/);
    if (ss) {
      const labels = ['WHAT MAKES THIS VALUABLE:', 'HOW TO DEPLOY THIS:', 'WATCH OUT:', '---'];
      ss[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
        const lines = block.split('\n');
        const name = cleanText(lines[0]);
        if (!name || name.includes('WHY THESE') || name.includes('YOUR VALUE')) return;

        let descLines = [], i = 1;
        while (i < lines.length && !labels.some(l => lines[i].trim().startsWith(l))) {
          if (lines[i].trim()) descLines.push(lines[i].trim());
          i++;
        }

        const getSection = (label) => {
          const idx = block.indexOf(label);
          if (idx === -1) return '';
          const after = block.substring(idx + label.length);
          const nl = labels.find(l => l !== label && after.indexOf(l) > 0);
          return cleanText(after.substring(0, nl ? after.indexOf(nl) : after.length));
        };

        const deployRaw = getSection('HOW TO DEPLOY THIS:');
        const gdf = (field) => {
          const m = deployRaw.match(new RegExp(field + ':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)', 's'));
          return m ? cleanText(m[1]) : '';
        };

        if (name) {
          r.strengths.push({
            name,
            description: cleanText(descLines.join(' ')),
            valuable: getSection('WHAT MAKES THIS VALUABLE:'),
            thisWeek: gdf('This week'),
            inInterviews: gdf('In interviews'),
            bestRoles: gdf('Best roles for this'),
            watchOut: getSection('WATCH OUT:'),
          });
        }
      });

      const wtm = ss[1].match(/WHY THESE MATTER TOGETHER:\n([\s\S]*?)(?=\nYOUR VALUE PROPOSITION:|$)/);
      if (wtm) r.whyTogether = cleanText(wtm[1]);
      const vpm = ss[1].match(/YOUR VALUE PROPOSITION:\n"([^"]+)"/);
      if (vpm) r.valueProp = vpm[1];
    }

    const cs = content.match(/## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers)/);
    if (cs) {
      cs[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
        const lines = block.split('\n');
        const title = cleanText(lines[0]);
        if (!title) return;
        const body = cleanText(lines.slice(1).filter(l => l.trim() && !l.startsWith('RAREST')).join('\n'));
        if (title && body) r.combos.push({ title, body });
      });
      const rm = cs[1].match(/RAREST COMBINATION:\s*([\s\S]*?)$/);
      if (rm) r.rarestCombo = cleanText(rm[1]);
    }

    const ds = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories)/);
    if (ds) {
      const dt = ds[1];
      const extract = (label) => {
        const m = dt.match(new RegExp(label + ':\\n([\\s\\S]*?)(?=\\nDEALBREAKERS_|\\n## |$)'));
        return m ? m[1].trim().split('\n').filter(l => l.trim().startsWith('-')).map(l => cleanText(l.replace(/^-\s*/, ''))) : [];
      };
      r.dealbreakers.work = extract('DEALBREAKERS_WORK');
      r.dealbreakers.job = extract('DEALBREAKERS_JOB');
      r.dealbreakers.leadership = extract('DEALBREAKERS_LEADERSHIP');
      r.dealbreakers.environment = extract('DEALBREAKERS_ENVIRONMENT');
    }

    const ts = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative)/);
    if (ts) {
      ts[1].split(/\n### /).filter(b => b.trim()).forEach(block => {
        const lines = block.split('\n');
        const name = cleanText(lines[0]);
        if (!name) return;
        const body = lines.slice(1).join('\n');
        const gf = (label) => {
          const m = body.match(new RegExp(label + ':\\s*(.+?)(?=\\n[A-Z]|$)', 's'));
          return m ? cleanText(m[1]) : '';
        };
        r.territories.push({
          name,
          whyFits: gf('WHY THIS FITS'),
          transfers: gf('WHAT TRANSFERS'),
          gaps: gf('POSSIBLE GAPS'),
          salary: gf('SALARY RANGE'),
          searchTerms: gf('SEARCH TERMS'),
        });
      });
    }

    const ln = content.match(/LINKEDIN VERSION:\n([\s\S]*?)(?=\nINTRO VERSION:)/);
    if (ln) r.careerNarrative = cleanText(ln[1]);
    const iv = content.match(/INTRO VERSION:\n([\s\S]*?)$/);
    if (iv) r.shortIntro = cleanText(iv[1]);
  } catch (e) {
    console.error('PDF parse error:', e);
  }

  return r;
}

// ── Footer component ──
function Footer({ pageLabel }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>PATHLIGHT</Text>
      <Text style={s.footerText}>{pageLabel}</Text>
    </View>
  );
}

// ── PDF Document ──
function ReportDocument({ data }) {
  const d = data;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={{ backgroundColor: C.void }}>
        <View style={s.coverPage}>
          <Text style={s.coverTitle}>Pathlight</Text>
          <View style={s.coverLine} />
          <Text style={s.coverSubtitle}>Career Clarity Report</Text>
          <Text style={s.coverMeta}>
            Generated {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={{ ...s.coverMeta, marginTop: 8 }}>
            Private · AI-Generated · For personal use only
          </Text>
        </View>
      </Page>

      {/* Profile */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Your Profile</Text>
        <Text style={s.sectionTitle}>{"Here's what we see in you"}</Text>
        {d.profile.split('\n').filter(p => p.trim()).map((p, i) => (
          <Text key={i} style={s.bodyLg}>{p}</Text>
        ))}
        <Footer pageLabel="PROFILE" />
      </Page>

      {/* Strengths */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Signature Strengths</Text>
        <Text style={s.sectionTitle}>What you bring to the table</Text>

        {d.strengths.map((pw, i) => (
          <View key={i} style={s.card} wrap={false}>
            <Text style={s.strengthNum}>
              STRENGTH {String(i + 1).padStart(2, '0')}
            </Text>
            <Text style={s.strengthName}>{pw.name}</Text>
            <Text style={s.body}>{pw.description}</Text>

            {pw.valuable ? (
              <>
                <Text style={s.labelWarm}>What makes this valuable</Text>
                <Text style={s.body}>{pw.valuable}</Text>
              </>
            ) : null}

            <Text style={s.labelAccent}>How to deploy this</Text>
            {pw.thisWeek ? (
              <Text style={s.body}>
                <Text style={s.bold}>This week: </Text>
                {pw.thisWeek}
              </Text>
            ) : null}
            {pw.inInterviews ? (
              <Text style={s.body}>
                <Text style={s.bold}>In interviews: </Text>
                {pw.inInterviews}
              </Text>
            ) : null}
            {pw.bestRoles ? (
              <Text style={s.body}>
                <Text style={s.bold}>Best roles: </Text>
                {pw.bestRoles}
              </Text>
            ) : null}

            {pw.watchOut ? (
              <>
                <Text style={s.labelSharp}>Watch out</Text>
                <Text style={s.body}>{pw.watchOut}</Text>
              </>
            ) : null}
          </View>
        ))}

        {d.whyTogether ? (
          <>
            <View style={s.divider} />
            <Text style={s.labelAccent}>Why these matter together</Text>
            <Text style={s.bodyLg}>{d.whyTogether}</Text>
          </>
        ) : null}

        {d.valueProp ? (
          <View style={s.cardAccent}>
            <Text style={s.valueProp}>"{d.valueProp}"</Text>
          </View>
        ) : null}

        <Footer pageLabel="STRENGTHS" />
      </Page>

      {/* Combinations */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Strength Combinations</Text>
        <Text style={s.sectionTitle}>Where your strengths multiply</Text>

        {d.combos.map((c, i) => (
          <View key={i} style={s.card} wrap={false}>
            <Text style={s.comboTitle}>{c.title}</Text>
            <Text style={s.body}>{c.body}</Text>
          </View>
        ))}

        {d.rarestCombo ? (
          <View style={s.cardAccent}>
            <Text style={s.labelAccent}>Your rarest combination</Text>
            <Text style={s.body}>{d.rarestCombo}</Text>
          </View>
        ) : null}

        <Footer pageLabel="COMBINATIONS" />
      </Page>

      {/* Deal-Breakers */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Deal-Breakers</Text>
        <Text style={s.sectionTitle}>{"What doesn't work for you"}</Text>

        {[
          ['About the work', d.dealbreakers.work],
          ['What comes with the job', d.dealbreakers.job],
          ['About leadership', d.dealbreakers.leadership],
          ['About the environment', d.dealbreakers.environment],
        ].map(([label, items]) =>
          items.length > 0 ? (
            <View key={label} style={s.card} wrap={false}>
              <Text style={{ ...s.body, color: C.textPrimary, fontweight: 'bold', marginBottom: 8 }}>
                {label}
              </Text>
              {items.map((item, i) => (
                <View key={i} style={s.dbRow}>
                  <Text style={s.dbDash}>—</Text>
                  <Text style={s.body}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null
        )}

        <Footer pageLabel="DEAL-BREAKERS" />
      </Page>

      {/* Role Territories */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Role Territories</Text>
        <Text style={s.sectionTitle}>Paths to explore</Text>

        {d.territories.map((t, i) => (
          <View key={i} style={s.card} wrap={false}>
            <Text style={s.territoryName}>{t.name}</Text>

            {t.whyFits ? (
              <>
                <Text style={s.labelAccent}>Why this fits</Text>
                <Text style={s.body}>{t.whyFits}</Text>
              </>
            ) : null}
            {t.transfers ? (
              <>
                <Text style={s.labelWarm}>What transfers</Text>
                <Text style={s.body}>{t.transfers}</Text>
              </>
            ) : null}
            {t.gaps ? (
              <>
                <Text style={s.labelSharp}>Possible gaps</Text>
                <Text style={s.body}>{t.gaps}</Text>
              </>
            ) : null}
            {t.salary ? (
              <>
                <Text style={s.labelMuted}>Salary range</Text>
                <Text style={s.body}>{t.salary}</Text>
              </>
            ) : null}
            {t.searchTerms ? (
              <>
                <Text style={s.labelMuted}>Search terms</Text>
                <Text style={s.body}>{t.searchTerms}</Text>
              </>
            ) : null}
          </View>
        ))}

        <Footer pageLabel="TERRITORIES" />
      </Page>

      {/* Career Narrative */}
      <Page size="A4" style={s.page}>
        <Text style={s.sectionLabel}>Career Narrative</Text>
        <Text style={s.sectionTitle}>Your story, ready to use</Text>

        {d.careerNarrative ? (
          <View style={s.narrativeBox}>
            <Text style={s.narrativeLabel}>LinkedIn / About</Text>
            <Text style={s.bodyLg}>{d.careerNarrative}</Text>
          </View>
        ) : null}

        {d.shortIntro ? (
          <View style={s.narrativeBox}>
            <Text style={s.narrativeLabel}>30-Second Introduction</Text>
            <Text style={s.bodyLg}>{d.shortIntro}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <View style={s.coverLine} />
          <Text style={{ ...s.coverMeta, textAlign: 'center', marginTop: 16 }}>
            Generated by Pathlight · pathlight.app
          </Text>
          <Text style={{ ...s.coverMeta, textAlign: 'center', marginTop: 4 }}>
            This report is for personal reflection only
          </Text>
        </View>

        <Footer pageLabel="NARRATIVE" />
      </Page>
    </Document>
  );
}

// ── API Handler ──
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { synthesisContent } = req.body;
    if (!synthesisContent) {
      return res.status(400).json({ error: 'Missing synthesisContent' });
    }

    const data = parseForPDF(synthesisContent);
    const buffer = await renderToBuffer(
      <ReportDocument data={data} />
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=pathlight-career-report.pdf'
    );
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'PDF generation failed' });
  }
}

// Increase serverless function timeout for PDF generation
export const config = {
  maxDuration: 30,
};
