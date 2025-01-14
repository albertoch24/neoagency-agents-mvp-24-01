export const buildInstructionsSection = (requirements: string, previousOutputs: any[] = []) => {
  const previousOutputsText = previousOutputs.length > 0
    ? `
Previous Outputs:
${previousOutputs.map(output => 
  `From ${output.agent || 'Unknown Agent'}:
   ${typeof output.content === 'string' 
     ? output.content.substring(0, 200) + '...'
     : JSON.stringify(output.content).substring(0, 200) + '...'
   }`
).join('\n\n')}
`
    : '';

  return `
${requirements ? `Requirements:\n${requirements}\n` : ''}
${previousOutputsText}

Instructions:
1. Analyze the brief and requirements carefully
2. Consider any previous outputs when forming your response
3. Provide specific, actionable insights
4. Structure your response clearly
`;
};