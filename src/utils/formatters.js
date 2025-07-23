/**
 * Utility functions for formatting data
 */

import { VOTE_CHOICES } from '../constants';

// Re-export time utilities for backward compatibility
export { formatSeconds, formatDuration } from './time';

/**
 * Calculate not voted users count
 * @param {Array} users - All users
 * @param {Array} candidateUIDs - UIDs of candidates
 * @param {Object} votes - Votes object
 * @returns {Array} Array of not voted users
 */
export function getNotVotedUsers(users, candidateUIDs, votes) {
  const candidateSet = new Set(candidateUIDs);
  const votedUIDs = new Set(Object.keys(votes));
  return users.filter(
    (u) => !candidateSet.has(u.uid) && !votedUIDs.has(u.uid)
  );
}

/**
 * Calculate candidate vote counts
 * @param {Object} votes - Votes object
 * @returns {Object} Candidate vote counts
 */
export function calculateCandidateVotes(votes) {
  const counts = {};
  Object.values(votes).forEach((vote) => {
    if (vote.candidate_uid) {
      counts[vote.candidate_uid] = (counts[vote.candidate_uid] || 0) + 1;
    }
  });
  return counts;
}

/**
 * Generate choice letter for candidate (A, B, C, D)
 * @param {Array} candidates - Array of candidate UIDs
 * @param {string} candidateUID - UID of the candidate
 * @returns {string} Choice letter
 */
export function getChoiceLetter(candidates, candidateUID) {
  const index = candidates.indexOf(candidateUID);
  return index >= 0 && index < VOTE_CHOICES.length ? VOTE_CHOICES[index] : "";
}

/**
 * Get candidate name with fallback to UID
 * @param {string} uid - Candidate UID
 * @param {Array} users - All users
 * @returns {string} Candidate name or UID
 */
export function getCandidateName(uid, users) {
  const user = users.find(u => u.uid === uid);
  return user ? user.name : uid;
}

/**
 * Format vote count with pluralization
 * @param {number} count - Vote count
 * @returns {string} Formatted vote count
 */
export function formatVoteCount(count) {
  return `${count} vote${count !== 1 ? 's' : ''}`;
}

/**
 * Sort sessions by status and date
 * @param {Array} sessions - Array of sessions
 * @returns {Array} Sorted sessions
 */
export function sortSessions(sessions) {
  return sessions?.slice()?.sort((a, b) => {
    // Active sessions first
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    
    // Then by start time (newest first)
    return new Date(b.start_time) - new Date(a.start_time);
  });
}
