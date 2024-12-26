import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skill } from "@/types/agent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SkillFormProps {
  onSubmit: (skill: Partial<Skill>) => void;
  initialData?: Partial<Skill>;
}

export const SkillForm = ({ onSubmit, initialData }: SkillFormProps) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    type: initialData?.type || "text",
    content: initialData?.content || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Skill" : "Add New Skill"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Skill name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the skill"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as "text" | "document" })}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="text" id="text" />
                <Label htmlFor="text">Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="document" id="document" />
                <Label htmlFor="document">Document</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            {formData.type === "text" ? (
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter skill content"
                required
              />
            ) : (
              <Input
                id="content"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      setFormData({ ...formData, content: e.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                accept=".pdf,.doc,.docx,.txt"
                required
              />
            )}
          </div>
          <Button type="submit" className="w-full">
            {initialData ? "Update Skill" : "Add Skill"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};