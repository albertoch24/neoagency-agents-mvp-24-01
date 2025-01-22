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

    // Estrai il contenuto da tutti gli output
    const outputs = content.outputs || [];
    const combinedContent = outputs
      .map((output: any) => output.outputs?.[0]?.content || '')
      .join(' ');

    console.log("Analyzing combined content:", {
      contentLength: combinedContent.length,
      outputsCount: outputs.length
    });

    // Verifica informazioni essenziali
    if (!combinedContent.includes('Target Audience')) {
      result.missingInfo.push('Detailed target audience information');
    }
    if (!combinedContent.toLowerCase().includes('budget')) {
      result.missingInfo.push('Budget information');
    }
    if (!combinedContent.includes('Timeline')) {
      result.missingInfo.push('Project timeline');
    }
    if (!combinedContent.toLowerCase().includes('ooh') && !combinedContent.toLowerCase().includes('out of home')) {
      result.unclearInfo.push('OOH placement strategy');
    }
    if (!combinedContent.toLowerCase().includes('kpi') && !combinedContent.toLowerCase().includes('metrics')) {
      result.unclearInfo.push('Success metrics and KPIs');
    }

    // Suggerimenti per miglioramenti
    if (!combinedContent.toLowerCase().includes('competitor')) {
      result.suggestions.push('Consider adding competitor analysis');
    }
    if (!combinedContent.toLowerCase().includes('measurement') && !combinedContent.toLowerCase().includes('tracking')) {
      result.suggestions.push('Include measurement and tracking strategy');
    }

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