import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false
) => {
  console.log("BuildPrompt called with:", {
    agentName: agent.name,
    briefTitle: brief.title,
    previousOutputsCount: previousOutputs?.length,
    requirements: requirements?.substring(0, 100) + "...",
    isFirstStage,
    hasFeedback: requirements?.includes("Previous feedback received:")
  });

  // Extract and format feedback if present
  const [baseRequirements, feedbackSection] = requirements?.split("Previous feedback received:") || [requirements, ''];
  
  console.log("Processing requirements:", {
    hasBaseRequirements: !!baseRequirements,
    hasFeedbackSection: !!feedbackSection,
    feedbackPreview: feedbackSection?.substring(0, 100)
  });

  const formattedRequirements = `
${baseRequirements || ''}

${feedbackSection ? `
Important Feedback to Address:
${feedbackSection}

Please ensure your response specifically addresses:
1. The feedback provided above
2. Any requested changes to target audience, objectives, or other aspects
3. How your new response improves upon the previous version
` : ''}`;

  const outputRequirements = agent.flow_steps?.[0]?.outputs
    ?.map((output: any) => output.text)
    .filter(Boolean) || [];

  console.log("Output requirements prepared:", {
    requirementsCount: outputRequirements.length,
    requirements: outputRequirements
  });

  // For kickoff stage, skip previous outputs but maintain other sections
  const sections = [
    buildBriefDetails(brief),
    !isFirstStage ? buildPreviousOutputsSection(previousOutputs, isFirstStage) : '',
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(outputRequirements),
    formattedRequirements
  ].filter(Boolean).join('\n\n');

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to analyze this creative brief${feedbackSection ? ' with special attention to the provided feedback' : ''}:

    1. CONVERSATIONAL ANALYSIS:
    First, provide your thoughts in a natural, conversational way. Use first-person perspective, share your expertise, and explain your reasoning as if you're speaking in a meeting. Include:
    - Your initial impressions and insights
    - How your specific expertise applies to this brief
    - Any concerns or opportunities you see
    ${feedbackSection ? '- How you are addressing the specific feedback provided' : ''}
    ${!isFirstStage ? '- References to previous discussions or outputs where relevant' : ''}

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
    ${!isFirstStage ? '- Reference specific parts of the brief and previous outputs' : '- Focus on setting the right foundation for the project'}
    - Ensure each structured output is concrete and actionable
    - Keep the conversational part engaging and insightful
    - Connect your structured outputs to your conversational analysis
    ${feedbackSection ? '- Explicitly address how you\'ve incorporated the feedback' : ''}

    Here is the context for your analysis:
    ${sections}
  `;

  console.log('Generated prompt:', {
    agentName: agent.name,
    briefTitle: brief.title,
    requirementsCount: outputRequirements.length,
    previousOutputsCount: previousOutputs.length,
    promptLength: conversationalPrompt.length,
    sectionsIncluded: {
      hasBriefDetails: !!buildBriefDetails(brief),
      hasPreviousOutputs: !isFirstStage && !!buildPreviousOutputsSection(previousOutputs, isFirstStage),
      hasAgentSkills: !!buildAgentSkillsSection(agent),
      hasOutputRequirements: !!buildOutputRequirementsSection(outputRequirements),
      hasFormattedRequirements: !!formattedRequirements,
      hasFeedbackSection: !!feedbackSection
    }
  });

  return { conversationalPrompt };
};

const buildSystemInstructions = () => `
  1. Provide specific, actionable responses directly addressing each required output.
  2. Base your answers on insights derived from the brief and outputs of previous steps or stages.
  3. Avoid discussing the process or future steps—focus solely on meeting the requirements outlined.
  4. Use first-person pronouns ("I think...", "In my experience...").
  5. Include verbal fillers and transitions natural to spoken language.
  6. Express enthusiasm and emotion where appropriate.
  7. Reference team dynamics and collaborative aspects when relevant.
  8. Use industry jargon naturally but explain complex concepts where necessary.
  9. Share personal insights and experiences where they enhance the response.
  10. Ensure that every response is practical and actionable, tying back to the goals of the brief and previous outputs.
`;

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
