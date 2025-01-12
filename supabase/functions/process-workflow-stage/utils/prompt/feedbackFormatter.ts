interface FeedbackAnalysis {
  toRemove: string[];
  toModify: { original: string; updated: string }[];
  toAdd: string[];
}

export const formatFeedbackForPrompt = (feedback: string): string => {
  console.log("Formatting feedback:", feedback);

  const analyzeFeedback = (feedbackText: string): FeedbackAnalysis => {
    // Split feedback into separate instructions
    const instructions = feedbackText.split(/[.,;]\s+/);
    
    const analysis: FeedbackAnalysis = {
      toRemove: [],
      toModify: [],
      toAdd: []
    };

    instructions.forEach(instruction => {
      const lowerInstruction = instruction.toLowerCase();
      
      // Check for removal instructions
      if (lowerInstruction.includes('elimina') || 
          lowerInstruction.includes('rimuovi') || 
          lowerInstruction.includes('togli')) {
        const itemToRemove = instruction.replace(/^(elimina|rimuovi|togli)\s+/i, '').trim();
        if (itemToRemove) {
          analysis.toRemove.push(itemToRemove);
        }
      }
      
      // Check for modification instructions
      else if (lowerInstruction.includes('cambia') || 
               lowerInstruction.includes('modifica') || 
               lowerInstruction.includes('sostituisci')) {
        const modifyMatch = instruction.match(/(?:cambia|modifica|sostituisci)\s+(.+?)\s+(?:con|in)\s+(.+)/i);
        if (modifyMatch) {
          analysis.toModify.push({
            original: modifyMatch[1].trim(),
            updated: modifyMatch[2].trim()
          });
        }
      }
      
      // Check for addition instructions
      else if (lowerInstruction.includes('aggiungi') || 
               lowerInstruction.includes('inserisci') || 
               lowerInstruction.includes('includi')) {
        const itemToAdd = instruction.replace(/^(aggiungi|inserisci|includi)\s+/i, '').trim();
        if (itemToAdd) {
          analysis.toAdd.push(itemToAdd);
        }
      }
    });

    return analysis;
  };

  const analysis = analyzeFeedback(feedback);
  
  // Format the feedback into a structured prompt
  let promptParts = [
    "Please incorporate the following feedback into your analysis and recommendations:",
    ""
  ];

  if (analysis.toRemove.length > 0) {
    promptParts.push("CONTENT TO REMOVE:");
    analysis.toRemove.forEach(item => {
      promptParts.push(`- Remove all references to: ${item}`);
    });
    promptParts.push("");
  }

  if (analysis.toModify.length > 0) {
    promptParts.push("CONTENT TO MODIFY:");
    analysis.toModify.forEach(item => {
      promptParts.push(`- Replace "${item.original}" with "${item.updated}"`);
    });
    promptParts.push("");
  }

  if (analysis.toAdd.length > 0) {
    promptParts.push("CONTENT TO ADD:");
    analysis.toAdd.forEach(item => {
      promptParts.push(`- Add content about: ${item}`);
    });
    promptParts.push("");
  }

  promptParts.push("IMPORTANT GUIDELINES:");
  promptParts.push("1. Ensure ALL requested changes are fully implemented");
  promptParts.push("2. Maintain consistency with the brief's overall objectives");
  promptParts.push("3. Preserve the quality and depth of the analysis");
  promptParts.push("4. Keep the tone and style consistent");
  promptParts.push("");
  promptParts.push("Original feedback for reference:");
  promptParts.push(`"${feedback}"`);

  return promptParts.join("\n");
};