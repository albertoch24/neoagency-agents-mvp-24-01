export const buildInstructionsSection = (requirements: string, previousOutputs: any[]): string => {
  const previousOutputsSection = previousOutputs.length > 0
    ? `\nPrevious outputs to consider:\n${previousOutputs.map(o => `- ${o}`).join('\n')}`
    : '';

  return `
INSTRUCTIONS:
${requirements || 'Provide a detailed response based on the context and any feedback provided.'}
${previousOutputsSection}

Remember to:
1. Follow all instructions carefully
2. Provide clear, structured responses
3. Address all requirements explicitly
`;
};