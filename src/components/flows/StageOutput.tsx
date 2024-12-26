interface StageOutputProps {
  output: {
    created_at: string;
    content: {
      response: string;
    };
  };
}

export const StageOutput = ({ output }: StageOutputProps) => {
  return (
    <div key={output.created_at} className="mt-4">
      <p className="text-sm font-medium">Required Output:</p>
      <p className="text-sm text-muted-foreground mt-1">
        {output.content.response}
      </p>
    </div>
  );
};