export type MemberName = { id: string; full_name: string };

export type Conversation = {
  id: string;
  type: "direct" | "group" | "broadcast";
  name: string;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
};
