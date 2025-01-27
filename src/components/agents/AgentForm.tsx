import { useState } from "react";
import { useForm } from "react-hook-form";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { VoiceSelector } from "./VoiceSelector";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface AgentFormProps {
  onSubmit: (data: Partial<Agent>) => Promise<void>;
  initialData?: Agent;
}

export const AgentForm = ({ onSubmit, initialData }: AgentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Partial<Agent>>({
    defaultValues: initialData || {}
  });

  const onSubmitForm = async (data: Partial<Agent>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome dell'Agente</Label>
        <Input
          id="name"
          {...register("name", { required: "Il nome è obbligatorio" })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descrivi in cosa è specializzato questo agente..."
        />
      </div>

      <Card className="p-4 space-y-4 bg-agent border-agent-border">
        <div className="flex items-start space-x-2">
          <Label htmlFor="prompt_template" className="text-lg font-semibold">Template del Prompt Personalizzato</Label>
          <InfoIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Il template del prompt definisce come questo agente si comporterà e risponderà. Puoi:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Lasciarlo vuoto per usare il template predefinito</li>
            <li>Personalizzarlo per dare istruzioni specifiche all'agente</li>
            <li>Usare variabili come {`{name}`} e {`{description}`} che verranno sostituite con i dettagli dell'agente</li>
          </ul>
        </div>

        <Textarea
          id="prompt_template"
          {...register("prompt_template")}
          className="min-h-[200px] font-mono text-sm"
          placeholder="Inserisci un template di prompt personalizzato per questo agente..."
        />
      </Card>

      <div className="space-y-2">
        <Label htmlFor="voice">Voce</Label>
        <VoiceSelector
          value={initialData?.voice_id || ""}
          onValueChange={(voiceId) => register("voice_id").onChange({ target: { value: voiceId } })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Salvataggio..." : initialData ? "Aggiorna Agente" : "Crea Agente"}
      </Button>
    </form>
  );
};