import { Check } from "lucide-react";

interface OutputListProps {
  outputs: string[];
}

export function OutputList({ outputs }: OutputListProps) {
  return (
    <div className="space-y-2">
      {outputs.map((output, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Check className="h-4 w-4 text-muted-foreground" />
          <span>{output}</span>
        </div>
      ))}
    </div>
  );
}