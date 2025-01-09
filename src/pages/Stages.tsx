import { useAuth } from "@/components/auth/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StageBuilder } from "@/components/stages/StageBuilder";
import { StagesHeader } from "@/components/stages/StagesHeader";
import { useParams } from "react-router-dom";
import { useState } from "react";

const Stages = () => {
  const { user } = useAuth();
  const { briefId } = useParams();
  const [isCreating, setIsCreating] = useState(false);

  const { data: stages, isLoading } = useQuery({
    queryKey: ["stages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stages")
        .select(`
          *,
          flows (
            id,
            name,
            flow_steps (
              id,
              agent_id,
              requirements,
              order_index,
              outputs,
              description
            )
          )
        `)
        .eq("user_id", user?.id)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  if (isLoading) {
    return <div>Loading stages...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <StagesHeader isCreating={isCreating} setIsCreating={setIsCreating} />
      <div className="mt-8">
        <StageBuilder stages={stages || []} briefId={briefId || ''} />
      </div>
    </div>
  );
};

export default Stages;