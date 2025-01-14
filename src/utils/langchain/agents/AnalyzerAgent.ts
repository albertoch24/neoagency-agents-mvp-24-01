import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const analyzerPrompt = PromptTemplate.fromTemplate(`
Analizza il seguente feedback per un output di workflow:
{feedback}

Considera e struttura la tua risposta secondo questi punti:
1. Punti principali di feedback
2. Priorità delle modifiche
3. Tipo di modifiche richieste
4. Sentiment generale
5. Aree specifiche da migliorare

Output richiesto in formato JSON strutturato.
`);

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

export const analyzerChain = RunnableSequence.from([
  analyzerPrompt,
  model,
  new StringOutputParser(),
]);

export const analyzeFeedback = async (feedback: string) => {
  try {
    console.log("🔍 Analyzing feedback:", feedback);
    const result = await analyzerChain.invoke({
      feedback,
    });
    console.log("✅ Analysis complete:", result);
    return JSON.parse(result);
  } catch (error) {
    console.error("❌ Error analyzing feedback:", error);
    throw error;
  }
};