import { Link } from "react-router-dom";
import { FaRegUser } from "react-icons/fa";
import { IoChatbubbleOutline } from "react-icons/io5";
import type { Application } from "../types/types";
import { formatDate, formatDateTime } from "../utils/format";

function ApplicationCard({ item }: { item: Application }) {
  return (
    <Link to={`/applications/${item.id}`}>
      <div>
        <h1>{item.title}</h1>

        <div className="card_meta">
          <span className="project_chip">{item.project}</span>
          <span>
            <FaRegUser size={12} /> {item.authorName}
          </span>
          <span>Создана {formatDate(item.date)}</span>
        </div>

        <div className="card_stats">
          <span className="card_count">
            <IoChatbubbleOutline size={16} /> {item.messagesCount}
          </span>
          <span>
            {item.lastMessageAt
              ? `Последнее сообщение: ${formatDateTime(item.lastMessageAt)}`
              : "Сообщений пока нет"}
          </span>
        </div>

        <span className="status" data-status={item.status}>
          {item.status}
        </span>
      </div>
    </Link>
  );
}

export default ApplicationCard;