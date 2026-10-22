import { toast } from "sonner";
import { Link } from "react-router-dom";

import { useApplications } from "../storage/hooks";
import { setApplicationStatus } from "../storage/db";

function Moderation() {
  const applications = useApplications();

  const handleAccept = (id: string) => {
    setApplicationStatus(id, "Новые");
    toast.success("Заявка успешно одобрена");
  };

  const handleCancle = (id: string) => {
    setApplicationStatus(id, "Отклоненные");
    toast.success("Заявка успешно отклонена");
  };

  const pendingApps = applications.filter(
    (item) => item.status === "На модерации",
  );

  return (
    <div className="moderation">
      <h1>Список поданных заявок</h1>
      {pendingApps.map((item) => (
        <div key={item.id}>
          <Link to={`/applications/${item.id}`}>
            <h1>{item.title}</h1>
          </Link>
          <span className="status">{item.status}</span>
          <span>{item.date.toLocaleDateString()}</span>
          <button onClick={() => handleAccept(item.id)}>Одобрить 👍</button>
          <button onClick={() => handleCancle(item.id)}>Отклонить 👎</button>
        </div>
      ))}
    </div>
  );
}

export default Moderation;