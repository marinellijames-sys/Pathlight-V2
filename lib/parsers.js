import { clean } from '../components/shared/DesignSystem';

// ═══════════════════════════════════════════════
// PARSE AI RESPONSE — simplified, no interaction blocks
// ═══════════════════════════════════════════════

export function parseAIResponse(text) {
  // Strip any accidental interaction blocks (AI may still emit them)
  const cleaned = text.replace(/:::interaction\n[\s\S]*?\n:::/, '').trim();
  return { conversationText: cleaned };
}

// ═══════════════════════════════════════════════
// SYNTHESIS PARSER (unchanged)
// ═══════════════════════════════════════════════

export function parseSynthesis(content) {
  if (!content) return null;

  const s = {
    profile: '',
    superpowers: [],
    superpowersSummary: { whyTogether: '', valueProp: '' },
    strengthCombos: [],
    rarestCombo: '',
    dealbreakers: { work: [], job: [], leadership: [], environment: [] },
    territories: [],
    careerNarrative: '',
    shortIntro: '',
  };

  try {
    // Profile
    const pm = content.match(
      /## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths)/
    );
    if (pm) s.profile = clean(pm[1]);

    // Signature Strengths
    const ss = content.match(
      /## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Strength Combinations)/
    );
    if (ss) {
      const fullText = ss[1];
      const labels = [
        'WHAT MAKES THIS VALUABLE:',
        'YOUR ELEVATOR PITCH:',
        'HOW TO DEPLOY THIS:',
        'WATCH OUT:',
        '---',
      ];

      fullText
        .split(/\n### /)
        .filter((b) => b.trim())
        .forEach((block) => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (
            !name ||
            name.includes('WHY THESE') ||
            name.includes('YOUR VALUE')
          )
            return;

          let descLines = [];
          let i = 1;
          while (
            i < lines.length &&
            !labels.some((l) => lines[i].trim().startsWith(l))
          ) {
            if (lines[i].trim()) descLines.push(lines[i].trim());
            i++;
          }
          const description = clean(descLines.join(' '));

          const getSection = (label) => {
            const idx = block.indexOf(label);
            if (idx === -1) return '';
            const after = block.substring(idx + label.length);
            const nl = labels.find(
              (l) => l !== label && after.indexOf(l) > 0
            );
            return clean(
              after.substring(0, nl ? after.indexOf(nl) : after.length)
            );
          };

          const deployRaw = getSection('HOW TO DEPLOY THIS:');
          const gdf = (field) => {
            const m = deployRaw.match(
              new RegExp(
                field +
                  ':\\s*(.+?)(?=\\n|This week:|In interviews:|Best roles|$)',
                's'
              )
            );
            return m ? clean(m[1]) : '';
          };

          if (name && description) {
            // Parse numbered value items
            const valuableRaw = getSection('WHAT MAKES THIS VALUABLE:');
            const valueItems = valuableRaw
              .split(/\n(?=\d\.)/)
              .map((v) => clean(v.replace(/^\d\.\s*/, '')))
              .filter((v) => v.length > 0);

            // Parse elevator pitch — strip surrounding quotes
            let elevatorPitch = getSection('YOUR ELEVATOR PITCH:');
            elevatorPitch = elevatorPitch.replace(/^["']|["']$/g, '').trim();

            s.superpowers.push({
              name,
              description,
              valuable: valuableRaw,
              valueItems: valueItems.length > 0 ? valueItems : [valuableRaw],
              elevatorPitch,
              thisWeek: gdf('This week'),
              inInterviews: gdf('In interviews'),
              bestRoles: gdf('Best roles for this'),
              watchOut: getSection('WATCH OUT:'),
            });
          }
        });

      const wtm = fullText.match(
        /WHY THESE MATTER TOGETHER:\n([\s\S]*?)(?=\nYOUR VALUE PROPOSITION:|$)/
      );
      if (wtm) s.superpowersSummary.whyTogether = clean(wtm[1]);

      const vpm = fullText.match(/YOUR VALUE PROPOSITION:\n"([^"]+)"/);
      if (vpm) s.superpowersSummary.valueProp = vpm[1];
    }

    // Strength Combinations
    const cs = content.match(
      /## Your Strength Combinations\n\n([\s\S]*?)(?=\n## Your Deal-Breakers)/
    );
    if (cs) {
      cs[1]
        .split(/\n### /)
        .filter((b) => b.trim())
        .forEach((block) => {
          const lines = block.split('\n');
          const title = clean(lines[0]);
          if (!title) return;
          const body = clean(
            lines
              .slice(1)
              .filter((l) => l.trim() && !l.startsWith('RAREST'))
              .join('\n')
          );
          if (title && body) s.strengthCombos.push({ title, body });
        });

      const rm = cs[1].match(/RAREST COMBINATION:\s*([\s\S]*?)$/);
      if (rm) s.rarestCombo = clean(rm[1]);
    }

    // Deal-Breakers
    const ds = content.match(
      /## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories)/
    );
    if (ds) {
      const dt = ds[1];
      const extractItems = (label) => {
        const m = dt.match(
          new RegExp(
            label + ':\\n([\\s\\S]*?)(?=\\nDEALBREAKERS_|\\n## |$)'
          )
        );
        return m
          ? m[1]
              .trim()
              .split('\n')
              .filter((l) => l.trim().startsWith('-'))
              .map((l) => clean(l.replace(/^-\s*/, '')))
          : [];
      };
      s.dealbreakers.work = extractItems('DEALBREAKERS_WORK');
      s.dealbreakers.job = extractItems('DEALBREAKERS_JOB');
      s.dealbreakers.leadership = extractItems('DEALBREAKERS_LEADERSHIP');
      s.dealbreakers.environment = extractItems('DEALBREAKERS_ENVIRONMENT');
    }

    // Role Territories
    const ts = content.match(
      /## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Your Career Narrative)/
    );
    if (ts) {
      ts[1]
        .split(/\n### /)
        .filter((b) => b.trim())
        .forEach((block) => {
          const lines = block.split('\n');
          const name = clean(lines[0]);
          if (!name) return;
          const body = lines.slice(1).join('\n');
          const gf = (label) => {
            const m = body.match(
              new RegExp(label + ':\\s*(.+?)(?=\\n[A-Z]|$)', 's')
            );
            return m ? clean(m[1]) : '';
          };
          s.territories.push({
            name,
            whyFits: gf('WHY THIS FITS'),
            transfers: gf('WHAT TRANSFERS'),
            gaps: gf('POSSIBLE GAPS'),
            salary: gf('SALARY RANGE'),
            searchTerms: gf('SEARCH TERMS'),
            dealbreakers: gf('RESPECTS YOUR DEAL-BREAKERS'),
          });
        });
    }

    // Career Narrative
    const ln = content.match(
      /LINKEDIN VERSION:\n([\s\S]*?)(?=\nINTRO VERSION:)/
    );
    if (ln) s.careerNarrative = clean(ln[1]);

    const iv = content.match(/INTRO VERSION:\n([\s\S]*?)$/);
    if (iv) s.shortIntro = clean(iv[1]);
  } catch (e) {
    console.error('Parse error:', e);
    return null;
  }

  return s;
}
