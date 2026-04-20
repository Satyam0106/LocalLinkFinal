import React from "react";

function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function ChatThread({
  title,
  subtitle,
  messages,
  draft,
  onDraftChange,
  onSend,
  sending,
  disabled,
  emptyLabel,
}) {
  return (
    <div className="card">
      <div className="title">{title}</div>
      {subtitle ? <div className="subtitle" style={{ marginTop: 6 }}>{subtitle}</div> : null}

      <div className="chat-thread">
        {messages.length === 0 ? (
          <div className="chat-empty">{emptyLabel}</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.isOwn ? "own" : ""}`}>
              <div className="chat-meta">
                <span>{message.sender?.name || "User"}</span>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <div>{message.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="chat-compose">
        <textarea
          className="input"
          rows="3"
          placeholder="Type your message"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onInput={(e) => onDraftChange(e.target.value)}
          disabled={false}
        />
        <button className="btn" type="button" onClick={onSend} disabled={disabled || sending || !draft.trim()}>
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
