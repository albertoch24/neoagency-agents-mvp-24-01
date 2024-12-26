import { WorkflowRole } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";

interface RoleListProps {
  roles: WorkflowRole[];
}

export function RoleList({ roles }: RoleListProps) {
  return (
    <div className="space-y-4">
      {roles.map((role) => (
        <div key={role.id} className="space-y-2">
          <h3 className="font-medium">{role.name}</h3>
          <div className="flex flex-wrap gap-2">
            {role.responsibilities.map((responsibility, index) => (
              <Badge key={index} variant="secondary">
                {responsibility}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}