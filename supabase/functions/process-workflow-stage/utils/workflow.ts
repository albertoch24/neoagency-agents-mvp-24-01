import { createClient } from "@supabase/supabase-js";
import { Configuration, OpenAIApi } from "openai";
import { corsHeaders } from "./cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const configuration = new Configuration({ apiKey: openAIApiKey });
const openai = new OpenAIApi(configuration);

export async function generateStageSummary(outputs: any[]) {
  try {
    const formattedOutputs = outputs.map(output => {
      if (Array.isArray(output.outputs)) {
        return output.outputs.map(o => o.content).join('\n');
      }
      return output.content || '';
    }).join('\n\n');

    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional content summarizer. Create a clear, concise summary of the key points from the provided outputs. Focus on the most important insights and findings. Format the summary in a clear, readable way using bullet points where appropriate."
        },
        {
          role: "user",
          content: `Please analyze and summarize the following outputs from a workflow stage:\n\n${formattedOutputs}`
        }
      ],
    });

    return response.data.choices[0].message?.content || '';
  } catch (error) {
    console.error('Error generating stage summary:', error);
    throw error;
  }
}

export async function saveBriefOutput(
  supabase: any,
  briefId: string,
  stageId: string,
  stageName: string,
  outputs: any[]
) {
  // Generate comprehensive summary of all outputs
  const stageSummary = await generateStageSummary(outputs);

  const { error: outputError } = await supabase
    .from("brief_outputs")
    .insert({
      brief_id: briefId,
      stage: stageId,
      stage_id: stageId,
      content: {
        stage_name: stageName,
        outputs: outputs,
      },
      stage_summary: stageSummary
    });

  if (outputError) throw outputError;
}