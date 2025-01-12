import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FileListProps {
  files: Array<{ name: string; path: string }>;
  onRemove: (path: string) => void;
}

export const FileList = ({ files, onRemove }: FileListProps) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {files.map((file) => (
        <div key={file.path} className="flex items-center justify-between p-2 bg-muted rounded-md">
          <span className="text-sm truncate">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file.path)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};