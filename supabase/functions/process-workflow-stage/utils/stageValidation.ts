interface ValidationResult {
  isValid: boolean;
  missingInfo: string[];
  unclearInfo: string[];
  suggestions: string[];
}

export const validateFirstStageData = (content: any): ValidationResult => {
  console.log("Validating first stage data:", {
    hasContent: !!content,
    contentType: typeof content,
    timestamp: new Date().toISOString()
  });

  const result: ValidationResult = {
    isValid: true,
    missingInfo: [],
    unclearInfo: [],
    suggestions: []
  };

  try {
    if (!content?.outputs?.length) {
      console.error("No outputs found in content");
      result.isValid = false;
      result.missingInfo.push("No outputs found");
      return result;
    }

    // Extract content from all outputs
    const outputs = content.outputs || [];
    const combinedContent = outputs
      .map((output: any) => output.outputs?.[0]?.content || '')
      .join(' ');

    console.log("Analyzing combined content:", {
      contentLength: combinedContent.length,
      outputsCount: outputs.length
    });

    // Check for essential information
    const essentialFields = [
      { field: 'Target Audience', message: 'Detailed target audience information' },
      { field: 'budget', message: 'Budget information' },
      { field: 'Timeline', message: 'Project timeline' }
    ];

    essentialFields.forEach(({ field, message }) => {
      if (!combinedContent.toLowerCase().includes(field.toLowerCase())) {
        result.missingInfo.push(message);
      }
    });

    // Check for strategy details
    const strategyFields = [
      { terms: ['strategy', 'approach'], message: 'Clear strategy definition' },
      { terms: ['kpi', 'metrics', 'measurement'], message: 'Success metrics and KPIs' }
    ];

    strategyFields.forEach(({ terms, message }) => {
      if (!terms.some(term => combinedContent.toLowerCase().includes(term))) {
        result.unclearInfo.push(message);
      }
    });

    // Suggestions for improvement
    const improvementChecks = [
      { terms: ['competitor', 'market'], suggestion: 'Consider adding market/competitor analysis' },
      { terms: ['risk', 'mitigation'], suggestion: 'Include risk assessment and mitigation strategies' },
      { terms: ['milestone', 'deliverable'], suggestion: 'Add specific milestones and deliverables' }
    ];

    improvementChecks.forEach(({ terms, suggestion }) => {
      if (!terms.some(term => combinedContent.toLowerCase().includes(term))) {
        result.suggestions.push(suggestion);
      }
    });

    result.isValid = result.missingInfo.length === 0;

    console.log("Validation results:", {
      isValid: result.isValid,
      missingInfoCount: result.missingInfo.length,
      unclearInfoCount: result.unclearInfo.length,
      suggestionsCount: result.suggestions.length,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error("Error in validateFirstStageData:", error);
    result.isValid = false;
    result.missingInfo.push('Error processing stage data');
    return result;
  }
};