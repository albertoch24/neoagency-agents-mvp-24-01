import { useState, useEffect } from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentForm } from "@/components/agents/AgentForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Agent } from "@/types/agent";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, PencilIcon } from "lucide-react";

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedAgents = data.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description || '',
        skills: [],
        createdAt: new Date(agent.created_at),
        updatedAt: new Date(agent.updated_at),
      }));

      setAgents(formattedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error",
        description: "Failed to load agents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgent = async (agentData: Partial<Agent>) => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            name: agentData.name,
            description: agentData.description,
            user_id: user?.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newAgent: Agent = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        skills: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setAgents([newAgent, ...agents]);
      setIsCreating(false);
      toast({
        title: "Agent Created",
        description: "Your new agent has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    }
  };

  const handleUpdateAgent = async (agentData: Partial<Agent>) => {
    if (!editingAgent) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .update({
          name: agentData.name,
          description: agentData.description,
        })
        .eq('id', editingAgent.id)
        .select()
        .single();

      if (error) throw error;

      const updatedAgent: Agent = {
        ...editingAgent,
        name: data.name,
        description: data.description || '',
        updatedAt: new Date(data.updated_at),
      };

      setAgents(agents.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      ));
      setEditingAgent(null);
      toast({
        title: "Agent Updated",
        description: "Your agent has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error",
        description: "Failed to update agent",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg">Create Agent</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <AgentForm onSubmit={handleCreateAgent} />
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No agents created yet. Create your first agent to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <div key={agent.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => setEditingAgent(agent)}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <AgentForm
            initialData={editingAgent || undefined}
            onSubmit={handleUpdateAgent}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agents;