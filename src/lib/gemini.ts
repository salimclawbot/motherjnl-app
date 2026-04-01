const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

interface Insight {
  category: string;
  icon: string;
  detected: string;
  whyItMatters: string;
  recommendations: string[];
}

interface PriorityAction {
  rank: number;
  action: string;
  reason: string;
}

export interface AnalysisResult {
  summary: string;
  todayFocus: string;
  todayActions: string[];
  todayAffirmation: string;
  insights: Insight[];
  priorityActions: PriorityAction[];
  advice: string;
  alerts: string[];
  patterns: {
    moodDistribution: string[];
    entryFrequency: string[];
  };
}

export async function analyseEntry(text: string, mode: "today" | "week" = "week"): Promise<AnalysisResult | null> {
  const prompt = mode === "week"
    ? `You are a deeply empathetic wellness coach for mothers. Analyse these journal entries and return a detailed JSON object.

The mother has shared: ${text}

Return JSON with this exact structure:
{
  "summary": "2-3 sentence empathetic overview of her week",
  "todayFocus": "1 sentence about what she most needs today",
  "todayActions": ["specific action 1", "specific action 2", "specific action 3"],
  "todayAffirmation": "A warm personalised affirmation based on what she wrote",
  "insights": [
    {
      "category": "Physical Wellbeing",
      "icon": "body-outline",
      "detected": "what was detected from her entries",
      "whyItMatters": "brief explanation of why this is important",
      "recommendations": ["specific recommendation 1", "specific recommendation 2"]
    },
    {
      "category": "Emotional State",
      "icon": "heart-outline",
      "detected": "emotional patterns detected",
      "whyItMatters": "why this matters",
      "recommendations": ["rec 1", "rec 2"]
    },
    {
      "category": "Energy & Rest",
      "icon": "moon-outline",
      "detected": "energy/sleep observations",
      "whyItMatters": "why this matters",
      "recommendations": ["rec 1", "rec 2"]
    },
    {
      "category": "Self Care",
      "icon": "leaf-outline",
      "detected": "self care observations",
      "whyItMatters": "why this matters",
      "recommendations": ["rec 1", "rec 2"]
    }
  ],
  "priorityActions": [
    {"rank": 1, "action": "most important thing to do", "reason": "why"},
    {"rank": 2, "action": "second priority", "reason": "why"},
    {"rank": 3, "action": "third priority", "reason": "why"}
  ],
  "advice": "warm, detailed paragraph of overall advice (keep existing field for backwards compat)",
  "alerts": ["alert 1 if any"],
  "patterns": {
    "moodDistribution": ["pattern description"],
    "entryFrequency": ["frequency observation"]
  }
}

Be SPECIFIC to what she actually wrote. Never give generic advice. Reference her actual words and experiences.
Respond ONLY with valid JSON.`
    : `You are a deeply empathetic wellness coach for mothers. Based on these recent journal entries, provide focused guidance for TODAY.

The mother has shared: ${text}

Return JSON with this exact structure:
{
  "summary": "2-3 sentence empathetic overview",
  "todayFocus": "1 sentence about what she most needs today",
  "todayActions": ["specific action 1", "specific action 2", "specific action 3"],
  "todayAffirmation": "A warm personalised affirmation based on what she wrote",
  "insights": [],
  "priorityActions": [],
  "advice": "warm paragraph of advice for today",
  "alerts": [],
  "patterns": { "moodDistribution": [], "entryFrequency": [] }
}

Be SPECIFIC to what she actually wrote. Never give generic advice. Reference her actual words and experiences.
Respond ONLY with valid JSON.`;

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
