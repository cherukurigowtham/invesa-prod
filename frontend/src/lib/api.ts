import type { Conversation, Idea, LoginInput, NewIdeaInput, RegisterInput, User } from "../types";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (typeof window !== "undefined" && window.location.port === "5173" ? "http://localhost:8080" : "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : typeof payload?.error === "string"
          ? payload.error
          : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  register: (payload: RegisterInput) =>
    request<{ user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload: LoginInput) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<{ ok: boolean }>("/api/auth/logout", {
      method: "POST"
    }),
  getSession: () => request<{ user: User | null }>("/api/auth/session"),
  listIdeas: () => request<{ ideas: Idea[] }>("/api/ideas"),
  createIdea: (payload: NewIdeaInput) =>
    request<{ idea: Idea }>("/api/ideas", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listConversations: () =>
    request<{ conversations: Conversation[] }>("/api/conversations"),
  sendInterest: (ideaId: string, payload: { message: string }) =>
    request<{ conversation: Conversation }>(`/api/ideas/${ideaId}/interest`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendMessage: (conversationId: string, payload: { content: string }) =>
    request<{ conversation: Conversation }>(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
