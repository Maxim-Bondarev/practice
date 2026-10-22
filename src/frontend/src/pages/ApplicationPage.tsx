import { useParams, Link } from "react-router-dom";
import { FaArrowLeftLong } from "react-icons/fa6";

import Chat from "../components/Chat";
import { useAuth } from "../contexts/AuthContext";
import { useApplication } from "../storage/hooks";

function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { initialized, user } = useAuth();
  const application = useApplication(id);

  if (!initialized) return null;

  const hidden =
    application?.status === "На модерации" &&
    user?.id !== application.authorId &&
    !user?.roles.includes("admin");

  if (!application || hidden) {
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
        <span className="status">{application.status}</span>
        <p>
          <span>Проект: </span>
          {application.project}
        </p>
        <p>
          <span>Создана: </span>
          {application.date.toLocaleDateString()}
        </p>
      </div>
      <Chat key={application.id} application={application} />
    </div>
  );
}

export default ApplicationPage;