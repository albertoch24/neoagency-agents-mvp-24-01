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
      console.log("Creating initial stage for user:", user?.id);
      const { error } = await supabase.from("stages").insert({
        name: "Initial Stage",
        description: "This stage triggers the creation of default stages",
        order_index: 0,
        user_id: user?.id,
      });

      if (error) {
        console.error("Error creating initial stage:", error);
        throw error;
      }
      
      console.log("Initial stage created successfully");
      toast.success("Default stages created");
      
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
      console.log("Fetching stages for user:", user?.id);
      
      const { data: stages, error } = await supabase
        .from("stages")
        .select("*")
        .eq("user_id", user?.id)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Error fetching stages:", error);
        return [];
      }

      console.log("Fetched stages:", stages);

      // If no stages exist and user is admin, create initial stage to trigger defaults
      if (!stages || stages.length === 0) {
        console.log("No stages found, checking if user is admin");
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user?.id)
          .single();

        console.log("User profile:", profile);

        if (profile?.is_admin) {
          console.log("User is admin, creating initial stage");
          await createInitialStage();
          
          // Fetch stages again after creating the initial one
          const { data: newStages } = await supabase
            .from("stages")
            .select("*")
            .eq("user_id", user?.id)
            .order("order_index", { ascending: true });
            
          console.log("Newly created stages:", newStages);
          return newStages || [];
        }
      }

      return stages || [];
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