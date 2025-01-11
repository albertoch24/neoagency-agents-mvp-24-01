import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StageNavigationButtonProps {
  direction: "previous" | "next";
  onClick: () => void;
  disabled?: boolean;
  label: string;
  showIcon?: boolean;
}

export const StageNavigationButton = ({
  direction,
  onClick,
  disabled,
  label,
  showIcon = true,
}: StageNavigationButtonProps) => {
  const Icon = direction === "next" ? ArrowRight : ArrowLeft;
  const iconClassName = "h-4 w-4";

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      {direction === "previous" && showIcon && <Icon className={iconClassName} />}
      {label}
      {direction === "next" && showIcon && <Icon className={iconClassName} />}
    </Button>
  );
};