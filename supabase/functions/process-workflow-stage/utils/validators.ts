interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export async function validateFeedbackIncorporation(
  originalOutput: string,
  newOutput: string,
  feedback: string
): Promise<ValidationResult> {
  // Ensure outputs are different
  if (originalOutput === newOutput) {
    return {
      isValid: false,
      reason: 'New output is identical to original output'
    };
  }

  // Extract feedback points
  const feedbackPoints = feedback.split('\n')
    .map(point => point.trim())
    .filter(point => point.length > 0);

  // Check if each feedback point is addressed
  for (const point of feedbackPoints) {
    // Simple check if the new output contains discussion of the feedback point
    // This could be made more sophisticated with NLP/semantic analysis
    if (!newOutput.toLowerCase().includes(point.toLowerCase())) {
      return {
        isValid: false,
        reason: `Feedback point not addressed: ${point}`
      };
    }
  }

  // Calculate similarity score (basic implementation)
  const similarity = calculateSimilarity(originalOutput, newOutput);
  if (similarity > 0.8) { // If outputs are more than 80% similar
    return {
      isValid: false,
      reason: 'New output is too similar to original output'
    };
  }

  return { isValid: true };
}

function calculateSimilarity(text1: string, text2: string): number {
  // Simple implementation - could be enhanced with more sophisticated algorithms
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}