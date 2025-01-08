import { format } from "date-fns";

interface StageOutputHeaderProps {
  stageName: string;
  createdAt: string;
}

export function StageOutputHeader({ stageName, createdAt }: StageOutputHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        {stageName}
      </h3>
      <span className="text-sm text-muted-foreground">
        {format(new Date(createdAt), "PPpp")}
      </span>
    </div>
  );
}