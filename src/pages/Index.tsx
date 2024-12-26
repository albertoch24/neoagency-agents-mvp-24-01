import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-3xl text-center space-y-6 animate-fade-in">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          AI Agent Management System
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
          Create, manage, and orchestrate AI agents with customizable skills and sequential workflows.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/agents")}
            className="text-lg"
          >
            Manage Agents
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/flows")}
            className="text-lg"
          >
            View Flows
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;