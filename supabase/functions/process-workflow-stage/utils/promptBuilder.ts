import { RAGResponse, PromptSection } from "./types.ts";
import { buildBriefDetails } from "./sections/briefSection.ts";
import { buildPreviousOutputsSection } from "./sections/previousOutputs.ts";
import { buildAgentSkillsSection } from "./sections/agentSkills.ts";
import { buildOutputRequirementsSection } from "./sections/outputRequirements.ts";

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[],
  requirements?: string,
  isFirstStage: boolean = false,
  relevantDocs?: RAGResponse['relevantDocs']
) => {
  console.log("BuildPrompt called with:", {
    agentName: agent.name,
    briefTitle: brief.title,
    previousOutputsCount: previousOutputs?.length,
    requirements: requirements?.substring(0, 100) + "...",
    isFirstStage,
    hasRelevantDocs: !!relevantDocs?.length
  });

  const formattedRequirements = requirements 
    ? `\nSpecific Requirements for this Step:\n${requirements}`
    : '';

  const outputRequirements = agent.flow_steps?.[0]?.outputs
    ?.map((output: any) => output.text)
    .filter(Boolean) || [];

  // Format relevant documents in a more natural way
  const documentContext = relevantDocs?.length 
    ? `Based on the available research and documentation:

${relevantDocs.map(doc => doc.pageContent).join('\n\n')}

Please incorporate these insights naturally into your analysis, referencing them as if they were part of your knowledge base rather than direct quotes.`
    : '';

  const sections: PromptSection[] = [
    buildBriefDetails(brief),
    { title: "Document Context", content: documentContext },
    buildPreviousOutputsSection(previousOutputs, isFirstStage),
    buildAgentSkillsSection(agent),
    buildOutputRequirementsSection(outputRequirements),
    { title: "Additional Requirements", content: formattedRequirements }
  ].filter(section => section.content);

  const conversationalPrompt = `
    As ${agent.name}, I'd like you to analyze this creative brief while incorporating the provided research and documentation naturally into your response. Think of this as a collaborative discussion where you:

    1. CONVERSATIONAL ANALYSIS:
    Share your thoughts in a natural, conversational way that weaves in relevant insights from the documentation. Use first-person perspective and:
    - Discuss your initial impressions and insights, referencing relevant research naturally
    - Explain how your expertise applies to this brief
    - Point out opportunities or concerns, supported by available documentation
    - Build upon previous discussions and research findings organically

    2. STRUCTURED OUTPUT:
    Then, provide a clear, structured analysis that incorporates all available information:
    ${outputRequirements.length > 0 
      ? outputRequirements.map((req: string, index: number) => `${index + 1}. ${req}`).join('\n')
      : '- Provide your expert analysis and recommendations'}

    Important Guidelines:
    - Incorporate research findings naturally, as if they were part of your own knowledge
    - Avoid direct quotes - rephrase and integrate information organically
    - Connect insights from documentation to your practical experience
    - Maintain a conversational, expert tone throughout
    - Ensure recommendations are actionable and grounded in both expertise and research

    Here is the context for your analysis:
    ${sections.map(section => `${section.title}:\n${section.content}`).join('\n\n')}
  `;

  console.log('Generated prompt:', {
    agentName: agent.name,
    briefTitle: brief.title,
    requirementsCount: outputRequirements.length,
    previousOutputsCount: previousOutputs.length,
    promptLength: conversationalPrompt.length,
    hasDocumentContext: !!documentContext,
    sectionsIncluded: sections.map(s => s.title)
  });

  return { conversationalPrompt };
};