import React, { useRef } from "react";
import { GoPaperclip } from "react-icons/go";
import { VscSend } from "react-icons/vsc";

function Chat() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="chat">
      <div className="window_chat"></div>

      <div className="messagge_input">
        <input className="text_input" type="text" placeholder="Сообщение" />

        <button
          type="button"
          className="icon_btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <GoPaperclip size={24} />
        </button>

        <input ref={fileInputRef} type="file" style={{ display: "none" }} />

        <button type="submit" className="icon_btn send_btn">
          <VscSend size={24} />
        </button>
      </div>
    </div>
  );
}

export default Chat;
