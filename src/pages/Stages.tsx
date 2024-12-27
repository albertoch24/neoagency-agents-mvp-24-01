import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StageBuilder } from "@/components/stages/StageBuilder";
import { StagesHeader } from "@/components/stages/StagesHeader";

const Stages = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const { data: stages } = useQuery({
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