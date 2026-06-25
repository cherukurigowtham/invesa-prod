/**
 * shared/lib/api/index.ts
 * Barrel file — merges all sub-modules into the legacy `apiService` façade
 * so every existing import of `{ apiService }` from `'../shared/lib/api'`
 * continues to work without modification.
 *
 * New code should import directly from the specific sub-modules:
 *   import { authApi } from '@/shared/lib/api/authApi';
 */

// ── Re-export all types ──────────────────────────────────────────────────────
export type {
  UserRole,
  User,
  TeamMember,
  JoinRequest,
  InvestorInterest,
  Idea,
  IdeaAnalysis,
  IdeaPost,
  SavedSimulation,
  BuilderMatch,
  IdeaMatch,
  MatchmakerRes,
  ChatMessage,
  Conversation,
  L2ProofReceipt,
  QueuedSyncAction,
  Task,
} from './types';

// ── Re-export utilities ──────────────────────────────────────────────────────
export { getSyncQueue, saveSyncQueue, queueAction } from './storage';
export { getL2Details } from './l2';

// ── Re-export sub-APIs individually for new consumers ────────────────────────
export { authApi }        from './authApi';
export { ideasApi }       from './ideasApi';
export { analysisApi }    from './analysisApi';
export { postsApi }       from './postsApi';
export { matchmakerApi }  from './matchmakerApi';
export { simulationsApi } from './simulationsApi';
export { chatApi }        from './chatApi';
export { tasksApi }       from './tasksApi';

// ── Legacy façade ─────────────────────────────────────────────────────────────
// Keeps the monolithic `apiService` surface for every existing consumer file.
import { authApi }        from './authApi';
import { ideasApi }       from './ideasApi';
import { analysisApi }    from './analysisApi';
import { postsApi }       from './postsApi';
import { matchmakerApi }  from './matchmakerApi';
import { simulationsApi } from './simulationsApi';
import { chatApi }        from './chatApi';
import { tasksApi }       from './tasksApi';

export const apiService = {
  // Auth
  register:         authApi.register.bind(authApi),
  login:            authApi.login.bind(authApi),
  forgotPassword:   authApi.forgotPassword.bind(authApi),
  resetPassword:    authApi.resetPassword.bind(authApi),
  getCurrentUser:   authApi.getCurrentUser.bind(authApi),
  updateProfile:    authApi.updateProfile.bind(authApi),
  logout:           authApi.logout.bind(authApi),
  checkEmailPasskeyStatus: authApi.checkEmailPasskeyStatus.bind(authApi),
  registerPasskey:  authApi.registerPasskey.bind(authApi),
  removePasskey:    authApi.removePasskey.bind(authApi),

  // Ideas
  getIdeas:          ideasApi.getIdeas.bind(ideasApi),
  getIdeaById:       ideasApi.getIdeaById.bind(ideasApi),
  createIdea:        ideasApi.createIdea.bind(ideasApi),
  requestToJoin:     ideasApi.requestToJoin.bind(ideasApi),
  expressInterest:   ideasApi.expressInterest.bind(ideasApi),
  handleJoinRequest: ideasApi.handleJoinRequest.bind(ideasApi),
  getDashboardData:  ideasApi.getDashboardData.bind(ideasApi),
  getUserProfile:    ideasApi.getUserProfile.bind(ideasApi),

  // Analysis
  getIdeaAnalysis: analysisApi.getIdeaAnalysis.bind(analysisApi),
  analyzeIdea:     analysisApi.analyzeIdea.bind(analysisApi),

  // Posts / Feed
  getPosts:    postsApi.getPosts.bind(postsApi),
  createPost:  postsApi.createPost.bind(postsApi),
  likePost:    postsApi.likePost.bind(postsApi),

  // Matchmaker
  getMatchmaker: matchmakerApi.getMatchmaker.bind(matchmakerApi),

  // Simulations
  saveSimulation:       simulationsApi.saveSimulation.bind(simulationsApi),
  getSimulations:       simulationsApi.getSimulations.bind(simulationsApi),
  getSimulationByIdea:  simulationsApi.getSimulationByIdea.bind(simulationsApi),
  deleteSimulation:     simulationsApi.deleteSimulation.bind(simulationsApi),

  getChatConversations: chatApi.getChatConversations.bind(chatApi),
  getChatHistory:       chatApi.getChatHistory.bind(chatApi),
  getWebSocketUrl:      chatApi.getWebSocketUrl.bind(chatApi),
  getTeamMeetings:      chatApi.getTeamMeetings.bind(chatApi),
  getTasks:             tasksApi.getTasks.bind(tasksApi),
  createTask:           tasksApi.createTask.bind(tasksApi),
  updateTask:           tasksApi.updateTask.bind(tasksApi),
  deleteTask:           tasksApi.deleteTask.bind(tasksApi),
};
