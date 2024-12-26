import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Agent, Skill } from "@/types/agent";

interface AgentFormProps {
  onSubmit: (agent: Partial<Agent>) => void;
  initialData?: Partial<Agent>;
}

export const AgentForm = ({ onSubmit, initialData }: AgentFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Agent" : "Create New Agent"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Agent name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the agent's purpose"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            {initialData ? "Update Agent" : "Create Agent"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};