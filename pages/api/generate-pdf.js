// pages/api/generate-pdf.js
// Generates PDF from markdown synthesis content

import ReactPDF from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import React from 'react';

// Register fonts
Font.register({
  family: 'EB Garamond',
  src: 'https://fonts.gstatic.com/s/ebgaramond/v26/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUA4V-e6yHgQ.ttf'
});

Font.register({
  family: 'Nunito Sans',
  src: 'https://fonts.gstatic.com/s/nunitosans/v15/pe0qMImSLYBIv1o4X1M8cce9I94.ttf'
});

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FFFDF9',
    fontFamily: 'Nunito Sans',
  },
  header: {
    marginBottom: 30,
    borderBottom: '1px solid #D4D4D4',
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'EB Garamond',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#8A8A8A',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'EB Garamond',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '1px solid #D4D4D4',
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#404040',
    marginBottom: 10,
  },
  strengthCard: {
    backgroundColor: '#FAF8F5',
    padding: 15,
    marginBottom: 12,
    borderRadius: 4,
    border: '1px solid #D4D4D4',
  },
  strengthName: {
    fontSize: 14,
    fontFamily: 'EB Garamond',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  strengthDescription: {
    fontSize: 10,
    color: '#404040',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 10,
    color: '#5C5650',
    marginLeft: 10,
    marginBottom: 4,
  },
  dealbreaker: {
    fontSize: 10,
    color: '#404040',
    marginBottom: 6,
    paddingLeft: 15,
  },
  dealbreakerCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginTop: 10,
    marginBottom: 6,
  },
  territory: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: '1px solid #E5E5E5',
  },
  territoryName: {
    fontSize: 12,
    fontFamily: 'EB Garamond',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  territoryDescription: {
    fontSize: 10,
    color: '#5C5650',
    lineHeight: 1.4,
  },
  nextStep: {
    backgroundColor: '#FAF8F5',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  nextStepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  nextStepText: {
    fontSize: 10,
    color: '#404040',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#8A8A8A',
    borderTop: '1px solid #D4D4D4',
    paddingTop: 15,
  },
});

// Parse markdown to structured data
function parseMarkdown(content) {
  const sections = {
    profile: '',
    strengths: [],
    dealbreakers: '',
    territories: [],
    nextSteps: []
  };

  // Profile
  const profileMatch = content.match(/## Your Profile\n\n([\s\S]*?)(?=\n## Your Signature Strengths|$)/);
  if (profileMatch) sections.profile = profileMatch[1].trim();

  // Strengths
  const strengthsMatch = content.match(/## Your Signature Strengths\n\n([\s\S]*?)(?=\n## Your Deal-Breakers|$)/);
  if (strengthsMatch) {
    const strengthBlocks = strengthsMatch[1].split(/\n### \*\*/);
    strengthBlocks.forEach(block => {
      if (!block.trim()) return;
      const lines = block.split('\n');
      const name = lines[0].replace(/\*\*/g, '').trim();
      if (name && !name.includes('Why these matter')) {
        sections.strengths.push({
          name,
          content: lines.slice(1).join('\n').trim()
        });
      }
    });
  }

  // Deal-breakers
  const dealbreakersMatch = content.match(/## Your Deal-Breakers\n\n([\s\S]*?)(?=\n## Role Territories|$)/);
  if (dealbreakersMatch) sections.dealbreakers = dealbreakersMatch[1].trim();

  // Territories
  const territoriesMatch = content.match(/## Role Territories to Explore\n\n([\s\S]*?)(?=\n## Next Three Steps|$)/);
  if (territoriesMatch) {
    const territoryBlocks = territoriesMatch[1].split(/\n\*\*/).filter(b => b.trim());
    territoryBlocks.forEach(block => {
      const lines = block.split('\n');
      const name = lines[0].replace(/\*\*/g, '').trim();
      if (name) {
        sections.territories.push({
          name,
          description: lines.slice(1).join(' ').trim().substring(0, 300)
        });
      }
    });
  }

  // Next Steps
  const stepsMatch = content.match(/## Next Three Steps\n\n([\s\S]*?)$/);
  if (stepsMatch) {
    const stepLines = stepsMatch[1].split(/\n\d+\.\s/).filter(s => s.trim());
    sections.nextSteps = stepLines.map(s => s.replace(/\*\*/g, '').trim());
  }

  return sections;
}

// PDF Document Component
const PathlightReport = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Pathlight</Text>
        <Text style={styles.subtitle}>Your Personalized Career Report</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Profile</Text>
        <Text style={styles.paragraph}>{data.profile}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Signature Strengths</Text>
        {data.strengths.slice(0, 4).map((strength, idx) => (
          <View key={idx} style={styles.strengthCard}>
            <Text style={styles.strengthName}>{strength.name}</Text>
            <Text style={styles.strengthDescription}>{strength.content.substring(0, 400)}...</Text>
          </View>
        ))}
      </View>
    </Page>

    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Deal-Breakers</Text>
        <Text style={styles.paragraph}>{data.dealbreakers}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Role Territories to Explore</Text>
        {data.territories.slice(0, 5).map((territory, idx) => (
          <View key={idx} style={styles.territory}>
            <Text style={styles.territoryName}>{territory.name}</Text>
            <Text style={styles.territoryDescription}>{territory.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Next Three Steps</Text>
        {data.nextSteps.slice(0, 3).map((step, idx) => (
          <View key={idx} style={styles.nextStep}>
            <Text style={styles.nextStepNumber}>Step {idx + 1}</Text>
            <Text style={styles.nextStepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Generated by Pathlight | pathlight-v2.vercel.app</Text>
      </View>
    </Page>
  </Document>
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { synthesisContent } = req.body;
    
    if (!synthesisContent) {
      return res.status(400).json({ error: 'No synthesis content provided' });
    }

    const parsedData = parseMarkdown(synthesisContent);
    
    const pdfBuffer = await ReactPDF.renderToBuffer(
      <PathlightReport data={parsedData} />
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=pathlight-report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
}
