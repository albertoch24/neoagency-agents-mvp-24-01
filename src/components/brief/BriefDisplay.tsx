import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Brief {
  title: string;
  description: string;
  objectives: string;
  target_audience: string;
  budget: string;
  timeline: string;
  current_stage: string;
}

interface BriefDisplayProps {
  brief: Brief;
}

const BriefDisplay = ({ brief }: BriefDisplayProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{brief.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p><strong>Description:</strong> {brief.description}</p>
          <p><strong>Objectives:</strong> {brief.objectives}</p>
          <p><strong>Target Audience:</strong> {brief.target_audience}</p>
          <p><strong>Budget:</strong> {brief.budget}</p>
          <p><strong>Timeline:</strong> {brief.timeline}</p>
          <p><strong>Current Stage:</strong> {brief.current_stage}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BriefDisplay;