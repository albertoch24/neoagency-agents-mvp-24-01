import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefFormFields } from "./BriefFormFields";
import { BriefFormSubmitButton } from "./BriefFormSubmitButton";
import { useBriefForm } from "./useBriefForm";

interface BriefFormProps {
  initialData?: any;
  onSubmitSuccess?: () => void;
}

const BriefForm = ({ initialData, onSubmitSuccess }: BriefFormProps) => {
  const form = useForm({
    defaultValues: {
      title: initialData?.title || "",
      brand: initialData?.brand || "",
      description: initialData?.description || "",
      objectives: initialData?.objectives || "",
      target_audience: initialData?.target_audience || "",
      budget: initialData?.budget || "",
      timeline: initialData?.timeline || "",
      use_langchain: initialData?.use_langchain || true, // Default to true for new briefs
    },
  });

  const { handleSubmit, isProcessing } = useBriefForm(initialData, onSubmitSuccess);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Brief" : "Submit a Brief"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <BriefFormFields form={form} />
            <BriefFormSubmitButton 
              isProcessing={isProcessing} 
              isEditing={!!initialData} 
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BriefForm;