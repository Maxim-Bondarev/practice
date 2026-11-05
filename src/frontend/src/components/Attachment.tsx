import { GoPaperclip } from "react-icons/go";
import { fileUrl } from "../api/client";
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
  const url = fileUrl(attachment.id);

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
