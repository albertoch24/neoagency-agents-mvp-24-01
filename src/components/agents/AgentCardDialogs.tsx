import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { SkillForm } from "@/components/skills/SkillForm";

interface AgentCardDialogsProps {
  showDeleteDialog: boolean;
  showSkillDialog: boolean;
  onDeleteDialogClose: () => void;
  onSkillDialogClose: () => void;
  onDelete: () => void;
  onAddSkill: (skillData: any) => void;
}

export const AgentCardDialogs: React.FC<AgentCardDialogsProps> = ({
  showDeleteDialog,
  showSkillDialog,
  onDeleteDialogClose,
  onSkillDialogClose,
  onDelete,
  onAddSkill
}) => {
  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agent
              and all its associated skills.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSkillDialog} onOpenChange={onSkillDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <SkillForm onSubmit={onAddSkill} />
        </DialogContent>
      </Dialog>
    </>
  );
};