"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { ChatMessageView } from "@/lib/net/types";

interface RoomChatProps {
  messages: ChatMessageView[];
  onSend: (text: string) => void;
  myName?: string;
}

export function RoomChat({ messages, onSend, myName }: RoomChatProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <div className="flex h-48 flex-col rounded-2xl border border-void-line bg-void-panel">
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
        {messages.length === 0 && <p className="text-xs text-parchment/30">Sin mensajes todavía.</p>}
        {messages.map((m, i) => (
          <p key={i} className="text-xs leading-relaxed">
            <span className={`font-semibold ${m.name === myName ? "text-gold-bright" : "text-ember-bright"}`}>
              {m.name}:
            </span>{" "}
            <span className="text-parchment/80">{m.text}</span>
          </p>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-void-line p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
          maxLength={300}
          className="flex-1 rounded-lg border border-void-line bg-void px-2 py-1.5 text-xs text-parchment outline-none focus:border-gold/60"
        />
        <button type="submit" className="rounded-lg bg-ember px-3 text-xs font-semibold text-white">
          Enviar
        </button>
      </form>
    </div>
  );
}
