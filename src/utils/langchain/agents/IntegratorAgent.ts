import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const integratorPrompt = PromptTemplate.fromTemplate(`
Integra il feedback validato nel contesto:
{validatedFeedback}

Contesto corrente:
{currentContext}

Requisiti:
1. Mantieni la coerenza del contesto
2. Risolvi eventuali conflitti
3. Integra le modifiche richieste
4. Mantieni traccia delle modifiche

Output richiesto in formato JSON con contesto aggiornato e modifiche tracciate.
`);

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.5,
});

export const integratorChain = RunnableSequence.from([
  integratorPrompt,
  model,
  new StringOutputParser(),
]);

export const integrateFeedback = async (validatedFeedback: any, currentContext: string) => {
  try {
    console.log("🔄 Integrating feedback:", { validatedFeedback, currentContext });
    const result = await integratorChain.invoke({
      validatedFeedback: JSON.stringify(validatedFeedback),
      currentContext,
    });
    console.log("✅ Integration complete:", result);
    return JSON.parse(result);
  } catch (error) {
    console.error("❌ Error integrating feedback:", error);
    throw error;
  }
};