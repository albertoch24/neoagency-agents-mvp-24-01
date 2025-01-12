import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const uploadFile = async (file: File): Promise<{ path: string; name: string } | null> => {
  const fileName = file.name.replace(/[^\x00-\x7F]/g, '');
  const fileExt = fileName.split('.').pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('brand_documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  return { path: filePath, name: fileName };
};

export const removeFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('brand_documents')
    .remove([filePath]);

  if (error) throw error;
};