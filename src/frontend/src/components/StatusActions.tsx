import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { changeApplicationStatus } from "../api/mutations";
import { apiErrorMessage } from "../api/errors";
import { allowedTransitions, transitionLabel } from "../domain/statuses";
import type { Application, ApplicationStatus } from "../types/types";

function StatusActions({ application }: { application: Application }) {
  const { user } = useAuth();
  const [pending, setPending] = useState<ApplicationStatus | null>(null);
  if (!user) return null;

  const isAdmin = user.roles.includes("admin");
  const isAuthor = user.id === application.authorId;
  const transitions = allowedTransitions(application.status, {
    isAdmin,
    isAuthor,
  });
  if (transitions.length === 0) return null;

  const handleChange = async (status: ApplicationStatus) => {
    if (pending) return;
    setPending(status);

    try {
      await changeApplicationStatus(application.id, status);
      toast.success(`Статус изменён: ${status}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Не удалось изменить статус"));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="status_actions">
      {transitions.map((status) => (
        <button
          key={status}
          type="button"
          data-to={status}
          disabled={pending !== null}
          onClick={() => void handleChange(status)}
        >
          {transitionLabel(application.status, status)}
        </button>
      ))}
    </div>
  );
}

export default StatusActions;