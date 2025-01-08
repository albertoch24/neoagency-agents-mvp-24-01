import { format } from "date-fns";

interface OutputHeaderProps {
  stageName: string;
  createdAt: string;
}

export const OutputHeader = ({ stageName, createdAt }: OutputHeaderProps) => (
  <div className="flex items-center justify-between border-b pb-4">
    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      {stageName}
    </h3>
    <span className="text-sm text-muted-foreground">
      {format(new Date(createdAt), "PPpp")}
    </span>
  </div>
);