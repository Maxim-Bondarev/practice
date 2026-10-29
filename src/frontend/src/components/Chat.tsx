import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { GoPaperclip } from "react-icons/go";
import { VscSend } from "react-icons/vsc";
import { IoClose } from "react-icons/io5";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useChatItems } from "../storage/hooks";
import { addMessage, MAX_MESSAGE_LENGTH, newId } from "../storage/db";
import { deleteFile, MAX_FILE_SIZE, saveFile } from "../storage/file";
import type {
  Application,
  ChatAttachment,
  ChatMessage,
  StatusEvent,
} from "../types/types";
import { formatDateTime, formatMessageTime } from "../utils/format";
import Attachment from "./Attachment";

interface ChatProps {
  application: Application;
}

function StatusLine({ item }: { item: StatusEvent }) {
  if (item.previousStatus === undefined) {
    return (
      <div className="timeline_event">
        Заявка открыта: {formatDateTime(item.createdAt)}
      </div>
    );
  }

  return (
    <div className="timeline_event">
      <span>{item.authorName} изменил(а) статус</span>
      <span className="status_pill" data-status={item.previousStatus}>
        {item.previousStatus}
      </span>
      <span>→</span>
      <span className="status_pill" data-status={item.status}>
        {item.status}
      </span>
      <span className="timeline_time">{formatDateTime(item.createdAt)}</span>
    </div>
  );
}

function MessageBubble({
  message,
  own,
}: {
  message: ChatMessage;
  own: boolean;
}) {
  return (
    <div className={own ? "message own" : "message"}>
      <span className="message_author">
        {message.isAdmin ? `Поддержка · ${message.authorName}` : message.authorName}
      </span>
      {message.text && <p className="message_text">{message.text}</p>}
      {message.attachment && <Attachment attachment={message.attachment} />}
      <span className="message_time">{formatMessageTime(message.createdAt)}</span>
    </div>
  );
}


function Chat({ application }: ChatProps) {
  const { user, authenticated } = useAuth();
  const items = useChatItems(application.id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const isAdmin = !!user && user.roles.includes("admin");
  const canWrite = !!user && (isAdmin || user.id === application.authorId);
  const hasMessages = items.some((i) => i.type === "message");

  
  useEffect(() => {
    const win = windowRef.current;
    const content = contentRef.current;
    if (!win || !content) return;

    const toBottom = () => {
      if (stickToBottomRef.current) win.scrollTop = win.scrollHeight;
    };

    const observer = new ResizeObserver(toBottom);
    observer.observe(content);
    toBottom();
    return () => observer.disconnect();
  }, []);

  const handleScroll = () => {
    const win = windowRef.current;
    if (!win) return;
    stickToBottomRef.current =
      win.scrollHeight - win.scrollTop - win.clientHeight < 80;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = ""; 
    if (!picked) return;

    if (picked.size > MAX_FILE_SIZE) {
      toast.error(`Файл больше ${MAX_FILE_SIZE / 1024 / 1024} МБ`);
      return;
    }
    setFile(picked);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !canWrite || sending) return;
    if (!text.trim() && !file) return;

    setSending(true);
    try {
      let attachment: ChatAttachment | undefined;
      if (file) {
        const id = newId();
        await saveFile(id, file);
        attachment = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      }

      const saved = addMessage({
        applicationId: application.id,
        author: { id: user.id, name: user.username, isAdmin },
        text,
        attachment,
      });

      if (!saved) {
        if (attachment) await deleteFile(attachment.id).catch(() => {});
        toast.error("Не удалось отправить сообщение");
        return;
      }

      stickToBottomRef.current = true; 
      setText("");
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось сохранить файл");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat">
      <div className="window_chat" ref={windowRef} onScroll={handleScroll}>
        <div className="chat_content" ref={contentRef}>
          {items.map((item) =>
            item.type === "status" ? (
              <StatusLine key={item.id} item={item} />
            ) : (
              <MessageBubble
                key={item.id}
                message={item}
                own={!!user && item.authorId === user.id}
              />
            ),
          )}
          {!hasMessages && <p className="chat_empty">Сообщений пока нет</p>}
        </div>
      </div>

      {canWrite ? (
        <>
          {file && (
            <div className="attach_chip">
              <GoPaperclip size={16} />
              <span>{file.name}</span>
              <IoClose
                size={18}
                style={{ cursor: "pointer" }}
                onClick={() => setFile(null)}
              />
            </div>
          )}

          <form className="messagge_input" onSubmit={handleSubmit}>
            <input
              className="text_input"
              type="text"
              placeholder="Сообщение"
              value={text}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              type="button"
              className="icon_btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <GoPaperclip size={24} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <button
              type="submit"
              className="icon_btn send_btn"
              disabled={sending}
            >
              <VscSend size={24} />
            </button>
          </form>
        </>
      ) : (
        <p className="chat_readonly">
          {authenticated
            ? "Это чат чужой заявки — вы можете только читать переписку."
            : "Войдите в аккаунт, чтобы писать в чат своей заявки."}
        </p>
      )}
    </div>
  );
}

export default Chat;