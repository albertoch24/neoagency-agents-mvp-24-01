import { PromptSection } from './types';
import { buildBriefDetails } from './sections/briefSection';
import { buildAgentSkills } from './sections/agentSkills';
import { buildPreviousOutputs } from './sections/previousOutputs';
import { buildOutputRequirements } from './sections/outputRequirements';
import { buildContextFromDocs } from './ragUtils';

export const buildPrompt = (
  agent: any,
  brief: any,
  previousOutputs: any[] = [],
  requirements: string = '',
  isFirstStage: boolean = false,
  relevantDocs: any[] = []
) => {
  const sections: PromptSection[] = [
    buildBriefDetails(brief),
    buildAgentSkills(agent),
  ];

  // Add document context if available
  const documentContext = buildContextFromDocs(relevantDocs);
  if (documentContext) {
    sections.push({
      title: "Brand Context",
      content: documentContext
    });
  }

  if (previousOutputs.length > 0) {
    sections.push(buildPreviousOutputs(previousOutputs));
  }

  if (requirements) {
    sections.push(buildOutputRequirements(requirements));
  }

  const conversationalPrompt = sections
    .map(section => `${section.title}:\n${section.content}`)
    .join('\n\n');

  return {
    conversationalPrompt,
    sections
  };
};