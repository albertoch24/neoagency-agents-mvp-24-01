import { PromptSection } from "../types";

export function buildPreviousOutputsSection(previousOutputs: any[], isFirstStage: boolean): PromptSection {
  console.log("Building previous outputs section:", {
    outputsCount: previousOutputs?.length,
    isFirstStage,
    outputTypes: previousOutputs?.map(o => o.output_type)
  });

  if (!Array.isArray(previousOutputs) || previousOutputs.length === 0 || isFirstStage) {
    return { title: "Previous Outputs", content: "" };
  }

  const outputs = previousOutputs
    .filter((output: any) => {
      const hasValidContent = output?.content && 
        (typeof output.content === 'string' || typeof output.content === 'object');
      
      console.log("Validating output:", {
        hasContent: !!output?.content,
        contentType: typeof output?.content,
        isValid: hasValidContent
      });
      
      return hasValidContent;
    })
    .map((output: any) => {
      let content = output.content;
      if (typeof content === 'object') {
        try {
          content = JSON.stringify(content, null, 2);
        } catch (e) {
          console.error("Error stringifying content:", e);
          return null;
        }
      }
      
      return `
      Stage: ${output.stage || 'Unknown Stage'}
      Content: ${content}
      `;
    })
    .filter(Boolean)
    .join('\n\n');

  return {
    title: "Previous Stage Outputs",
    content: outputs
  };
}