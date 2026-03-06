import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";
import type { Conversation, Idea, LoginInput, NewIdeaInput, RegisterInput, User } from "./types";

type AuthMode = "login" | "register";

const initialIdea: NewIdeaInput = {
  title: "",
  summary: "",
  category: "",
  stage: "",
  tags: []
};

const initialRegister: RegisterInput = {
  name: "",
  email: "",
  role: "",
  password: ""
};

const initialLogin: LoginInput = {
  email: "",
  password: ""
};

function InvesaLogo() {
  return (
    <svg viewBox="0 0 120 120" className="h-12 w-12 drop-shadow-[0_8px_30px_rgba(215,165,65,0.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="goldFade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5e6a6" />
          <stop offset="100%" stopColor="#cf9333" />
        </linearGradient>
        <linearGradient id="graphFade" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
      </defs>
      <rect x="12" y="68" width="14" height="28" rx="2" fill="url(#graphFade)" />
      <rect x="32" y="54" width="14" height="42" rx="2" fill="url(#graphFade)" />
      <rect x="52" y="39" width="14" height="57" rx="2" fill="url(#graphFade)" />
      <path
        d="M14 94C36 88 46 76 56 61C67 45 77 36 104 18L94 18L112 6L111 24L102 20C78 32 68 40 58 55C48 70 37 85 14 94Z"
        fill="url(#goldFade)"
      />
      <path d="M46 95H58V79L46 87V95Z" fill="#e1c36f" />
      <path d="M66 95H78V67L66 74V95Z" fill="#dca94b" />
      <path d="M86 95H98V53L86 62V95Z" fill="#c8892e" />
    </svg>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [ideaDraft, setIdeaDraft] = useState<NewIdeaInput>(initialIdea);
  const [interestDrafts, setInterestDrafts] = useState<Record<string, string>>({});
  const [messageDraft, setMessageDraft] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [registerForm, setRegisterForm] = useState<RegisterInput>(initialRegister);
  const [loginForm, setLoginForm] = useState<LoginInput>(initialLogin);
  const [status, setStatus] = useState("Loading Invesa...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshIdeas();
      void refreshConversations();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [user]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null,
    [conversations, selectedConversationId]
  );

  async function bootstrap() {
    try {
      const [sessionResult, ideasResult] = await Promise.all([api.getSession(), api.listIdeas()]);
      setUser(sessionResult.user);
      setIdeas(ideasResult.ideas);
      if (sessionResult.user) {
        const conversationsResult = await api.listConversations();
        setConversations(conversationsResult.conversations);
        setSelectedConversationId(conversationsResult.conversations[0]?.id ?? "");
        setStatus(`Signed in as ${sessionResult.user.name}`);
      } else {
        setStatus("Browse public ideas or sign in to post and chat.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load Invesa.");
    }
  }

  async function refreshIdeas() {
    const result = await api.listIdeas();
    setIdeas(result.ideas);
  }

  async function refreshConversations(activeUser?: User | null) {
    if (!(activeUser ?? user)) {
      return;
    }
    const result = await api.listConversations();
    setConversations(result.conversations);
    setSelectedConversationId((current) => current || result.conversations[0]?.id || "");
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.register(registerForm);
      setUser(result.user);
      setRegisterForm(initialRegister);
      await refreshIdeas();
      await refreshConversations(result.user);
      setStatus(`Welcome to Invesa, ${result.user.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await api.login(loginForm);
      setUser(result.user);
      setLoginForm(initialLogin);
      await refreshIdeas();
      await refreshConversations(result.user);
      setStatus(`Signed in as ${result.user.name}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await api.logout();
      setUser(null);
      setConversations([]);
      setSelectedConversationId("");
      await refreshIdeas();
      setStatus("Signed out.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Logout failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleIdeaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setStatus("Sign in to publish an idea.");
      return;
    }

    setBusy(true);
    try {
      const result = await api.createIdea(ideaDraft);
      setIdeas((current) => [result.idea, ...current]);
      setIdeaDraft(initialIdea);
      setStatus("Idea published to the public feed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to publish idea.");
    } finally {
      setBusy(false);
    }
  }

  async function handleInterestSubmit(ideaId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setStatus("Sign in to start a conversation.");
      return;
    }

    const message = interestDrafts[ideaId]?.trim();
    if (!message) {
      setStatus("Add an introduction before starting a chat.");
      return;
    }

    setBusy(true);
    try {
      const result = await api.sendInterest(ideaId, { message });
      setInterestDrafts((current) => ({ ...current, [ideaId]: "" }));
      setConversations((current) => [result.conversation, ...current.filter((item) => item.id !== result.conversation.id)]);
      setSelectedConversationId(result.conversation.id);
      await refreshIdeas();
      setStatus("Conversation opened.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to open conversation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversation || !messageDraft.trim()) {
      return;
    }

    setBusy(true);
    try {
      const result = await api.sendMessage(selectedConversation.id, { content: messageDraft.trim() });
      setConversations((current) => current.map((entry) => (entry.id === result.conversation.id ? result.conversation : entry)));
      setMessageDraft("");
      setStatus("Message sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative overflow-hidden text-stone-100">
      <div className="grid-fade absolute inset-0 opacity-30" />
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass rounded-[2rem] border border-white/10 px-6 py-5 shadow-glow">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <InvesaLogo />
              <div>
                <p className="font-display text-3xl uppercase tracking-[0.2em] text-sand">Invesa</p>
                <p className="max-w-xl text-sm text-stone-300">
                  Public startup ideas, visible to everyone. Private chats for the people serious enough to build with you.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatCard label="Ideas" value={String(ideas.length).padStart(2, "0")} />
              <StatCard label="Chats" value={String(conversations.length).padStart(2, "0")} />
              <StatCard label="Mode" value={user ? "Live" : "Guest"} />
              {user ? (
                <button
                  className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-gold/40"
                  onClick={handleLogout}
                  type="button"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_1.35fr_1fr]">
          <section className="glass rounded-[2rem] border border-white/10 p-6">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.35em] text-gold">{user ? "Founder studio" : "Access Invesa"}</p>
              <h1 className="mt-2 font-display text-3xl text-white">
                {user ? "Publish ideas and move the right people into chat." : "Create your account to publish, follow up, and close the loop."}
              </h1>
              <p className="mt-3 text-sm leading-7 text-stone-300">{status}</p>
            </div>

            {user ? (
              <form className="space-y-4" onSubmit={handleIdeaSubmit}>
                <Input label="Idea title" value={ideaDraft.title} onChange={(value) => setIdeaDraft((current) => ({ ...current, title: value }))} />
                <TextArea label="Summary" value={ideaDraft.summary} onChange={(value) => setIdeaDraft((current) => ({ ...current, summary: value }))} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Category" value={ideaDraft.category} onChange={(value) => setIdeaDraft((current) => ({ ...current, category: value }))} />
                  <Input label="Stage" value={ideaDraft.stage} onChange={(value) => setIdeaDraft((current) => ({ ...current, stage: value }))} />
                </div>
                <Input
                  label="Tags"
                  placeholder="fintech, ai, marketplace"
                  value={ideaDraft.tags.join(", ")}
                  onChange={(value) =>
                    setIdeaDraft((current) => ({
                      ...current,
                      tags: value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean)
                    }))
                  }
                />
                <button className="w-full rounded-full bg-gradient-to-r from-sand to-gold px-5 py-3 font-semibold text-stone-950 transition hover:scale-[1.01]" disabled={busy} type="submit">
                  Publish idea
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
                  <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${authMode === "register" ? "bg-sand text-stone-950" : "text-stone-300"}`}
                    onClick={() => setAuthMode("register")}
                    type="button"
                  >
                    Create account
                  </button>
                  <button
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${authMode === "login" ? "bg-sand text-stone-950" : "text-stone-300"}`}
                    onClick={() => setAuthMode("login")}
                    type="button"
                  >
                    Sign in
                  </button>
                </div>

                {authMode === "register" ? (
                  <form className="space-y-4" onSubmit={handleRegister}>
                    <Input label="Name" value={registerForm.name} onChange={(value) => setRegisterForm((current) => ({ ...current, name: value }))} />
                    <Input label="Email" type="email" value={registerForm.email} onChange={(value) => setRegisterForm((current) => ({ ...current, email: value }))} />
                    <Input label="Role" value={registerForm.role} onChange={(value) => setRegisterForm((current) => ({ ...current, role: value }))} />
                    <Input
                      label="Password"
                      type="password"
                      value={registerForm.password}
                      onChange={(value) => setRegisterForm((current) => ({ ...current, password: value }))}
                    />
                    <button className="w-full rounded-full bg-gradient-to-r from-sand to-gold px-5 py-3 font-semibold text-stone-950 transition hover:scale-[1.01]" disabled={busy} type="submit">
                      Create account
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleLogin}>
                    <Input label="Email" type="email" value={loginForm.email} onChange={(value) => setLoginForm((current) => ({ ...current, email: value }))} />
                    <Input
                      label="Password"
                      type="password"
                      value={loginForm.password}
                      onChange={(value) => setLoginForm((current) => ({ ...current, password: value }))}
                    />
                    <button className="w-full rounded-full bg-gradient-to-r from-sand to-gold px-5 py-3 font-semibold text-stone-950 transition hover:scale-[1.01]" disabled={busy} type="submit">
                      Sign in
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4">
            {ideas.map((idea) => (
              <article key={idea.id} className="glass rounded-[2rem] border border-white/10 p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.25em] text-stone-400">
                  <span>{idea.category}</span>
                  <span className="text-gold">•</span>
                  <span>{idea.stage}</span>
                  <span className="text-gold">•</span>
                  <span>{formatDate(idea.createdAt)}</span>
                </div>
                <h2 className="mt-3 font-display text-2xl text-white">{idea.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-300">{idea.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-gold/30 px-3 py-1 text-xs text-sand">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{idea.author.name}</p>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{idea.author.role}</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-300">{idea.interestCount} interested</div>
                </div>

                {idea.isOwner ? (
                  <div className="mt-6 rounded-3xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-sand">You posted this idea.</div>
                ) : idea.hasExpressedInterest ? (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
                    You already opened a conversation for this idea.
                  </div>
                ) : (
                  <form className="mt-6 grid gap-3 border-t border-white/10 pt-5" onSubmit={(event) => handleInterestSubmit(idea.id, event)}>
                    <TextArea
                      label={user ? "Why are you interested?" : "Sign in to chat"}
                      value={interestDrafts[idea.id] ?? ""}
                      onChange={(value) => setInterestDrafts((current) => ({ ...current, [idea.id]: value }))}
                      placeholder={user ? "Share what you can contribute, validate, or build." : "Create an account to start a private chat."}
                      disabled={!user}
                    />
                    <button className="rounded-full border border-gold/40 px-4 py-3 text-sm font-semibold text-sand transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={!user || busy} type="submit">
                      Start chat with founder
                    </button>
                  </form>
                )}
              </article>
            ))}
          </section>

          <section className="glass rounded-[2rem] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-gold">Inbox</p>
                <h2 className="mt-2 font-display text-2xl text-white">Conversations</h2>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-300">{conversations.length} threads</div>
            </div>

            {!user ? (
              <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-stone-400">
                Sign in to manage your private chat threads with founders and interested collaborators.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3">
                  {conversations.map((conversation) => {
                    const counterparty = conversation.owner.id === user.id ? conversation.interestedUser : conversation.owner;
                    return (
                      <button
                        key={conversation.id}
                        className={`rounded-3xl border px-4 py-4 text-left transition ${
                          conversation.id === selectedConversation?.id ? "border-gold/60 bg-gold/10" : "border-white/10 hover:border-white/20"
                        }`}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        type="button"
                      >
                        <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{conversation.ideaTitle}</p>
                        <p className="mt-1 font-semibold text-white">{counterparty.name}</p>
                        <p className="text-sm text-stone-300">{counterparty.role}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedConversation ? (
                  <div className="mt-6">
                    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-gold">{selectedConversation.ideaTitle}</p>
                      <div className="mt-4 space-y-3">
                        {selectedConversation.messages.map((message) => (
                          <div key={message.id} className="rounded-2xl border border-white/10 p-3">
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold text-white">{message.sender.name}</p>
                              <p className="text-xs text-stone-400">{formatDate(message.sentAt)}</p>
                            </div>
                            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-stone-500">{message.sender.role}</p>
                            <p className="mt-2 text-sm leading-6 text-stone-300">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form className="mt-4 grid gap-3" onSubmit={handleMessageSubmit}>
                      <TextArea label="Reply" value={messageDraft} onChange={setMessageDraft} placeholder="Keep the conversation moving." />
                      <button className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-stone-950 transition hover:bg-sand disabled:opacity-60" disabled={busy} type="submit">
                        Send message
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="mt-6 rounded-[1.5rem] border border-dashed border-white/15 p-6 text-sm text-stone-400">
                    No conversations yet. Start by messaging an idea owner from the public feed.
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</p>
      <p className="mt-2 font-display text-2xl text-white">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <input
        className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-gold/50"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.25em] text-stone-400">{label}</span>
      <textarea
        className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
