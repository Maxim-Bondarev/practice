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
import { useChatMessages } from "../storage/hooks";
import { addMessage, MAX_MESSAGE_LENGTH } from "../storage/db";
import { deleteFile, MAX_FILE_SIZE, saveFile } from "../storage/file";
import type { Application, ChatAttachment } from "../types/types";
import Attachment from "./Attachment";

interface ChatProps {
  application: Application;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Chat({ application }: ChatProps) {
  const { user, authenticated } = useAuth();
  const messages = useChatMessages(application.id);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const isAdmin = !!user && user.roles.includes("admin");
  const canWrite = !!user && (isAdmin || user.id === application.authorId);

  useEffect(() => {
    const el = windowRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

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
        const id = crypto.randomUUID();
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
        authorId: user.id,
        authorName: user.username,
        isAdmin,
        text,
        attachment,
      });

      if (!saved) {
        if (attachment) await deleteFile(attachment.id).catch(() => {});
        toast.error("Не удалось отправить сообщение");
        return;
      }

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
      <div className="window_chat" ref={windowRef}>
        {messages.length === 0 && (
          <p className="chat_empty">Сообщений пока нет</p>
        )}
        {messages.map((m) => {
          const own = !!user && m.authorId === user.id;
          return (
            <div key={m.id} className={own ? "message own" : "message"}>
              <span className="message_author">
                {m.isAdmin ? `Поддержка · ${m.authorName}` : m.authorName}
              </span>
              {m.text && <p className="message_text">{m.text}</p>}
              {m.attachment && <Attachment attachment={m.attachment} />}
              <span className="message_time">{formatTime(m.createdAt)}</span>
            </div>
          );
        })}
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
              title="Выбрать файл"
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
              title="Отправить"
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
