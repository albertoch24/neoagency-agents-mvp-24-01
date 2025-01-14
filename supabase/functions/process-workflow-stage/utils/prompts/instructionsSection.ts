export const buildInstructionsSection = (requirements: string, previousOutputs: any[]) => {
  const previousOutputsSection = previousOutputs.length > 0
    ? `
PREVIOUS OUTPUTS TO CONSIDER:
${previousOutputs.map((output, index) => 
  `Output ${index + 1}:\n${typeof output === 'string' ? output : JSON.stringify(output, null, 2)}`
).join('\n\n')}`
    : '';

  return `
${requirements ? `SPECIFIC REQUIREMENTS:\n${requirements}\n` : ''}
${previousOutputsSection}

INSTRUCTIONS:
1. Analyze all provided information carefully
2. Provide detailed, actionable insights
3. Be specific and concrete in your recommendations
4. Support your points with clear reasoning
`;
};