export const buildOutputRequirements = (agent: any) => {
  let outputRequirements: string[] = [];
  
  if (agent.skills?.length > 0) {
    outputRequirements = agent.skills.map((skill: any) => skill.content).filter(Boolean);
  } else if (agent.flow_steps?.[0]?.outputs) {
    outputRequirements = agent.flow_steps[0].outputs
      .map((output: any) => output.text)
      .filter(Boolean);
  }

  console.log("Output requirements prepared:", {
    requirementsCount: outputRequirements.length,
    requirements: outputRequirements
  });

  return outputRequirements;
};

export const formatRequirements = (outputRequirements: string[]) => `
Please provide a structured analysis that specifically addresses each of these required outputs:
${outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')}

Format your response with clear headings and bullet points for each required output.
Ensure each response is:
1. Concrete and actionable, directly addressing the specific output requirements.
2. Based on insights from the brief and outputs of previous steps or stages, with clear references to how they influence your recommendations.
3. Structured, using concise bullet points or subheadings to organize information logically.
4. Thorough and exhaustive, covering all relevant aspects to provide a complete response.
5. Professional and direct in tone, avoiding unnecessary elaboration or discussion of the process or future steps.
6. Focused solely on the outputs, ensuring practical and useful recommendations for each point.

When referencing previous outputs or flow step outputs:
- Explicitly indicate their relevance and how they inform your recommendations.
- Tie your answers back to the brief's goals to ensure alignment.
`;