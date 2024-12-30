import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

const iconMap = {
  flag: Flag,
  search: Search,
  lightbulb: Lightbulb,
  film: Film,
  target: Target,
};

interface WorkflowStagesProps {
  currentStage: string;
  onStageSelect: (stage: WorkflowStage) => void;
}

export function WorkflowStages({ currentStage, onStageSelect }: WorkflowStagesProps) {
  const { user } = useAuth();

  // Fetch stages from the database
  const { data: stages } = useQuery({
    queryKey: ["stages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("user_id", user?.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        return [];
      }

      return data;
    },
    enabled: !!user,
  });

  if (!stages || stages.length === 0) {
    return null;
  }

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        // Skip rendering if stage is empty or invalid
        if (!stage.name || !stage.description) {
          return null;
        }

        // Determine icon based on stage name or default to Flag
        const iconKey = stage.name.toLowerCase().includes("kick") ? "flag" :
                       stage.name.toLowerCase().includes("insight") ? "search" :
                       stage.name.toLowerCase().includes("concept") ? "lightbulb" :
                       stage.name.toLowerCase().includes("storyboard") ? "film" :
                       "target";
                       
        const Icon = iconMap[iconKey as keyof typeof iconMap];
        const isActive = currentStage === stage.id;
        const isCompleted = index < currentStageIndex;
        const isNext = index === currentStageIndex + 1;

        return (
          <Card
            key={stage.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              isActive && "border-primary",
              isCompleted && "bg-muted"
            )}
            onClick={() => onStageSelect(stage)}
          >
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon className="h-5 w-5" />
                {stage.name}
                {isCompleted && (
                  <Badge variant="secondary" className="ml-auto">
                    Completed
                  </Badge>
                )}
                {isNext && (
                  <Badge variant="outline" className="ml-auto">
                    Next
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}