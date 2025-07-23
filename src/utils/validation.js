/**
 * Validation utility functions
 */

import { SESSION_CONFIG } from '../constants';

/**
 * Validate session duration
 * @param {number} duration - Duration in minutes
 * @returns {boolean} Is valid
 */
export function validateSessionDuration(duration) {
  return (
    duration &&
    duration >= SESSION_CONFIG.MIN_DURATION &&
    duration <= SESSION_CONFIG.MAX_DURATION
  );
}

/**
 * Validate candidates selection
 * @param {Array} candidates - Array of candidate UIDs
 * @returns {boolean} Is valid
 */
export function validateCandidates(candidates) {
  return (
    candidates &&
    Array.isArray(candidates) &&
    candidates.length >= SESSION_CONFIG.MIN_CANDIDATES &&
    candidates.length <= SESSION_CONFIG.MAX_CANDIDATES
  );
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
 * @param {Array} candidates - Array of candidate UIDs
 * @param {Object} votes - Votes object
 * @param {Array} users - All users
 * @returns {Object} Voting eligibility result
 */
export function checkVotingEligibility(uid, candidates, votes, users) {
  const user = users.find(u => u.uid === uid);
  
  if (!user) {
    return { canVote: false, reason: 'User not found' };
  }

  if (candidates.includes(uid)) {
    return { canVote: false, reason: 'Candidates cannot vote' };
  }

  if (votes[uid]) {
    return { canVote: false, reason: 'User has already voted' };
  }

  return { canVote: true, reason: null };
}
