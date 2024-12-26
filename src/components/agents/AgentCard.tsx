import { useState } from "react";
import { Agent } from "@/types/agent";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgentResponse } from "@/hooks/useAgentResponse";
import { useQueryClient } from "@tanstack/react-query";
import { AgentCardHeader } from "./AgentCardHeader";
import { AgentCardContent } from "./AgentCardContent";
import { AgentCardDialogs } from "./AgentCardDialogs";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSkillDialog, setShowSkillDialog] = useState(false);
  const { getAgentResponse } = useAgentResponse();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await getAgentResponse(agent.id, userMessage);
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    } catch (error) {
      console.error('Error getting agent response:', error);
      toast.error('Failed to get response from agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Start a transaction to ensure all operations succeed or fail together
      const { error: transactionError } = await supabase.rpc('delete_agent_with_relations', {
        agent_id: agent.id
      });

      if (transactionError) {
        console.error('Error in delete transaction:', transactionError);
        throw transactionError;
      }

      toast.success('Agent deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleAddSkill = async (skillData: any) => {
    try {
      const { error } = await supabase
        .from('skills')
        .insert([{
          ...skillData,
          agent_id: agent.id,
        }]);

      if (error) throw error;

      toast.success('Skill added successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setShowSkillDialog(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error('Failed to add skill');
    }
  };

  const handleEdit = async (updatedAgent: Partial<Agent>) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: updatedAgent.name,
          description: updatedAgent.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agent.id);

      if (error) throw error;

      toast.success('Agent updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    }
  };

  return (
    <Card className="card-hover-effect agent-card h-[500px] flex flex-col">
      <AgentCardHeader
        agent={agent}
        onAddSkill={() => setShowSkillDialog(true)}
        onEdit={() => onClick?.()}
        onDelete={() => setShowDeleteDialog(true)}
        onSave={handleEdit}
      />
      <AgentCardContent
        messages={messages}
        isLoading={isLoading}
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        updatedAt={agent.updated_at}
      />
      <AgentCardDialogs
        showDeleteDialog={showDeleteDialog}
        showSkillDialog={showSkillDialog}
        onDeleteDialogClose={() => setShowDeleteDialog(false)}
        onSkillDialogClose={() => setShowSkillDialog(false)}
        onDelete={handleDelete}
        onAddSkill={handleAddSkill}
      />
    </Card>
  );
};