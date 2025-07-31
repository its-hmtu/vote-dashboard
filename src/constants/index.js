/**
 * Application constants
 */

// Vote types
export const VOTE_TYPES = {
  ELECTION: 'election',
  QUESTION: 'question',
};

// Session configuration
export const SESSION_CONFIG = {
  MIN_DURATION: 1, // minutes
  MAX_DURATION: 120, // minutes
  MIN_CANDIDATES: 2,
  MAX_CANDIDATES: 4,
  MIN_QUESTIONS: 1,
  MAX_QUESTIONS: 10,
  TYPES: {
    [VOTE_TYPES.ELECTION]: {
      MIN_CANDIDATES: 2,
      MAX_CANDIDATES: 4,
      CHOICES: ['A', 'B', 'C', 'D'], // Candidate choices
    },
    [VOTE_TYPES.QUESTION]: {
      MIN_QUESTIONS: 1,
      MAX_QUESTIONS: 10,
      CHOICES: ['YES', 'NO'], // Yes/No questions
    },
  },
};

// Vote choices
export const VOTE_CHOICES = ['A', 'B', 'C', 'D'];

// Firebase paths
export const FIREBASE_PATHS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  VOTES: 'votes',
  CONFIG: 'config',
  MODE: 'mode',
  NEW_USER: 'new_user',
  CURRENT_SESSION: 'config/current_session',
  CREATE_MODE: 'mode/create',
  VOTE_MODE: 'mode/vote',
};

// Session status
export const SESSION_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped',
  COMPLETED: 'completed',
};

// Component sizes and limits
export const UI_CONFIG = {
  SESSION_HISTORY_PAGE_SIZE: 50,
  MODAL_WIDTH: 1200,
  SESSION_CONTROL_MODAL_WIDTH: 600,
  CARD_TIMEOUT: 20000, // 20 seconds
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss',
  STORAGE: 'YYYY-MM-DD HH:mm:ss',
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    USER_ADDED: 'User added successfully',
    USER_UPDATED: 'User updated successfully',
    USER_REMOVED: 'User removed successfully',
    SESSION_STARTED: 'Voting session started',
    SESSION_STOPPED: 'Voting session stopped',
    SESSION_REMOVED: 'Session removed',
  },
  ERROR: {
    USER_ADD_FAILED: 'Failed to add user',
    USER_REMOVE_FAILED: 'Failed to remove user',
    USER_UPDATE_FAILED: 'Failed to update user',
    SESSION_START_FAILED: 'Failed to start session',
    SESSION_STOP_FAILED: 'Failed to stop session',
    SESSION_REMOVE_FAILED: 'Failed to remove session',
    CARD_ALREADY_REGISTERED: 'This card is already registered',
    MIN_CANDIDATES: 'You must select at least 2 candidates to start voting',
  },
  CONFIRMATION: {
    REMOVE_USER: 'Are you sure you want to remove this user?',
    REMOVE_SESSION: 'Are you sure you want to remove this session and all its votes?',
  },
};
