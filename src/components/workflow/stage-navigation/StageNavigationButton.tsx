import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageNavigationButtonProps {
  direction: "previous" | "next";
  onClick: () => void;
  disabled?: boolean;
  label: string;
  showIcon?: boolean;
  className?: string;
}

export const StageNavigationButton = ({
  direction,
  onClick,
  disabled,
  label,
  showIcon = true,
  className,
}: StageNavigationButtonProps) => {
  const Icon = direction === "next" ? ArrowRight : ArrowLeft;
  const iconClassName = "h-4 w-4";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn("flex items-center gap-2", className)}
    >
      {direction === "previous" && showIcon && <Icon className={iconClassName} />}
      {label}
      {direction === "next" && showIcon && <Icon className={iconClassName} />}
    </Button>
  );
};