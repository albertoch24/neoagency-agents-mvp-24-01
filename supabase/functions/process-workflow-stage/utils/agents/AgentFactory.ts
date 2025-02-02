import { SpecializedAgent } from "./SpecializedAgent.ts";

export class AgentFactory {
  static createBriefAnalyzer(): SpecializedAgent {
    return new SpecializedAgent(
      "Brief Analyzer",
      ["requirement analysis", "project scoping", "objective identification"],
      0.3 // Lower temperature for more precise analysis
    );
  }

  static createCreativeDirector(): SpecializedAgent {
    return new SpecializedAgent(
      "Creative Director",
      ["creative strategy", "brand voice", "content direction"],
      0.7 // Higher temperature for creative thinking
    );
  }

  static createContentSpecialist(): SpecializedAgent {
    return new SpecializedAgent(
      "Content Specialist",
      ["content creation", "tone adaptation", "message refinement"],
      0.5 // Balanced temperature
    );
  }
}