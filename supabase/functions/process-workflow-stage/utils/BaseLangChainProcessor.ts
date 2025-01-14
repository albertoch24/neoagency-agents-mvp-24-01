import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { createLangChainModel, createPromptTemplate, createChain, handleLangChainError } from "./langchainConfig.ts";

export class BaseLangChainProcessor {
  protected model: ChatOpenAI;
  protected chain: any;
  protected context: Record<string, any>;

  constructor(temperature = 0.7) {
    this.model = createLangChainModel(temperature);
    this.context = {};
  }

  protected async initialize(promptTemplate: string) {
    try {
      const template = createPromptTemplate(promptTemplate);
      this.chain = createChain(template, this.model);
    } catch (error) {
      console.error("Error initializing LangChain processor:", error);
      throw error;
    }
  }

  protected async process(input: Record<string, any>) {
    try {
      if (!this.chain) {
        throw new Error("Chain not initialized");
      }

      console.log("Processing input:", input);
      const result = await this.chain.invoke(input);
      console.log("Processing result:", result);

      return {
        success: true,
        result,
      };
    } catch (error) {
      return handleLangChainError(error);
    }
  }

  protected setContext(context: Record<string, any>) {
    this.context = {
      ...this.context,
      ...context,
    };
  }

  protected getContext() {
    return this.context;
  }
}