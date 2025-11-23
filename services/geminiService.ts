import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Difficulty, Topic, QuestionData, Language, Model } from "../types";

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_ID_MAPPING: Record<Model, string> = {
  [Model.Flash]: "gemini-2.5-flash",
  [Model.Pro]: "gemini-3-pro-preview",
  [Model.Lite]: "gemini-flash-lite-latest"
};

// Used for Live Streaming (Text parsing)
export const streamQuestion = async (
  topic: Topic,
  customTopic: string,
  difficulty: Difficulty,
  language: Language,
  model: Model,
  onUpdate: (data: Partial<QuestionData>) => void
) => {
  // We add a random seed/signature to the prompt to ensure that if we fire 
  // 3 parallel requests, they don't return the exact same cached response.
  const uniqueSeed = Math.random().toString(36).substring(7);

  // Determine the effective topic to use
  const effectiveTopic = customTopic && customTopic.trim().length > 0 
    ? customTopic 
    : topic;

  const prompt = `
    You are a interviewer. Generate a unique practice question.
    Topic: ${effectiveTopic}
    Difficulty: ${difficulty}
    Language: ${language}
    Request ID: ${uniqueSeed}

    Requirements:
    - Use Markdown formatting for text (bold, italics, lists).
    - Use LaTeX for ALL mathematical notation. 
      - Wrap inline math in single dollar signs, e.g., $P(A|B)$.
      - Wrap block math in double dollar signs, e.g., $$ E[X] = \\sum x p(x) $$.
    - Do NOT wrap the entire response in a single code block.

    Stream the response strictly in this format with these exact separators:
    
    ### TITLE
    (Write title here)
    ### QUESTION
    (Write question text here, supporting Markdown & LaTeX)
    ### HINT
    (Write hint here, supporting Markdown & LaTeX)
    ### SOLUTION
    (Write full solution here, supporting Markdown & LaTeX)
    ### TAKEAWAY
    (Write key takeaway here)
  `;

  const modelId = MODEL_ID_MAPPING[model];

  try {
    const response = await ai.models.generateContentStream({
      model: modelId,
      contents: prompt,
    });

    let fullText = "";
    
    for await (const chunk of response) {
      fullText += chunk.text;
      const parsed = parseStreamingText(fullText);
      onUpdate(parsed);
    }
  } catch (error) {
    console.error("Error streaming question:", error);
    throw error;
  }
};

const parseStreamingText = (text: string): Partial<QuestionData> => {
  const sections = {
    title: "",
    questionText: "",
    hint: "",
    solution: "",
    keyTakeaway: ""
  };

  // Improved Regex: Case-insensitive (/i) and flexible whitespace handling
  // This helps when smaller models like Flash Lite output "### Solution" instead of "### SOLUTION"
  const titleMatch = text.match(/###\s*TITLE\s*([\s\S]*?)(?=###|$)/i);
  const questionMatch = text.match(/###\s*QUESTION\s*([\s\S]*?)(?=###|$)/i);
  const hintMatch = text.match(/###\s*HINT\s*([\s\S]*?)(?=###|$)/i);
  const solutionMatch = text.match(/###\s*SOLUTION\s*([\s\S]*?)(?=###|$)/i);
  const takeawayMatch = text.match(/###\s*TAKEAWAY\s*([\s\S]*?)(?=###|$)/i);

  if (titleMatch) sections.title = titleMatch[1].trim();
  if (questionMatch) sections.questionText = questionMatch[1].trim();
  if (hintMatch) sections.hint = hintMatch[1].trim();
  if (solutionMatch) sections.solution = solutionMatch[1].trim();
  if (takeawayMatch) sections.keyTakeaway = takeawayMatch[1].trim();

  return sections;
};