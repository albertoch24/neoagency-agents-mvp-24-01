import { Agent } from '../types';

export const buildBasePrompt = (agent: Agent | undefined, brief: any, isFirstStage: boolean = true) => {
  if (!agent) {
    console.error('Agent is undefined in buildBasePrompt');
    return ''; 
  }

  // Se esiste un prompt_template personalizzato, usalo
  if (agent.prompt_template) {
    console.log('Using custom prompt template for agent:', agent.name);
    return agent.prompt_template;
  }

  // Altrimenti usa il prompt di default
  console.log('Using default prompt template for agent:', agent.name);
  return `You are ${agent.name}, an AI agent specialized in ${agent.description || 'your field'}. 
  
Your task is to:
1. Analyze the provided information thoroughly
2. Generate insights and recommendations
3. Provide clear, actionable outputs

Please structure your response with:
- Executive Summary
- Detailed Analysis
- Strategic Recommendations
- Implementation Plan
- Risk Assessment
- Success Metrics
- Next Steps

Base your response on:
- The project brief
- Previous agent outputs
- Your specific expertise
- Best practices in your field

Be specific, practical, and results-oriented in your recommendations.`;
};