import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface OutputDisplayProps {
  output: {
    content: any;
  };
}

export const OutputDisplay = ({ output }: OutputDisplayProps) => {
  const outputContent = output.content;

  return (
    <Card className="mt-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="output">
          <AccordionTrigger className="px-4">
            View Output Details
          </AccordionTrigger>
          <AccordionContent>
            <ScrollArea className="h-[400px] px-4">
              {typeof outputContent === "string" ? (
                <ReactMarkdown>{outputContent}</ReactMarkdown>
              ) : (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(outputContent, null, 2)}
                </pre>
              )}
            </ScrollArea>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};