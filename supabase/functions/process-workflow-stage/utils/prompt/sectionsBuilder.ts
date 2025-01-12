export const buildBriefDetails = (brief: any) => {
  console.log("Building brief details for:", {
    briefTitle: brief.title,
    hasDescription: !!brief.description,
    hasObjectives: !!brief.objectives
  });
  
  return `
Brief Details:
Title: ${brief.title}
Description: ${brief.description}
Objectives: ${brief.objectives}
`;
};

export const buildPreviousOutputsSection = (previousOutputs: any[], isFirstStage: boolean) => {
  console.log("Building previous outputs section:", {
    outputsCount: previousOutputs?.length,
    isFirstStage,
    outputTypes: previousOutputs?.map(o => o.output_type),
    hasContent: previousOutputs?.every(o => o.content)
  });

  if (!Array.isArray(previousOutputs) || previousOutputs.length === 0 || isFirstStage) {
    return '';
  }
  
  const outputs = previousOutputs
    .filter((output: any) => {
      const hasValidContent = output?.content && 
        (typeof output.content === 'string' || typeof output.content === 'object');
      
      console.log("Validating output:", {
        hasContent: !!output?.content,
        contentType: typeof output?.content,
        isValid: hasValidContent
      });
      
      return hasValidContent;
    })
    .map((output: any) => {
      let content = output.content;
      if (typeof content === 'object') {
        try {
          content = JSON.stringify(content, null, 2);
        } catch (e) {
          console.error("Error stringifying content:", e);
          return null;
        }
      }
      
      return `
      Stage: ${output.stage || 'Unknown Stage'}
      Content: ${content}
      `;
    })
    .filter(Boolean)
    .join('\n\n');

  return outputs ? `\nPrevious Stage Outputs:\n${outputs}` : '';
};

export const buildAgentSkillsSection = (agent: any) => {
  console.log("Building agent skills section:", {
    agentName: agent.name,
    hasDescription: !!agent.description,
    skillsCount: agent.skills?.length
  });

  return `
Your Role and Background:
${agent.description}

Skills Applied:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
`;
};