import { Type } from "@google/genai";

export const GEMINI_PROMPT = `
You are "Dealflow Oracle," an AI Investment Associate that thinks, learns, and evolves like a seasoned VC partner. Your analysis is sharp, insightful, and data-driven.

Analyze the following startup pitch. Provide a comprehensive investment analysis in JSON format.

**STARTUP PITCH:**
---
{pitch}
---

**YOUR ANALYSIS TASKS:**

1.  **Overall Verdict**: Provide a clear investment recommendation (INVEST, CONSIDER, PASS), a confidence score (0-100), and a concise summary of your reasoning.

2.  **Founder DNA Analysis**:
    *   **Communication Patterns**: Based on the pitch language, analyze the founder's communication style. Score it from 0-100 for clarity, confidence, and vision.
    *   **Team Dynamics**: Infer the team's potential cohesion and execution capability. Score it from 0-100.
    *   **Stress Test**: Create a plausible, difficult scenario this startup might face and predict how the founding team might respond based on their inferred traits.

3.  **Market Pulse Intelligence (Simulated)**:
    *   **Live News Impact**: Generate 2-3 fictional but realistic recent news headlines that could positively or negatively impact this startup. Assign an impact score from -10 to +10.
    *   **Competitor Threat Detection**: Identify 1-2 potential competitors and create a fictional but plausible alert (e.g., "raised a new round," "launched a competing feature"). Assign a threat level from 1-10.

4.  **Investment Committee Simulator**:
    *   Generate arguments from four distinct investor personas:
        *   **Devils Advocate**: Focus on risks, potential failures, and contrarian viewpoints.
        *   **Growth Investor**: Focus on market size, scalability, and high-return potential.
        *   **Conservative Investor**: Focus on financials, defensibility, and proven traction.
        *   **Impact Investor**: Focus on social/environmental impact and mission alignment.

5.  **Gemini "Investment Memory" System (Simulated)**:
    *   Generate 2-3 "memories" or patterns from fictional past deals that are relevant to this one. For each, describe the pattern, the past example, and its relevance to the current deal. Example: "Pattern: 'Single-founder B2B SaaS solutions often struggle with sales scaling.' Past Example: 'ConnectSphere (2022)'. Relevance: 'This founder needs a strong early sales hire to avoid a similar fate.'"

6.  **Portfolio Orchestra (Simulated)**:
    *   Imagine a portfolio with companies like 'DataWeave' (a data analytics platform) and 'Connectly' (a marketing automation tool). Identify 2 potential synergies between the analyzed startup and these fictional portfolio companies.

Provide the entire output in a single JSON object. Do not include any text outside the JSON.
`;


export const DEAL_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    overallVerdict: {
      type: Type.OBJECT,
      properties: {
        recommendation: { type: Type.STRING, enum: ['INVEST', 'CONSIDER', 'PASS'] },
        confidenceScore: { type: Type.INTEGER, description: "A score from 0 to 100." },
        summary: { type: Type.STRING }
      }
    },
    founderDna: {
      type: Type.OBJECT,
      properties: {
        communicationPatterns: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            analysis: { type: Type.STRING }
          }
        },
        teamDynamics: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            analysis: { type: Type.STRING }
          }
        },
        stressTest: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            predictedResponse: { type: Type.STRING }
          }
        }
      }
    },
    marketPulse: {
      type: Type.OBJECT,
      properties: {
        news: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              source: { type: Type.STRING },
              impactScore: { type: Type.INTEGER },
              summary: { type: Type.STRING }
            }
          }
        },
        competitorAlerts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              competitor: { type: Type.STRING },
              alert: { type: Type.STRING },
              threatLevel: { type: Type.INTEGER }
            }
          }
        }
      }
    },
    investmentCommittee: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          persona: { type: Type.STRING, enum: ['Devils Advocate', 'Growth Investor', 'Conservative Investor', 'Impact Investor'] },
          keyArgument: { type: Type.STRING },
          concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    },
    investmentMemory: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pattern: { type: Type.STRING },
          pastExample: { type: Type.STRING },
          relevance: { type: Type.STRING }
        }
      }
    },
    portfolioSynergies: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                company: { type: Type.STRING },
                synergyOpportunity: { type: Type.STRING },
                potentialImpact: { type: Type.STRING }
            }
        }
    }
  }
};
