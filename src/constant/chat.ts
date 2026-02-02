export const CHAT_TYPES = {
  INDIVIDUAL: 1,
  GROUP: 2,
} as const;

export const MESSAGE_TYPES = {
  TEXT: 1,
  IMAGE: 2,
  FILE: 3,
  VIDEO: 4,
  AUDIO: 5,
  SYSTEM: 6,
} as const;

// Create types for your interfaces
export type ChatType = typeof CHAT_TYPES[keyof typeof CHAT_TYPES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];