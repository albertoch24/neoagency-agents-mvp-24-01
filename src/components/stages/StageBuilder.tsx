import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Stage } from "@/types/workflow";
import { useState } from "react";
import { StagesHeader } from "./StagesHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { StageForm } from "./StageForm";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export const StageBuilder = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const queryClient = useQueryClient();

  const { data: stages, isLoading } = useQuery({
    queryKey: ["stages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user
  });

  const handleStageMove = async (stageId: string, direction: "up" | "down") => {
    if (!stages) return;
    
    const currentIndex = stages.findIndex((s) => s.id === stageId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const updatedStages = [...stages];
    const [movedStage] = updatedStages.splice(currentIndex, 1);
    updatedStages.splice(newIndex, 0, movedStage);

    try {
      for (const [index, stage] of updatedStages.entries()) {
        const { error } = await supabase
          .from("stages")
          .update({ order_index: index })
          .eq("id", stage.id);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage order updated successfully");
    } catch (error) {
      console.error("Error updating stage order:", error);
      toast.error("Failed to update stage order");
    }
  };

  const handleStageDelete = async (stageId: string) => {
    try {
      const { error } = await supabase
        .from("stages")
        .delete()
        .eq("id", stageId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["stages"] });
      toast.success("Stage deleted successfully");
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast.error("Failed to delete stage");
    }
  };

  if (isLoading) {
    return <div>Loading stages...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <StagesHeader isCreating={isCreating} setIsCreating={setIsCreating} />
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="space-y-4">
          {stages?.map((stage, index) => (
            <Card key={stage.id} className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{stage.name}</h3>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStageMove(stage.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStageMove(stage.id, "down")}
                      disabled={index === stages.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setEditingStage(stage)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      {editingStage && (
                        <DialogContent>
                          <StageForm 
                            onClose={() => setEditingStage(null)} 
                            editingStage={editingStage}
                          />
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleStageDelete(stage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <StageForm onClose={() => setIsCreating(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};