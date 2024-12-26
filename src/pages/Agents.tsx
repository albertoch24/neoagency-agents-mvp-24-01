import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Plus } from "lucide-react";
import { AgentCard } from "@/components/agents/AgentCard";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

export default function Agents() {
  const navigate = useNavigate();

  const { data: agents, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select(`
          *,
          skills (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load agents");
        throw error;
      }

      return data as Agent[];
    },
  });

  const handleGoToHome = () => {
    navigate("/");
  };

  return (
    <div className="container mx-auto space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">
            Manage your AI agents and their capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleGoToHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Brief
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-[500px] animate-pulse">
              <CardHeader>
                <CardTitle className="h-6 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents?.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
          {agents?.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground text-center">
                  No agents found. Create your first AI agent to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}