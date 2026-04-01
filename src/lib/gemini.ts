const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "AIzaSyDoZ3FTneQFnMctxJMXnZ5OGyWrkaYUNcU";

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

function stripJsonMarkdown(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function analyseEntry(text: string, mode: "today" | "week" = "week"): Promise<AnalysisResult | null> {
  const prompt = `You are a deeply empathetic wellness coach specialising in maternal health. You ALWAYS produce rich, detailed, deeply personalised analysis — even when entries are short. A mother writing just 20 words is still telling you something important. Your job is to honour that and respond with FULL depth.

The mother has shared:
"""
${text}
"""

RULES:
- Every field must be filled with rich, specific, warm content
- Never use generic phrases like "you're doing great" without grounding them in what she wrote
- Even with short entries, expand using your deep knowledge of maternal wellbeing
- Physical Wellbeing, Emotional State, Energy & Rest, Self Care — all 4 insights must be detailed
- Priority actions must feel personally relevant to HER situation
- Affirmation must reference something specific she wrote

Return ONLY raw JSON — no markdown, no code fences, no explanation. Just the JSON object:
{
  "summary": "2-3 warm sentences that reflect exactly what she shared this week. Reference her words.",
  "todayFocus": "One powerful, specific sentence about what she most needs today.",
  "todayActions": [
    "Concrete action 1 tied directly to what she wrote",
    "Concrete action 2 she can do today",
    "Concrete action 3 that will genuinely help her"
  ],
  "todayAffirmation": "A warm personalised affirmation using her actual words or experiences as the foundation.",
  "insights": [
    {
      "category": "Physical Wellbeing",
      "icon": "body-outline",
      "detected": "Detailed observation about her physical state from the entries — even implicit signals count",
      "whyItMatters": "Why this specific physical pattern matters for a mother right now — be detailed",
      "recommendations": ["Specific actionable recommendation", "Another specific recommendation"]
    },
    {
      "category": "Emotional State",
      "icon": "heart-outline",
      "detected": "The emotional tone and patterns detected — what is she really feeling beneath the words",
      "whyItMatters": "Why attending to this emotional state is important — be detailed and caring",
      "recommendations": ["Specific recommendation", "Another specific recommendation"]
    },
    {
      "category": "Energy & Rest",
      "icon": "moon-outline",
      "detected": "What her entries reveal about her energy and rest — directly or between the lines",
      "whyItMatters": "Why managing energy and rest matters deeply for her and her family",
      "recommendations": ["Specific recommendation", "Another specific recommendation"]
    },
    {
      "category": "Self Care",
      "icon": "leaf-outline",
      "detected": "What the entries show about how she is (or isn't) caring for herself",
      "whyItMatters": "Why self care at this stage of motherhood is non-negotiable — be specific",
      "recommendations": ["Specific recommendation", "Another specific recommendation"]
    }
  ],
  "priorityActions": [
    {"rank": 1, "action": "The most important thing she should do this week", "reason": "Specific reason why this is top priority based on her entries"},
    {"rank": 2, "action": "Second priority action", "reason": "Why this matters for her specifically"},
    {"rank": 3, "action": "Third priority action", "reason": "Why this matters"}
  ],
  "advice": "A warm, detailed 4-5 sentence paragraph of overall advice. Reference her actual situation. Be specific, caring, and empowering.",
  "alerts": [],
  "patterns": {
    "moodDistribution": ["Describe the emotional tone pattern detected across her entries"],
    "entryFrequency": ["Observation about her journaling and what it reflects about her week"]
  }
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
          },
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

    const cleaned = stripJsonMarkdown(responseText);
    return JSON.parse(cleaned) as AnalysisResult;
  } catch (error) {
    console.error("analyseEntry failed:", error);
    return null;
  }
}
