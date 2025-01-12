import { PromptSection } from "../types";

export function buildAgentSkillsSection(agent: any): PromptSection {
  console.log("Building agent skills section:", {
    agentName: agent.name,
    hasDescription: !!agent.description,
    skillsCount: agent.skills?.length
  });

  return {
    title: "Agent Skills",
    content: `
Your Role and Background:
${agent.description}

Skills Applied:
${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
`
  };
}