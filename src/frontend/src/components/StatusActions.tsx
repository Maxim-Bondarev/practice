import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { changeApplicationStatus } from "../storage/db";
import { allowedTransitions, transitionLabel } from "../domain/statuses";
import type { Application, ApplicationStatus } from "../types/types";

function StatusActions({ application }: { application: Application }) {
  const { user } = useAuth();
  if (!user) return null;

  const isAdmin = user.roles.includes("admin");
  const isAuthor = user.id === application.authorId;
  const transitions = allowedTransitions(application.status, {
    isAdmin,
    isAuthor,
  });
  if (transitions.length === 0) return null;

  const handleChange = (status: ApplicationStatus) => {
    const updated = changeApplicationStatus({
      applicationId: application.id,
      status,
      actor: { id: user.id, name: user.username, isAdmin },
    });
    if (updated) toast.success(`Статус изменён: ${status}`);
    else toast.error("Не удалось изменить статус");
  };

  return (
    <div className="status_actions">
      {transitions.map((status) => (
        <button
          key={status}
          type="button"
          data-to={status}
          onClick={() => handleChange(status)}
        >
          {transitionLabel(application.status, status)}
        </button>
      ))}
    </div>
  );
}

export default StatusActions;