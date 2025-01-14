import { analyzeFeedback } from "./agents/AnalyzerAgent";
import { validateFeedback } from "./agents/ValidatorAgent";
import { integrateFeedback } from "./agents/IntegratorAgent";
import { generateResponse } from "./agents/GeneratorAgent";
import { BufferWindowMemory } from "langchain/memory";

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
      const analyzedFeedback = await analyzeFeedback(feedback);
      console.log("📊 Feedback analyzed:", analyzedFeedback);

      // Step 2: Validate feedback
      const validatedFeedback = await validateFeedback(analyzedFeedback, originalContext);
      console.log("✅ Feedback validated:", validatedFeedback);

      // Step 3: Integrate feedback
      const integratedContext = await integrateFeedback(validatedFeedback, originalContext);
      console.log("🔄 Feedback integrated:", integratedContext);

      // Step 4: Generate new response
      const newResponse = await generateResponse(integratedContext);
      console.log("📝 New response generated:", newResponse);

      // Store in memory
      await this.memory.saveContext(
        { feedback: feedback },
        { response: JSON.stringify(newResponse) }
      );

      return newResponse;
    } catch (error) {
      console.error("❌ Error in feedback processing:", error);
      throw error;
    }
  }

  async getMemoryContents() {
    return await this.memory.loadMemoryVariables({});
  }
}