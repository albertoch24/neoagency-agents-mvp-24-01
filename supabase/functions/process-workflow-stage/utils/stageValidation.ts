interface ValidationResult {
  isValid: boolean;
  missingInfo: string[];
  unclearInfo: string[];
  suggestions: string[];
}

export const validateFirstStageData = (content: any): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    missingInfo: [],
    unclearInfo: [],
    suggestions: []
  };

  try {
    // Extract outputs from content
    const outputs = content?.outputs || [];
    const combinedContent = outputs
      .map((output: any) => output.outputs?.[0]?.content || '')
      .join(' ');

    // Check for essential information
    if (!combinedContent.includes('Target Audience')) {
      result.missingInfo.push('Detailed target audience demographics');
    }
    if (!combinedContent.toLowerCase().includes('budget')) {
      result.missingInfo.push('Budget information');
    }
    if (!combinedContent.includes('Timeline')) {
      result.missingInfo.push('Project timeline');
    }

    // Check for unclear information
    if (!combinedContent.includes('OOH') && !combinedContent.includes('Out of Home')) {
      result.unclearInfo.push('Specific OOH placement strategy');
    }
    if (!combinedContent.includes('KPI') && !combinedContent.includes('metrics')) {
      result.unclearInfo.push('Success metrics and KPIs');
    }

    // Add suggestions for improvement
    if (!combinedContent.includes('competitor')) {
      result.suggestions.push('Consider adding competitor analysis');
    }
    if (!combinedContent.includes('measurement') && !combinedContent.includes('tracking')) {
      result.suggestions.push('Include measurement and tracking strategy');
    }

    result.isValid = result.missingInfo.length === 0;

    console.log('Stage validation results:', {
      isValid: result.isValid,
      missingInfoCount: result.missingInfo.length,
      unclearInfoCount: result.unclearInfo.length,
      suggestionsCount: result.suggestions.length,
      timestamp: new Date().toISOString()
    });

    return result;
  } catch (error) {
    console.error('Error validating first stage data:', error);
    throw error;
  }
};

export const validateStageRequirements = (requirements: string): string[] => {
  const missingRequirements = [];
  
  if (!requirements) {
    return ['No requirements specified'];
  }

  const requiredSections = [
    'Project objectives',
    'Target audience',
    'Timeline',
    'Deliverables'
  ];

  for (const section of requiredSections) {
    if (!requirements.includes(section)) {
      missingRequirements.push(`Missing ${section} section`);
    }
  }

  return missingRequirements;
};