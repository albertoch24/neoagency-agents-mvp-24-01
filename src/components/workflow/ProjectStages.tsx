import { Stage } from "@/types/workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectStagesProps {
  stages: Stage[];
  currentStage?: string;
  onStageSelect?: (stage: Stage) => void;
  briefId?: string;
}

export const ProjectStages = ({ 
  stages, 
  currentStage, 
  onStageSelect,
  briefId 
}: ProjectStagesProps) => {
  return (
    <ScrollArea className="w-full" orientation="horizontal">
      <div className="flex space-x-4 p-4">
        {stages.map((stage) => (
          <Card 
            key={stage.id}
            className={`flex-shrink-0 w-[180px] cursor-pointer transition-all hover:shadow-md ${
              currentStage === stage.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onStageSelect?.(stage)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold truncate">{stage.name}</h3>
                  {currentStage === stage.id && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
                {stage.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {stage.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};