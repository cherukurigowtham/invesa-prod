/**
 * shared/lib/api/types.ts
 * All TypeScript interfaces and type aliases for the Invesa platform.
 */

export type UserRole = 'founder' | 'builder' | 'investor';

export interface UserPreferences {
  stageFocus?: string[];
  hiringRoles?: string[];
  availability?: string;
  sectors?: string[];
  density?: 'spacious' | 'compact';
  notifyMatches?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bio?: string;
  skills?: string[];
  linkedin?: string;
  preferences?: UserPreferences;
  createdAt: string;
  password_hash?: string;
  recovery_key_hash?: string;
  passkeyRegistered?: boolean;
  passkeyCredentialId?: string;
  passkeyPublicKey?: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  roleTitle: string;
  joinedAt: string;
}

export interface JoinRequest {
  id: string;
  ideaId: string;
  builderId: string;
  builderName: string;
  builderSkills: string[];
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface InvestorInterest {
  id: string;
  ideaId: string;
  investorId: string;
  investorName: string;
  note: string;
  createdAt: string;
}

export interface Idea {
  id: string;
  founderId: string;
  founderName: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  stage: 'Idea' | 'Prototype' | 'MVP' | 'Scaling';
  teamSlots: string[];
  ipHash: string;
  createdAt: string;
  teamMembers: TeamMember[];
  joinRequests: JoinRequest[];
  investorInterests: InvestorInterest[];
}

export interface IdeaAnalysis {
  id: string;
  ideaId: string;
  overallScore: number;
  marketFitRating: number;
  viabilityRating: number;
  innovationRating: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  recommendations: string;
  createdAt: string;
}

export interface IdeaPost {
  id: string;
  ideaId: string;
  ideaTitle: string;
  authorId: string;
  authorName: string;
  postType: 'update' | 'milestone' | 'media' | 'announcement';
  content: string;
  mediaUrl?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface SavedSimulation {
  id: string;
  userId: string;
  ideaId?: string;
  title: string;
  preMoneyValuation: number;
  raiseAmount: number;
  optionPoolPercent: number;
  coFounderPercent: number;
  seriesAValuation: number;
  seriesARaise: number;
  seriesAOptionPool: number;
  vestingMonths?: number;
  antiDilutionType?: string;
  redistributeUnvested?: boolean;
  createdAt: string;
}

export interface BuilderMatch {
  builder: User;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

export interface IdeaMatch {
  idea: Idea;
  founderName: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

export interface MatchmakerRes {
  builderMatches: BuilderMatch[] | null;
  ideaMatches: IdeaMatch[] | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
}

export interface Conversation {
  userId: string;
  name: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface L2ProofReceipt {
  txHash: string;
  blockNumber: number;
  network: string;
  gasUsed: number;
  timestamp: string;
}

export interface QueuedSyncAction {
  id: string;
  action:
    | 'like_post'
    | 'create_post'
    | 'create_idea'
    | 'express_interest'
    | 'request_to_join'
    | 'save_simulation'
    | 'delete_simulation'
    | 'send_chat_message';
  payload: any;
  createdAt: string;
}



export interface Task {
  id: string;
  ideaId: string;
  title: string;
  description: string;
  status: string; // 'todo' | 'in_progress' | 'review' | 'done'
  assigneeId?: string | null;
  creatorId: string;
  dueDate?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

