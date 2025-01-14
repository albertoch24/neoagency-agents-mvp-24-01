import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export const createLangChainModel = (temperature = 0.7) => {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key is not configured');
  }

  return new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4o-mini",
    temperature,
  });
};

export const createPromptTemplate = (template: string) => {
  return PromptTemplate.fromTemplate(template);
};

export const createChain = (
  promptTemplate: PromptTemplate,
  model: ChatOpenAI,
  outputParser = new StringOutputParser()
) => {
  return RunnableSequence.from([
    promptTemplate,
    model,
    outputParser,
  ]);
};

export const handleLangChainError = (error: any) => {
  console.error("LangChain processing error:", {
    message: error.message,
    name: error.name,
    cause: error.cause,
    stack: error.stack,
  });
  
  return {
    error: true,
    message: error.message,
    details: error.toString(),
  };
};