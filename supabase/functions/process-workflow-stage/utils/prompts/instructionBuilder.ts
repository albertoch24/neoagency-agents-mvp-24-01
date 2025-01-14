export const buildInstructions = (isReprocessing: boolean, feedback?: string) => {
  const conversationalInstructions = `
1. CONVERSATIONAL ANALYSIS:
First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
- Your ${isReprocessing ? 'new' : 'initial'} impressions and insights
- How your specific expertise applies to this brief
- Any concerns or opportunities you see
- References to previous discussions or outputs where relevant
${isReprocessing ? '- Explicit explanation of how you\'re addressing the feedback' : ''}
${isReprocessing ? '- Clear indication of what you\'re changing based on the feedback' : ''}
`;

  const structuredInstructions = `
2. STRUCTURED OUTPUT:
Then, provide a clear, structured analysis addressing each required output.

Format your response with:
### Conversational Response
[Your natural, dialogue-style analysis]

### Structured Outputs
[Your point-by-point structured responses]

Remember to:
- Maintain your unique voice and personality throughout
- Reference specific parts of the brief and previous outputs
- Ensure each structured output is concrete and actionable
- Keep the conversational part engaging and insightful
- Connect your structured outputs to your conversational analysis
${isReprocessing ? '- Provide substantially different insights and approaches from your previous response' : ''}
${isReprocessing ? '- Clearly explain how your new response addresses the feedback' : ''}
`;

  return conversationalInstructions + structuredInstructions;
};