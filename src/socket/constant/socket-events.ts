export const SOCKET_EVENTS = {
  // Connection/Status
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  USER_STATUS_CHANGED: "user-status-changed",

  // Sidebar / Chat List
  REQUEST_USER_LIST: "request-user-list",
  RESPONSE_USER_LIST: "response-user-list",

  // History
  REQUEST_MESSAGE_HISTORY: "request-message-history",
  RESPONSE_MESSAGE_LIST: "response-message-list",

  // Messages
  SEND_MESSAGE: "send-message",
  RECEIVE_MESSAGE: "receive-message",
  MESSAGE_SENT_SUCCESS: "message-sent-success",
  SEND_MESSAGE_ERROR: "send-message-error",

  // Reading / Seen
  MARK_MESSAGE_READ: "mark-message-read",
  MESSAGE_READ_SUCCESS: "message-read-success",

  // Typing
  TYPING_START: "typing-start",
  TYPING_STOP: "typing-stop",
  USER_TYPING: "user-typing",
} as const;