export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type UserSummary = {
  id: string;
  name: string;
  role: string;
};

export type Idea = {
  id: string;
  title: string;
  summary: string;
  category: string;
  stage: string;
  tags: string[];
  createdAt: string;
  author: UserSummary;
  interestCount: number;
  isOwner: boolean;
  hasExpressedInterest: boolean;
  conversationId?: string;
};

export type Message = {
  id: string;
  sender: UserSummary;
  content: string;
  sentAt: string;
};

export type Conversation = {
  id: string;
  ideaId: string;
  ideaTitle: string;
  owner: UserSummary;
  interestedUser: UserSummary;
  messages: Message[];
  updatedAt: string;
};

export type NewIdeaInput = {
  title: string;
  summary: string;
  category: string;
  stage: string;
  tags: string[];
};

export type RegisterInput = {
  name: string;
  email: string;
  role: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
