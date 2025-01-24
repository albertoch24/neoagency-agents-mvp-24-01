interface AgentContext {
  role: string;
  skills: Array<{
    name: string;
    description?: string;
    content?: string;
  }>;
  requirements: string;
}

interface PreviousOutput {
  agent: string;
  content: string;
  stepId: string;
  orderIndex?: number;
}

export function processRelevantContext(
  agentContext: AgentContext,
  previousOutputs: PreviousOutput[],
  requirements: string,
  isFirstStage: boolean = false
): string {
  // Se è il primo stage, non processiamo gli output precedenti
  if (isFirstStage) {
    return 'Initial stage - No previous context available';
  }

  // Extract keywords from requirements and agent skills
  const requirementKeywords = requirements.toLowerCase().split(/\W+/);
  const skillKeywords = agentContext.skills
    .flatMap(skill => [
      ...(skill.name?.toLowerCase().split(/\W+/) || []),
      ...(skill.description?.toLowerCase().split(/\W+/) || [])
    ])
    .filter(Boolean);

  // Filter and process previous outputs
  const relevantOutputs = previousOutputs
    .map(output => {
      const content = output.content.toLowerCase();
      const relevanceScore = [...requirementKeywords, ...skillKeywords]
        .filter(keyword => content.includes(keyword))
        .length;

      return {
        ...output,
        relevanceScore
      };
    })
    .filter(output => output.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Create a condensed summary
  const summary = relevantOutputs
    .map(output => {
      const sentences = output.content
        .split(/[.!?]+/)
        .filter(sentence => 
          requirementKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword)
          ) ||
          skillKeywords.some(keyword => 
            sentence.toLowerCase().includes(keyword)
          )
        )
        .slice(0, 3); // Take up to 3 most relevant sentences

      return `${output.agent}'s relevant insights:\n${sentences.join('. ')}`;
    })
    .join('\n\n');

  return summary || 'No directly relevant previous context found.';
}

export function filterRelevantBriefInfo(
  brief: any,
  agentContext: AgentContext,
  isFirstStage: boolean = false
): string {
  // Per il primo stage, includiamo tutte le informazioni del brief
  if (isFirstStage) {
    const allFields = [
      'title',
      'brand',
      'description',
      'objectives',
      'target_audience',
      'budget',
      'timeline',
      'website',
      'language'
    ];

    return allFields
      .filter(field => brief[field])
      .map(field => `${field}: ${brief[field]}`)
      .join('\n');
  }

  // Check other fields for relevance based on agent skills and requirements
  const relevantFields = ['title', 'brand'];
  const conditionalFields = ['budget', 'timeline', 'target_audience', 'objectives', 'description'];
  
  // Always include basic fields
  let relevantInfo = relevantFields
    .map(field => `${field}: ${brief[field] || 'Not specified'}`)
    .join('\n');

  // Check other fields for relevance based on agent skills and requirements
  const keywords = [
    ...agentContext.skills.flatMap(skill => skill.name.toLowerCase().split(/\W+/)),
    ...agentContext.requirements.toLowerCase().split(/\W+/)
  ];

  const relevantConditionalFields = conditionalFields.filter(field =>
    keywords.some(keyword =>
      brief[field]?.toLowerCase().includes(keyword)
    )
  );

  if (relevantConditionalFields.length > 0) {
    relevantInfo += '\n' + relevantConditionalFields
      .map(field => `${field}: ${brief[field] || 'Not specified'}`)
      .join('\n');
  }

  return relevantInfo;
}
