import { GoogleGenAI } from "@google/genai";
import type { DealAnalysis } from "../types";
import { GEMINI_PROMPT, DEAL_ANALYSIS_SCHEMA } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function analyzeDeal(pitch: string): Promise<DealAnalysis> {
  const prompt = GEMINI_PROMPT.replace('{pitch}', pitch);
  
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: DEAL_ANALYSIS_SCHEMA,
            temperature: 0.5,
        }
    });

    const jsonText = response.text.trim();
    // In case the model wraps the JSON in markdown
    const cleanedJsonText = jsonText.replace(/^```json\n?/, "").replace(/```$/, "");
    const parsedData = JSON.parse(cleanedJsonText);
    
    return parsedData as DealAnalysis;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get analysis from Gemini API.");
  }
}
