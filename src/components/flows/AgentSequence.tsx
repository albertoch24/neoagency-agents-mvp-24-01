import { User, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AgentSkills } from "./AgentSkills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from 'react-markdown';
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AgentSequenceProps {
  conversations: any[];
}

export const AgentSequence = ({ conversations }: AgentSequenceProps) => {
  const [isPlaying, setIsPlaying] = useState<{[key: string]: boolean}>({});
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement}>({});

  // Group conversations by agent and type
  const groupedConversations = conversations.reduce((acc: any, conv: any) => {
    const agentId = conv.agent_id;
    if (!acc[agentId]) {
      acc[agentId] = {
        agent: conv.agents,
        conversational: null,
        summary: null
      };
    }
    if (conv.output_type === 'conversational') {
      acc[agentId].conversational = conv;
    } else if (conv.output_type === 'summary') {
      acc[agentId].summary = conv;
    }
    return acc;
  }, {});

  const handleTextToSpeech = async (text: string, convId: string) => {
    try {
      if (isPlaying[convId]) {
        // Stop playing
        if (audioElements[convId]) {
          audioElements[convId].pause();
          audioElements[convId].currentTime = 0;
        }
        setIsPlaying(prev => ({ ...prev, [convId]: false }));
        return;
      }

      const { data: secretData, error: secretError } = await supabase
        .from('secrets')
        .select('secret')
        .eq('name', 'ELEVEN_LABS_API_KEY')
        .maybeSingle();

      if (secretError) {
        console.error('Error fetching API key:', secretError);
        toast.error('Failed to fetch ElevenLabs API key');
        return;
      }

      if (!secretData?.secret) {
        console.error('ElevenLabs API key not found');
        toast.error('ElevenLabs API key not found. Please add it in settings.');
        return;
      }

      console.log('Making request to ElevenLabs API...');
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': secretData.secret
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ElevenLabs API error:', errorData);
        throw new Error(`ElevenLabs API error: ${errorData.detail?.message || 'Unknown error'}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      setAudioElements(prev => ({ ...prev, [convId]: audio }));
      
      audio.onended = () => {
        setIsPlaying(prev => ({ ...prev, [convId]: false }));
      };
      
      audio.play();
      setIsPlaying(prev => ({ ...prev, [convId]: true }));
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      toast.error('Failed to generate speech. Please check your ElevenLabs API key.');
    }
  };

  return (
    <div className="space-y-4">
      {Object.values(groupedConversations).map((group: any, index: number) => (
        <Card key={group.agent.id} className="overflow-hidden border-agent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
              <User className="h-5 w-5 text-agent" />
              <span className="font-semibold text-lg">
                {group.agent?.name || 'Unknown Agent'}
              </span>
              <Badge variant="outline" className="ml-auto">
                Step {index + 1}
              </Badge>
            </div>
            
            <div className="pl-6 space-y-6">
              <div>
                <h5 className="text-sm font-medium mb-2 text-muted-foreground">Skills Used:</h5>
                <AgentSkills skills={group.agent?.skills} />
              </div>
              
              {group.conversational && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Agent Output:</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTextToSpeech(group.conversational.content, group.conversational.id)}
                    >
                      {isPlaying[group.conversational.id] ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-agent/5 rounded-lg p-6 shadow-sm">
                    <div className={`prose prose-sm max-w-none dark:prose-invert 
                      prose-p:text-foreground/90 prose-headings:text-foreground
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-li:text-foreground/90 prose-a:text-primary
                      [&>p]:leading-7 [&>ul]:mt-4 [&>ul]:list-none [&>ul]:pl-0
                      [&>ul>li]:relative [&>ul>li]:pl-4 ${isPlaying[group.conversational.id] ? 'hidden' : ''}`}>
                      <ReactMarkdown>{group.conversational.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {group.summary && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Summary:</h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTextToSpeech(group.summary.content, group.summary.id)}
                    >
                      {isPlaying[group.summary.id] ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-muted rounded-lg p-6">
                    <div className={`prose prose-sm max-w-none dark:prose-invert ${isPlaying[group.summary.id] ? 'hidden' : ''}`}>
                      <ReactMarkdown>{group.summary.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};