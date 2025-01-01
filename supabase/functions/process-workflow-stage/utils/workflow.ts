import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateAgentResponse } from "./openai.ts";

export async function processAgent(
  supabase: any,
  agent: any,
  brief: any,
  stageId: string,
  requirements?: string
) {
  console.log("Starting agent processing with full context:", {
    brief: {
      id: brief.id,
      title: brief.title,
      description: brief.description,
      objectives: brief.objectives,
      status: brief.status,
      current_stage: brief.current_stage
    },
    stage: {
      id: stageId
    },
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      skillCount: agent.skills?.length || 0
    }
  });

  try {
    // Validate all required data exists
    if (!brief.id || !stageId || !agent.id) {
      const missingData = [];
      if (!brief.id) missingData.push('briefId');
      if (!stageId) missingData.push('stageId');
      if (!agent.id) missingData.push('agentId');
      
      console.error("Missing required data:", missingData);
      throw new Error(`Missing required data: ${missingData.join(', ')}`);
    }

    // Log agent skills
    if (agent.skills && agent.skills.length > 0) {
      console.log("Processing agent skills:", agent.skills.map((skill: any) => ({
        skillId: skill.id,
        name: skill.name,
        type: skill.type,
        hasContent: !!skill.content
      })));
    } else {
      console.warn("Agent has no skills:", {
        agentId: agent.id,
        agentName: agent.name
      });
    }

    // Construct conversational prompt
    const conversationalPrompt = `
      As ${agent.name}, analyze this creative brief in a natural, conversational way:
      
      Brief Details:
      Title: ${brief.title}
      Description: ${brief.description}
      Objectives: ${brief.objectives}
      Requirements: ${requirements || 'None specified'}
      
      Your Role and Background:
      ${agent.description}
      
      Your Skills:
      ${agent.skills?.map((skill: any) => `- ${skill.name}: ${skill.content}`).join('\n')}
      
      Share your thoughts as if you're speaking in a creative agency meeting. Be natural, use conversational language, 
      and express your professional opinion. After your detailed analysis, provide a concise summary of key points.
    `;

    console.log("Generating response with conversational prompt:", conversationalPrompt);

    // Generate response using OpenAI
    const content = await generateAgentResponse(conversationalPrompt);
    
    console.log("Generated agent response:", {
      agentId: agent.id,
      contentLength: content.length,
      timestamp: new Date().toISOString()
    });

    // Split the response into conversational analysis and summary
    const [analysis, summary] = content.split(/###\s*Summary:/i);

    // Save both the conversational output and the summary
    const conversationalOutput = {
      brief_id: brief.id,
      stage_id: stageId,
      agent_id: agent.id,
      content: analysis.trim(),
      output_type: 'conversational',
      created_at: new Date().toISOString()
    };

    const summaryOutput = {
      brief_id: brief.id,
      stage_id: stageId,
      agent_id: agent.id,
      content: summary ? summary.trim() : '',
      output_type: 'summary',
      created_at: new Date().toISOString()
    };

    // Insert both outputs into the database
    const { error: conversationalError } = await supabase
      .from('workflow_conversations')
      .insert([conversationalOutput]);

    if (conversationalError) {
      throw new Error(`Error saving conversational output: ${conversationalError.message}`);
    }

    const { error: summaryError } = await supabase
      .from('workflow_conversations')
      .insert([summaryOutput]);

    if (summaryError) {
      throw new Error(`Error saving summary output: ${summaryError.message}`);
    }

    console.log("Agent processing completed successfully:", {
      briefId: brief.id,
      stageId: stageId,
      agentId: agent.id,
      timestamp: new Date().toISOString()
    });

    return {
      outputs: [{
        content: analysis.trim(),
        timestamp: new Date().toISOString()
      }],
      summary: summary ? summary.trim() : ''
    };
  } catch (error) {
    console.error("Error in agent processing:", {
      error: error.message,
      briefId: brief?.id,
      stageId: stageId,
      agentId: agent?.id,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}