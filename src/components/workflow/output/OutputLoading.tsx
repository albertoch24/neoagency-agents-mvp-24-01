import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const OutputLoading = () => {
  return (
    <Card className="p-8 flex justify-center items-center">
      <Loader2 className="h-6 w-6 animate-spin" />
    </Card>
  );
};