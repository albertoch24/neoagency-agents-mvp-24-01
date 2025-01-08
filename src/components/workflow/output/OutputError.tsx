import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface OutputErrorProps {
  error: Error;
}

export const OutputError = ({ error }: OutputErrorProps) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load output: {error.message}
      </AlertDescription>
    </Alert>
  );
};