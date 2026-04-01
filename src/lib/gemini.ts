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

function stripJsonMarkdown(text: string): string {
  // Strip ```json ... ``` or ``` ... ``` wrappers Gemini sometimes adds
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
}

export async function analyseEntry(text: string, mode: "today" | "week" = "week"): Promise<AnalysisResult | null> {
  const prompt = mode === "week"
    ? `You are a deeply empathetic wellness coach specialising in maternal health. You ALWAYS provide rich, detailed, deeply personalised analysis — even when entries are short. Short entries reveal just as much as long ones: what someone chooses to write (or not write) tells a story.

The mother has shared these journal entries:
"""
${text}
"""

IMPORTANT: Even if the entries are brief, you must still generate FULL, RICH, DETAILED content in every field. Use what she wrote as your anchor, then draw on your deep expertise in maternal wellbeing to expand with relevant, empathetic insights. Never return empty arrays. Never give generic platitudes — make it feel like you truly know her.

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:
{
  "summary": "2-3 warm, specific sentences that reflect what she shared and acknowledge the reality of her week. Reference her actual words where possible.",
  "todayFocus": "One powerful sentence about the single most important thing she needs to focus on today, based on her entries.",
  "todayActions": [
    "Specific, concrete action tied to what she wrote — not generic",
    "Another specific action she can take today",
    "A third meaningful action for today"
  ],
  "todayAffirmation": "A warm, personal affirmation that speaks directly to her situation — using her own words or experiences as the foundation.",
  "insights": [
    {
      "category": "Physical Wellbeing",
      "icon": "body-outline",
      "detected": "What physical signals or themes came through in her entries, even implicitly",
      "whyItMatters": "Why paying attention to this matters for a mother right now",
      "recommendations": ["Specific recommendation 1", "Specific recommendation 2"]
    },
    {
      "category": "Emotional State",
      "icon": "heart-outline",
      "detected": "The emotional tone and patterns you detect — even from few words",
      "whyItMatters": "Why this emotional pattern deserves attention",
      "recommendations": ["Specific recommendation 1", "Specific recommendation 2"]
    },
    {
      "category": "Energy & Rest",
      "icon": "moon-outline",
      "detected": "What her entries suggest about her energy levels and rest, directly or indirectly",
      "whyItMatters": "Why this matters for her and her family",
      "recommendations": ["Specific recommendation 1", "Specific recommendation 2"]
    },
    {
      "category": "Self Care",
      "icon": "leaf-outline",
      "detected": "What her entries reveal about how she is (or isn't) caring for herself",
      "whyItMatters": "Why self care at this stage of motherhood is critical",
      "recommendations": ["Specific recommendation 1", "Specific recommendation 2"]
    }
  ],
  "priorityActions": [
    {"rank": 1, "action": "The single most important thing she should do this week", "reason": "Why this is the top priority based on her entries"},
    {"rank": 2, "action": "Second priority action", "reason": "Why this matters"},
    {"rank": 3, "action": "Third priority action", "reason": "Why this matters"}
  ],
  "advice": "A warm, detailed 3-4 sentence paragraph of overall weekly advice. Be specific, caring, and grounded in what she shared.",
  "alerts": [],
  "patterns": {
    "moodDistribution": ["A description of the emotional tone patterns detected this week"],
    "entryFrequency": ["An observation about her journaling frequency and what it might mean"]
  }
}`
    : `You are a deeply empathetic wellness coach specialising in maternal health. You ALWAYS provide rich, detailed, deeply personalised analysis — even when entries are short.

The mother has shared these recent journal entries:
"""
${text}
"""

IMPORTANT: Even if the entries are brief, generate FULL, RICH content in every field. Use her words as the anchor, expand with expert maternal wellbeing insights. Never return empty content. Make it feel personal.

Return ONLY a valid JSON object (no markdown, no code blocks, no extra text) with this exact structure:
{
  "summary": "2-3 warm, specific sentences reflecting what she shared today.",
  "todayFocus": "One powerful sentence about the single most important thing she needs right now.",
  "todayActions": [
    "A specific action tied to what she wrote",
    "Another concrete thing she can do today",
    "A third meaningful action"
  ],
  "todayAffirmation": "A warm, personal affirmation rooted in her actual situation.",
  "insights": [],
  "priorityActions": [],
  "advice": "A warm, detailed 3-4 sentence paragraph of advice for today, specific to what she shared.",
  "alerts": [],
  "patterns": { "moodDistribution": [], "entryFrequency": [] }
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
            temperature: 0.7,
            responseMimeType: "application/json",
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
