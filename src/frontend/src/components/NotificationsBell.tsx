import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotificationsOutline } from "react-icons/io5";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../storage/hooks";
import type { AppNotification } from "../types/types";
import { formatMessageTime } from "../utils/format";

const MAX_SHOWN = 30;

function describe(n: AppNotification): string {
  switch (n.kind) {
    case "application_created":
      return `Новая заявка от ${n.actorName}`;
    case "message_created": {
      const preview = n.text ? n.text.slice(0, 90) : "прикрепил(а) файл";
      return `${n.actorName}: ${preview}`;
    }
    case "status_changed":
      return `${n.actorName} изменил(а) статус: ${n.previousStatus} → ${n.status}`;
  }
}

function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const viewer = user
    ? { id: user.id, isAdmin: user.roles.includes("admin") }
    : null;
  const { list, unread, markRead, markAllRead } = useNotifications(viewer);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const openNotification = (n: AppNotification) => {
    markRead([n.id]);
    setOpen(false);
    navigate(`/applications/${n.applicationId}`);
  };

  return (
    <li className="bell" ref={rootRef}>
      <button
        type="button"
        className="bell_btn"
        aria-label="Уведомления"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IoNotificationsOutline size={23} />
        {unread > 0 && (
          <span className="bell_badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="bell_panel" role="dialog" aria-label="Уведомления">
          <div className="bell_head">
            <strong>Уведомления</strong>
            {unread > 0 && (
              <button type="button" className="bell_link" onClick={markAllRead}>
                Прочитать все
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <p className="bell_empty">Пока ничего нового</p>
          ) : (
            <div className="bell_list">
              {list.slice(0, MAX_SHOWN).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={n.read ? "bell_item" : "bell_item unread"}
                  onClick={() => openNotification(n)}
                >
                  <span className="bell_item_title">{n.applicationTitle}</span>
                  <span className="bell_item_text">{describe(n)}</span>
                  <span className="bell_item_time">
                    {formatMessageTime(n.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default NotificationsBell;