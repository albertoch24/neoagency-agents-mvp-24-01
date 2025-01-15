import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { BufferWindowMemory } from "langchain/memory";

// Analyzer Chain
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

const analyzerChain = RunnableSequence.from([
  analyzerPrompt,
  model,
  new StringOutputParser(),
]);

// Validator Chain
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

const validatorChain = RunnableSequence.from([
  validatorPrompt,
  model,
  new StringOutputParser(),
]);

// Integrator Chain
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

const integratorChain = RunnableSequence.from([
  integratorPrompt,
  model,
  new StringOutputParser(),
]);

// Generator Chain
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

const generatorChain = RunnableSequence.from([
  generatorPrompt,
  model,
  new StringOutputParser(),
]);

export class FeedbackProcessor {
  private memory: BufferWindowMemory;

  constructor() {
    this.memory = new BufferWindowMemory({
      returnMessages: true,
      memoryKey: "chat_history",
      inputKey: "feedback",
      outputKey: "response",
      k: 5
    });
  }

  async processFeedback(feedback: string, originalContext: string) {
    try {
      console.log("🚀 Starting feedback processing");

      // Step 1: Analyze feedback
      const analyzedFeedback = await analyzerChain.invoke({
        feedback,
      });
      console.log("📊 Feedback analyzed:", analyzedFeedback);

      // Step 2: Validate feedback
      const validatedFeedback = await validatorChain.invoke({
        analyzedFeedback: analyzedFeedback,
        originalContext,
      });
      console.log("✅ Feedback validated:", validatedFeedback);

      // Step 3: Integrate feedback
      const integratedContext = await integratorChain.invoke({
        validatedFeedback: validatedFeedback,
        currentContext: originalContext,
      });
      console.log("🔄 Feedback integrated:", integratedContext);

      // Step 4: Generate new response
      const newResponse = await generatorChain.invoke({
        integratedContext: integratedContext,
      });
      console.log("📝 New response generated:", newResponse);

      // Store in memory
      await this.memory.saveContext(
        { feedback: feedback },
        { response: JSON.stringify(newResponse) }
      );

      return JSON.parse(newResponse);
    } catch (error) {
      console.error("❌ Error in feedback processing:", error);
      throw error;
    }
  }

  async getMemoryContents() {
    return await this.memory.loadMemoryVariables({});
  }
}