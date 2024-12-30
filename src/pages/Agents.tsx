import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Agent } from "@/types/agent";
import { toast } from "sonner";
import { AgentForm } from "@/components/agents/AgentForm";
import { useAuth } from "@/components/auth/AuthProvider";
import { AgentsList } from "@/components/agents/AgentsList";
import { AgentsHeader } from "@/components/agents/AgentsHeader";

export default function Agents() {
  const navigate = useNavigate();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const { user } = useAuth();

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("agents")
        .select(`
          *,
          skills (*)
        `)
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching agents:", error);
        toast.error("Failed to load agents");
        throw error;
      }

      return data as Agent[];
    },
    enabled: !!user,
  });

  const handleGoToHome = () => navigate("/");
  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setShowAgentDialog(true);
  };
  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentDialog(true);
  };

  const handleSubmitAgent = async (agentData: Partial<Agent>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      if (selectedAgent) {
        const { error } = await supabase
          .from('agents')
          .update({
            name: agentData.name,
            description: agentData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAgent.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Agent updated successfully');
      } else {
        const { error } = await supabase
          .from('agents')
          .insert([{
            name: agentData.name,
            description: agentData.description,
            user_id: user.id,
          }]);

        if (error) throw error;
        toast.success('Agent created successfully');
      }

      setShowAgentDialog(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Error saving agent:', error);
      toast.error(selectedAgent ? 'Failed to update agent' : 'Failed to create agent');
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-8">
      <AgentsHeader 
        onGoHome={handleGoToHome}
        onCreateAgent={handleCreateAgent}
      />

      <AgentsList 
        agents={agents}
        onEditAgent={handleEditAgent}
        isLoading={isLoading}
      />

      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? 'Edit Agent' : 'Create New Agent'}
            </DialogTitle>
            <DialogDescription>
              {selectedAgent 
                ? 'Update the agent details below.' 
                : 'Fill in the details to create a new AI agent.'}
            </DialogDescription>
          </DialogHeader>
          <AgentForm
            onSubmit={handleSubmitAgent}
            initialData={selectedAgent || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}