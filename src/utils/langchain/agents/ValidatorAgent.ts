import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const validatorPrompt = PromptTemplate.fromTemplate(`
Valida il seguente feedback analizzato:
{analyzedFeedback}

Contesto originale:
{originalContext}

Verifica:
1. Coerenza con il contesto originale
2. Fattibilità delle modifiche richieste
3. Potenziali conflitti o contraddizioni
4. Completezza delle informazioni

Output richiesto in formato JSON con validazione dettagliata.
`);

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.3,
});

export const validatorChain = RunnableSequence.from([
  validatorPrompt,
  model,
  new StringOutputParser(),
]);

export const validateFeedback = async (analyzedFeedback: any, originalContext: string) => {
  try {
    console.log("🔍 Validating feedback:", { analyzedFeedback, originalContext });
    const result = await validatorChain.invoke({
      analyzedFeedback: JSON.stringify(analyzedFeedback),
      originalContext,
    });
    console.log("✅ Validation complete:", result);
    return JSON.parse(result);
  } catch (error) {
    console.error("❌ Error validating feedback:", error);
    throw error;
  }
};