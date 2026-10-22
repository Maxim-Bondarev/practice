import { useEffect, useState } from "react";
import { GoPaperclip } from "react-icons/go";
import { getFile } from "../storage/file";
import type { ChatAttachment } from "../types/types";

const PREVIEW_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

function Attachment({ attachment }: { attachment: ChatAttachment }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    getFile(attachment.id)
      .then((blob) => {
        if (cancelled) return;
        if (!blob) {
          setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  if (failed) return <p className="message_file">Файл недоступен</p>;
  if (!url) return <p className="message_file">Загрузка файла…</p>;

  if (PREVIEW_TYPES.has(attachment.type)) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img className="message_image" src={url} alt={attachment.name} />
      </a>
    );
  }

  return (
    <a className="message_file" href={url} download={attachment.name}>
      <GoPaperclip size={16} /> {attachment.name} ({formatSize(attachment.size)})
    </a>
  );
}

export default Attachment;