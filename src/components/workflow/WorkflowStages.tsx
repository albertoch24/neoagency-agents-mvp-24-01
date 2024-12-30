import { Flag, Search, Lightbulb, Film, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WorkflowStage } from "@/types/workflow";

export const stages: WorkflowStage[] = [
  {
    id: "kickoff",
    name: "Kick Off",
    icon: "flag",
    description: "Project initialization and objective setting",
    roles: [
      {
        id: "account-manager",
        name: "Account Manager",
        responsibilities: ["Set project objectives", "Define KPIs", "Client communication"],
      },
    ],
    outputs: ["Internal Brief", "Project Timeline", "KPI Document"],
  },
  {
    id: "insight",
    name: "Insight Exploration",
    icon: "search",
    description: "Market analysis and research phase",
    roles: [
      {
        id: "strategic-planner",
        name: "Strategic Planner",
        responsibilities: ["Market analysis", "Competitive research"],
      },
      {
        id: "media-planner",
        name: "Media Planner",
        responsibilities: ["Channel analysis", "Budget planning"],
      },
    ],
    outputs: ["Insight Report", "Market Analysis", "Competitor Analysis"],
  },
  {
    id: "concept",
    name: "Concept Ideation",
    icon: "lightbulb",
    description: "Creative concept development",
    roles: [
      {
        id: "creative-director",
        name: "Creative Director",
        responsibilities: ["Creative direction", "Concept approval"],
      },
      {
        id: "copywriter",
        name: "Copywriter",
        responsibilities: ["Messaging development", "Content creation"],
      },
      {
        id: "art-director",
        name: "Art Director",
        responsibilities: ["Visual direction", "Design concepts"],
      },
    ],
    outputs: ["Creative Brief", "Key Messages", "Visual Guidelines"],
  },
  {
    id: "storyboard",
    name: "Storyboard",
    icon: "film",
    description: "Visual planning and narrative structure",
    roles: [
      {
        id: "creative-director",
        name: "Creative Director",
        responsibilities: ["Storyboard review", "Narrative approval"],
      },
      {
        id: "art-director",
        name: "Art Director",
        responsibilities: ["Visual sequence", "Style guide"],
      },
    ],
    outputs: ["Storyboard Document", "Visual Sequence", "Style Guide"],
  },
  {
    id: "strategy",
    name: "Strategy Alignment",
    icon: "target",
    description: "Strategic planning and execution",
    roles: [
      {
        id: "strategic-planner",
        name: "Strategic Planner",
        responsibilities: ["Strategy development", "Implementation planning"],
      },
      {
        id: "media-planner",
        name: "Media Planner",
        responsibilities: ["Media strategy", "Channel planning"],
      },
      {
        id: "social-media-manager",
        name: "Social Media Manager",
        responsibilities: ["Social strategy", "Content calendar"],
      },
    ],
    outputs: ["Strategic Plan", "Channel Strategy", "Content Calendar"],
  },
];

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
  const currentStageIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {stages.map((stage, index) => {
        const Icon = iconMap[stage.icon as keyof typeof iconMap];
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