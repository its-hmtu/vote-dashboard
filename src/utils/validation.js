/**
 * Validation utility functions
 */

import { SESSION_CONFIG, VOTE_TYPES } from '../constants';

/**
 * Validate session duration
 * @param {number|string} duration - Duration in minutes
 * @returns {boolean} Is valid
 */
export function validateSessionDuration(duration) {
  const numDuration = Number(duration);
  return (
    !isNaN(numDuration) &&
    numDuration >= SESSION_CONFIG.MIN_DURATION &&
    numDuration <= SESSION_CONFIG.MAX_DURATION
  );
}

/**
 * Validate vote type
 * @param {string} voteType - Type of vote (election or question)
 * @returns {boolean} Is valid
 */
export function validateVoteType(voteType) {
  return Object.values(VOTE_TYPES).includes(voteType);
}

/**
 * Validate candidates selection (for election type)
 * @param {Array} candidates - Array of candidate UIDs
 * @returns {boolean} Is valid
 */
export function validateCandidates(candidates) {
  const config = SESSION_CONFIG.TYPES[VOTE_TYPES.ELECTION];
  return (
    candidates &&
    Array.isArray(candidates) &&
    candidates.length >= config.MIN_CANDIDATES &&
    candidates.length <= config.MAX_CANDIDATES
  );
}

/**
 * Validate questions (for question type)
 * @param {Array} questions - Array of question objects
 * @returns {boolean} Is valid
 */
export function validateQuestions(questions) {
  const config = SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION];
  return (
    questions &&
    Array.isArray(questions) &&
    questions.length >= config.MIN_QUESTIONS &&
    questions.length <= config.MAX_QUESTIONS &&
    questions.every(q => q.text && q.text.trim().length > 0)
  );
}

/**
 * Validate session configuration based on vote type
 * @param {string} voteType - Type of vote
 * @param {Array} items - Candidates for election or questions for question type
 * @returns {Object} Validation result
 */
export function validateSessionConfig(voteType, items) {
  const errors = [];

  if (!validateVoteType(voteType)) {
    errors.push('Invalid vote type');
    return { isValid: false, errors };
  }

  if (voteType === VOTE_TYPES.ELECTION) {
    if (!validateCandidates(items)) {
      const config = SESSION_CONFIG.TYPES[VOTE_TYPES.ELECTION];
      errors.push(`Please select ${config.MIN_CANDIDATES} to ${config.MAX_CANDIDATES} candidates`);
    }
  } else if (voteType === VOTE_TYPES.QUESTION) {
    if (!validateQuestions(items)) {
      const config = SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION];
      errors.push(`Please provide ${config.MIN_QUESTIONS} to ${config.MAX_QUESTIONS} valid questions`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user data
 * @param {string} uid - User UID
 * @param {string} name - User name
 * @returns {Object} Validation result
 */
export function validateUser(uid, name) {
  const errors = [];

  if (!uid || uid.trim().length === 0) {
    errors.push('UID is required');
  }

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (name && name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (name && name.trim().length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UID format
 * @param {string} uid - User UID
 * @returns {boolean} Is valid UID format
 */
export function validateUIDFormat(uid) {
  // Basic validation for card UID (should be alphanumeric)
  return /^[A-F0-9]+$/i.test(uid);
}

/**
 * Check if user can vote
 * @param {string} uid - User UID
 * @param {Object} session - Current session data
 * @param {Object} votes - Votes object
 * @param {Array} users - All users
 * @returns {Object} Voting eligibility result
 */
export function checkVotingEligibility(uid, session, votes, users) {
  const user = users.find(u => u.uid === uid);
  
  if (!user) {
    return { canVote: false, reason: 'User not found' };
  }

  // For election type, candidates cannot vote
  if (session.voteType === VOTE_TYPES.ELECTION && session.candidates && session.candidates.includes(uid)) {
    return { canVote: false, reason: 'Candidates cannot vote' };
  }

  if (votes[uid]) {
    return { canVote: false, reason: 'User has already voted' };
  }

  return { canVote: true, reason: null };
}

/**
 * Validate vote choice based on vote type
 * @param {string} voteType - Type of vote
 * @param {string|Array} choice - Vote choice(s)
 * @param {Object} session - Session configuration
 * @returns {Object} Validation result
 */
export function validateVoteChoice(voteType, choice, session) {
  const errors = [];

  if (!validateVoteType(voteType)) {
    errors.push('Invalid vote type');
    return { isValid: false, errors };
  }

  const config = SESSION_CONFIG.TYPES[voteType];

  if (voteType === VOTE_TYPES.ELECTION) {
    // For elections, choice should be one of the candidate IDs or predefined choices
    if (!choice) {
      errors.push('Please select a candidate');
    } else if (session.candidates && !session.candidates.includes(choice) && !config.CHOICES.includes(choice)) {
      errors.push('Invalid candidate selection');
    }
  } else if (voteType === VOTE_TYPES.QUESTION) {
    // For questions, choice should be YES or NO for each question
    if (!choice || !Array.isArray(choice)) {
      errors.push('Please answer all questions');
    } else if (session.questions && choice.length !== session.questions.length) {
      errors.push('Please answer all questions');
    } else if (!choice.every(c => config.CHOICES.includes(c))) {
      errors.push('Invalid answer choices');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
