export const SOCKET_EVENTS = {
  // Connection/Status
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  USER_STATUS_CHANGED: "user-status-changed",

  // Sidebar / Chat List
  REQUEST_CHAT_LIST: "request-chat-list",
  RESPONSE_CHAT_LIST: "response-chat-list",

  // History
  REQUEST_CHAT_HISTORY: "request-chat-history",
  RESPONSE_MESSAGE_LIST: "response-message-list",

  // Messages
  SEND_MESSAGE: "send-message",
  RECEIVE_MESSAGE: "receive-message",
  MESSAGE_SENT_SUCCESS: "message-sent-success",
  SEND_MESSAGE_ERROR: "send-message-error",

  // Reading / Seen
  MARK_MESSAGE_READ: "mark-message-read",
  USER_READ_YOUR_MESSAGES: "user-read-your-messages",

  // Typing
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  USER_TYPING: "user-typing",
} as const;