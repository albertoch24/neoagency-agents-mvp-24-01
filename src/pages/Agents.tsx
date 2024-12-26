import { useState } from "react";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentForm } from "@/components/agents/AgentForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Agent } from "@/types/agent";
import { useToast } from "@/components/ui/use-toast";

const Agents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateAgent = (agentData: Partial<Agent>) => {
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      name: agentData.name!,
      description: agentData.description!,
      skills: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setAgents([...agents, newAgent]);
    setIsCreating(false);
    toast({
      title: "Agent Created",
      description: "Your new agent has been created successfully.",
    });
  };

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
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Agents;