import { buildSystemInstructions } from "./systemInstructions";

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false,
  isReprocessing: boolean = false,
  feedback?: string
) => {
  console.log("BuildPrompt called with:", {
    agentName: agent.name,
    briefTitle: brief.title,
    previousOutputsCount: previousOutputs?.length,
    requirements: requirements?.substring(0, 100) + "...",
    isFirstStage,
    isReprocessing,
    hasFeedback: !!feedback
  });

  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  const outputRequirements = agent.flow_steps?.[0]?.outputs
    ?.map((output: any) => output.text)
    .filter(Boolean) || [];

  const reprocessingContext = isReprocessing && feedback ? `
    IMPORTANT - This is a reprocessing request based on the following feedback:
    ${feedback}
    
    Please address this feedback specifically in your new response and provide a different perspective or approach.
    Ensure your new response is substantially different from the previous one while still meeting the original requirements.
  ` : '';

  const sections = [
    reprocessingContext,
    buildBriefDetails(brief),
    buildPreviousOutputsSection(previousOutputs, isFirstStage),
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(outputRequirements),
    formattedRequirements
  ].filter(Boolean).join('\n\n');

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to ${isReprocessing ? 're-analyze' : 'analyze'} this creative brief with a ${isReprocessing ? 'fresh perspective' : 'thorough approach'}:

    1. CONVERSATIONAL ANALYSIS:
    First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
    - Your ${isReprocessing ? 'new' : 'initial'} impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    - References to previous discussions or outputs where relevant
    ${isReprocessing ? '- Address the specific feedback provided and explain your new approach' : ''}

    2. STRUCTURED OUTPUT:
    Then, provide a clear, structured analysis addressing each required output:
    ${outputRequirements.length > 0 
      ? outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')
      : '- Provide your expert analysis and recommendations'}

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

    Here is the context for your analysis:
    ${sections}
  `;

  console.log('Generated prompt:', {
    agentName: agent.name,
    briefTitle: brief.title,
    requirementsCount: outputRequirements.length,
    previousOutputsCount: previousOutputs.length,
    promptLength: conversationalPrompt.length,
    isReprocessing,
    sectionsIncluded: {
      hasReprocessingContext: !!reprocessingContext,
      hasBriefDetails: !!buildBriefDetails(brief),
      hasPreviousOutputs: !!buildPreviousOutputsSection(previousOutputs, isFirstStage),
      hasAgentSkills: !!buildAgentSkillsSection(agent),
      hasOutputRequirements: !!buildOutputRequirementsSection(outputRequirements),
      hasFormattedRequirements: !!formattedRequirements
    }
  });

  return { conversationalPrompt };
};

const buildBriefDetails = (brief: any) => {
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

const buildPreviousOutputsSection = (previousOutputs: any[], isFirstStage: boolean) => {
  console.log("Building previous outputs section:", {
    outputsCount: previousOutputs?.length,
    isFirstStage,
    outputTypes: previousOutputs?.map(o => o.output_type),
    hasContent: previousOutputs?.every(o => o.content),
    rawOutputs: previousOutputs?.map(o => ({
      type: o.output_type,
      contentType: typeof o.content,
      contentSample: typeof o.content === 'string' 
        ? o.content.substring(0, 100) 
        : 'non-string content'
    }))
  });

  if (!Array.isArray(previousOutputs) || previousOutputs.length === 0) {
    console.log("No valid previous outputs found");
    return '';
  }

  if (isFirstStage) {
    console.log("Skipping previous outputs - first stage");
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

  console.log("Processed previous outputs:", {
    hasOutputs: !!outputs,
    outputLength: outputs?.length,
    outputPreview: outputs?.substring(0, 100)
  });

  return outputs ? `\nPrevious Stage Outputs:\n${outputs}` : '';
};

const buildFlowStepOutputsSection = (flowStepOutputs?: { title: string; content: string }[]) => {
  console.log("Building flow step outputs:", {
    hasOutputs: !!flowStepOutputs?.length,
    outputCount: flowStepOutputs?.length
  });

  if (!flowStepOutputs?.length) return '';
  
  return `\nFlow Step Outputs:\n${flowStepOutputs.map(output => 
    `Title: ${output.title}\nContent: ${output.content}`
  ).join('\n\n')}`;
};

const buildAgentSkillsSection = (agent: any) => {
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

const buildOutputRequirementsSection = (outputRequirements: string[]) => {
  console.log("Building output requirements section:", {
    requirementsCount: outputRequirements.length,
    requirements: outputRequirements
  });

  return `
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
};
