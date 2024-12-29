import { useState } from "react";
import { Agent, Skill } from "@/types/agent";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAgentResponse } from "@/hooks/useAgentResponse";
import { useQueryClient } from "@tanstack/react-query";
import { AgentCardHeader } from "./AgentCardHeader";
import { AgentCardDialogs } from "./AgentCardDialogs";
import { AgentDescriptionNav } from "./AgentDescriptionNav";
import { AgentDescriptionContent } from "./AgentDescriptionContent";

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
  const [activeSection, setActiveSection] = useState("overview");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

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
      const { error: workflowError } = await supabase
        .from('workflow_conversations')
        .delete()
        .eq('agent_id', agent.id);

      if (workflowError) {
        console.error('Error deleting workflow conversations:', workflowError);
        toast.error('Failed to delete agent conversations');
        return;
      }

      const { error: agentError } = await supabase
        .from('agents')
        .delete()
        .eq('id', agent.id);

      if (agentError) {
        console.error('Error deleting agent:', agentError);
        toast.error('Failed to delete agent');
        return;
      }

      const { error: skillsError } = await supabase
        .from('skills')
        .delete()
        .eq('agent_id', agent.id);

      if (skillsError) {
        console.error('Error deleting skills:', skillsError);
        toast.error('Failed to delete agent skills');
        return;
      }

      toast.success('Agent deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Unexpected error deleting agent:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      toast.success('Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error('Failed to delete skill');
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
    <Card className="card-hover-effect agent-card h-[600px] flex flex-col">
      <AgentCardHeader
        agent={agent}
        onAddSkill={() => setShowSkillDialog(true)}
        onEdit={() => onClick?.()}
        onDelete={() => setShowDeleteDialog(true)}
        onSave={handleEdit}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="line-clamp-2 px-6 py-2 text-sm text-muted-foreground">
          {agent.description || "No description available."}
        </div>
        <AgentDescriptionNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <div className="flex-1 overflow-hidden">
          <AgentDescriptionContent
            agent={agent}
            activeSection={activeSection}
            editingSkill={editingSkill}
            onEditSkill={(skill) => setEditingSkill(skill)}
            onDeleteSkill={handleDeleteSkill}
            onUpdateSkill={(skill) => setEditingSkill(skill)}
          />
        </div>
      </div>
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