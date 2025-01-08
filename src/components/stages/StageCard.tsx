import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stage } from "@/types/workflow";
import { StageHeader } from "./StageHeader";
import { StageControls } from "./StageControls";
import { useNavigate } from "react-router-dom";

interface StageCardProps {
  stage: Stage;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  canStart: boolean;
  totalStages: number;
  briefId: string;
  onStageClick: (stage: Stage, index: number) => void;
  onMove: (stageId: string, direction: "up" | "down") => void;
  onEdit: () => void;
  onDelete: (stageId: string) => void;
}

export const StageCard = ({
  stage,
  index,
  isActive,
  isCompleted,
  canStart,
  totalStages,
  briefId,
  onStageClick,
  onMove,
  onEdit,
  onDelete
}: StageCardProps) => {
  const navigate = useNavigate();

  const handleStageClick = (stage: Stage, index: number) => {
    navigate(`/brief/${briefId}/stage/${stage.id}`);
    onStageClick(stage, index);
  };

  return (
    <Card 
      key={stage.id} 
      className={isActive ? "border-primary" : ""}
      onClick={() => handleStageClick(stage, index)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <StageHeader 
            stage={stage} 
            isActive={isActive}
            isCompleted={isCompleted}
          />
          <div className="flex items-center gap-2">
            <StageControls
              stage={stage}
              index={index}
              totalStages={totalStages}
              onMove={onMove}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {!isCompleted && canStart && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStageClick(stage, index);
                }}
                className="flex items-center gap-2"
              >
                Start Stage
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};