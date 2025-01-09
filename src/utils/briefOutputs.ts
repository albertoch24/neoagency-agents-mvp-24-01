import { toast } from "sonner";

export const transformContent = (content: any) => {
  console.warn("🔍 Content Transformation Check:");
  console.warn("- Input type:", typeof content);
  console.warn("- Input structure:", content);
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      console.warn("- Parsed string content successfully");
      return { response: parsed };
    } catch {
      console.warn("- Failed to parse string content");
      toast.warning("Content parsing issue", {
        description: "String content could not be parsed as JSON"
      });
      return { response: content };
    }
  }
  
  if (typeof content === 'object' && content !== null) {
    console.warn("- Processing object content");
    if ('response' in content) {
      return content;
    }
    if ('outputs' in content) {
      const transformed = {
        ...content,
        response: content.outputs?.map((o: any) => o.content).join('\n')
      };
      console.warn("- Transformed outputs to response");
      return transformed;
    }
    console.warn("- Fallback: Converting object to string");
    return { response: JSON.stringify(content) };
  }
  
  console.warn("- Fallback: Converting to string");
  return { response: String(content) };
};