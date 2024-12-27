import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StageBuilder } from "@/components/stages/StageBuilder";
import { StagesHeader } from "@/components/stages/StagesHeader";
import { toast } from "sonner";

const Stages = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  // Create a stage to trigger the default stages creation
  const createInitialStage = async () => {
    try {
      const { error } = await supabase.from("stages").insert({
        name: "Initial Stage",
        description: "This stage triggers the creation of default stages",
        order_index: 0,
        user_id: user?.id,
      });

      if (error) throw error;
      
      // Refetch stages after creating the initial one
      await refetch();
    } catch (error) {
      console.error("Error creating initial stage:", error);
      toast.error("Failed to create initial stages");
    }
  };

  const { data: stages, refetch } = useQuery({
    queryKey: ["stages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select("*")
        .eq("user_id", user?.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        return [];
      }

      // If no stages exist and user is admin, create initial stage to trigger defaults
      if (data.length === 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user?.id)
          .single();

        if (profile?.is_admin) {
          await createInitialStage();
          return [];
        }
      }

      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <StagesHeader isCreating={isCreating} setIsCreating={setIsCreating} />
      <StageBuilder stages={stages || []} />
    </div>
  );
};

export default Stages;