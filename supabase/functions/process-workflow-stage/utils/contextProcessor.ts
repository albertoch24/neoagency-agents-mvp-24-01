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
  content: string | { response?: string; outputs?: Array<{ content: string }>};
  stepId: string;
  orderIndex?: number;
}

function extractContent(content: string | { response?: string; outputs?: Array<{ content: string }> }): string {
  if (typeof content === 'string') {
    return content;
  }

  if (content.response) {
    return content.response;
  }

  if (content.outputs && Array.isArray(content.outputs)) {
    return content.outputs.map(output => output.content).join('\n');
  }

  console.warn("⚠️ Could not extract content from output:", content);
  return '';
}

export function processRelevantContext(
  agentContext: AgentContext,
  previousOutputs: PreviousOutput[],
  requirements: string,
  isFirstStage: boolean = false
): string {
  // Special handling for first stage
  if (isFirstStage) {
    console.log("📝 Processing first stage context - using only brief information");
    return "This is the first stage. Focus on initial analysis and project setup based on the brief information provided.";
  }

  // For all other stages, keep existing context processing logic
  const requirementKeywords = requirements.toLowerCase().split(/\W+/);
  const skillKeywords = agentContext.skills
    .flatMap(skill => [
      ...(skill.name?.toLowerCase().split(/\W+/) || []),
      ...(skill.description?.toLowerCase().split(/\W+/) || [])
    ])
    .filter(Boolean);

  const relevantOutputs = previousOutputs
    .map(output => {
      const extractedContent = extractContent(output.content).toLowerCase();
      const relevanceScore = [...requirementKeywords, ...skillKeywords]
        .filter(keyword => extractedContent.includes(keyword))
        .length;

      return {
        ...output,
        relevanceScore,
        extractedContent
      };
    })
    .filter(output => output.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const summary = relevantOutputs
    .map(output => {
      const sentences = output.extractedContent
        .split(/[.!?]+/)
        .filter(sentence => 
          requirementKeywords.some(keyword => 
            sentence.includes(keyword)
          ) ||
          skillKeywords.some(keyword => 
            sentence.includes(keyword)
          )
        )
        .slice(0, 3);

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
  // For first stage, include all brief information
  if (isFirstStage) {
    console.log("📄 Including complete brief information for first stage");
    const allFields = [
      'title',
      'brand',
      'description',
      'objectives',
      'target_audience',
      'budget',
      'timeline',
      'website'
    ];

    return allFields
      .filter(field => brief[field])
      .map(field => `${field}: ${brief[field]}`)
      .join('\n');
  }

  // For other stages, keep existing selective filtering
  const relevantFields = ['title', 'brand'];
  const conditionalFields = ['budget', 'timeline', 'target_audience', 'objectives', 'description'];
  
  let relevantInfo = relevantFields
    .map(field => `${field}: ${brief[field] || 'Not specified'}`)
    .join('\n');

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