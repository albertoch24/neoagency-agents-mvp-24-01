import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface FlowHistoryProps {
  flowId: string;
  onClose: () => void;
}

interface HistoryEntry {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  results: any;
}

export const FlowHistory = ({ flowId, onClose }: FlowHistoryProps) => {
  const { data: history } = useQuery({
    queryKey: ["flow-history", flowId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flow_history")
        .select("*")
        .eq("flow_id", flowId)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as HistoryEntry[];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Flow History</h2>
        <Button onClick={onClose}>Close</Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {history?.map((entry) => (
            <div
              key={entry.id}
              className="p-4 border rounded-lg space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {formatDistanceToNow(new Date(entry.started_at), {
                    addSuffix: true,
                  })}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    entry.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : entry.status === "failed"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              {entry.results && (
                <pre className="bg-muted p-2 rounded text-sm overflow-x-auto">
                  {JSON.stringify(entry.results, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {(!history || history.length === 0) && (
            <p className="text-center text-muted-foreground">
              No history available for this flow
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};