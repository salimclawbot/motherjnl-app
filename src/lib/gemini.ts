const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

interface AnalysisResult {
  summary: string;
  advice: string;
  alerts: string[];
  patterns: {
    moodDistribution: string[];
    entryFrequency: string[];
  };
}

export async function analyseEntry(text: string): Promise<AnalysisResult | null> {
  const prompt = `You are a supportive wellness assistant for mothers. Analyse the following journal entries and return a JSON object with exactly these keys:
- "summary": a brief empathetic summary of the mother's week
- "advice": practical, gentle advice based on what she shared
- "alerts": an array of strings flagging anything concerning (empty array if nothing concerning)
- "patterns": an object with "moodDistribution" (array of strings describing mood patterns) and "entryFrequency" (array of strings describing journaling frequency observations)

Journal entries:
${text}

Respond ONLY with valid JSON, no markdown.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Gemini API error:", response.status, errorBody);
      return null;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("Gemini API returned unexpected shape:", JSON.stringify(data));
      return null;
    }

    return JSON.parse(responseText) as AnalysisResult;
  } catch (error) {
    console.error("analyseEntry failed:", error);
    return null;
  }
}
