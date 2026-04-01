import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ""
);

interface AnalysisResult {
  summary: string;
  advice: string;
  alerts: string[];
}

export async function analyseEntry(text: string): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a supportive wellness assistant for mothers. Analyse the following journal entries and return a JSON object with exactly these keys:
- "summary": a brief empathetic summary of the mother's week
- "advice": practical, gentle advice based on what she shared
- "alerts": an array of strings flagging anything concerning (empty array if nothing concerning)

Journal entries:
${text}

Respond ONLY with valid JSON, no markdown.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    return JSON.parse(responseText) as AnalysisResult;
  } catch {
    return {
      summary: responseText,
      advice: "Unable to parse structured advice. Please try again.",
      alerts: [],
    };
  }
}
