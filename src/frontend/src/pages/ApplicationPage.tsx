import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

import Chat from "../components/Chat";
import StatusActions from "../components/StatusActions";
import { useAuth } from "../contexts/AuthContext";
import { useApplication, useChatItems } from "../storage/hooks";
import { markApplicationNotificationsRead } from "../storage/notifications";
import { formatDate } from "../utils/format";

function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { initialized, user } = useAuth();
  const application = useApplication(id);
  const items = useChatItems(application?.id ?? "");

  const userId = user?.id;
  const isAdmin = !!user && user.roles.includes("admin");
  const applicationId = application?.id;
  const itemsCount = items.length;

  useEffect(() => {
    if (userId && applicationId) {
      markApplicationNotificationsRead({ id: userId, isAdmin }, applicationId);
    }
  }, [userId, isAdmin, applicationId, itemsCount]);

  if (!initialized) return null;

  if (!application) {
    return (
      <div className="application-page">
        <p>Заявка не найдена</p>
        <Link to="/">На главную</Link>
      </div>
    );
  }

  return (
    <div className="application-page">
      <Link to="/">
        <FaArrowLeftLong size={11.5} /> Вернуться к заявкам
      </Link>

      <div className="application-info">
        <h1>{application.title}</h1>
        <span className="status" data-status={application.status}>
          {application.status}
        </span>
        <div className="info_meta">
          <p>
            <span>Проект: </span>
            {application.project}
          </p>
          <p>
            <span>Автор: </span>
            {application.authorName}
          </p>
          <p>
            <span>Создана: </span>
            {formatDate(application.date)}
          </p>
          <p>
            <span>№ </span>
            {application.id}
          </p>
        </div>
        <StatusActions application={application} />
      </div>

      <Chat key={application.id} application={application} />
    </div>
  );
}

export default ApplicationPage;