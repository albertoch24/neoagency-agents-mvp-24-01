import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const generatorPrompt = PromptTemplate.fromTemplate(`
Genera una nuova risposta basata sul contesto integrato:
{integratedContext}

Requisiti:
1. Incorpora tutti i punti di feedback
2. Mantieni lo stile e il tono appropriati
3. Verifica la completezza della risposta
4. Evidenzia le modifiche apportate

La risposta deve essere dettagliata e strutturata.
`);

const model = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.7,
});

export const generatorChain = RunnableSequence.from([
  generatorPrompt,
  model,
  new StringOutputParser(),
]);

export const generateResponse = async (integratedContext: any) => {
  try {
    console.log("📝 Generating response:", integratedContext);
    const result = await generatorChain.invoke({
      integratedContext: JSON.stringify(integratedContext),
    });
    console.log("✅ Generation complete:", result);
    return JSON.parse(result);
  } catch (error) {
    console.error("❌ Error generating response:", error);
    throw error;
  }
};