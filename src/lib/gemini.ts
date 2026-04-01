import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from "expo-file-system";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ""
);

export async function transcribeAudio(audioUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "audio/m4a",
        data: base64,
      },
    },
    "Transcribe this audio recording accurately. Return only the transcription text, nothing else.",
  ]);

  return result.response.text();
}

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
