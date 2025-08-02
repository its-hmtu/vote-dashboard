/**
 * Utility functions for formatting data
 */

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
  
  // Extract voted user IDs from votes - handle multiple possible field names
  const votedUIDs = new Set();
  Object.values(votes).forEach(vote => {
    const userId = vote.userId || vote.uid || vote.user_id;
    if (userId) {
      votedUIDs.add(userId);
    }
  });
  
  // Filter users who haven't voted and aren't candidates
  // Handle both uid and id fields for users
  return users.filter((user) => {
    const userIdentifier = user.uid || user.id;
    return !candidateSet.has(userIdentifier) && !votedUIDs.has(userIdentifier);
  });
}

/**
 * Calculate candidate vote counts
 * @param {Object} votes - Votes object
 * @param {Array} candidates - Array of candidate UIDs in order
 * @returns {Object} Candidate vote counts
 */
export function calculateCandidateVotes(votes, candidates = []) {
  const counts = {};
  
  // Initialize counts for all candidates
  candidates.forEach(candidate => {
    counts[candidate] = 0;
  });
  
  Object.values(votes).forEach((vote) => {
    // Handle multiple possible vote field names from database
    const candidateKey = vote.candidate_uid || vote.vote || vote.candidate_choice || vote.candidateId;
    
    // Handle index-based votes (new system) - map index to candidate UID
    if (candidateKey && /^\d+$/.test(candidateKey.toString())) {
      const candidateIndex = parseInt(candidateKey) - 1; // Convert to 0-based index
      if (candidateIndex >= 0 && candidateIndex < candidates.length) {
        const actualCandidateUID = candidates[candidateIndex];
        counts[actualCandidateUID] = (counts[actualCandidateUID] || 0) + 1;
      }
    }
    // Handle direct UID votes (legacy system)
    else if (candidateKey && counts.hasOwnProperty(candidateKey)) {
      counts[candidateKey] = (counts[candidateKey] || 0) + 1;
    }
  });
  
  return counts;
}

/**
 * Generate choice letter for candidate (1, 2, 3, ...)
 * @param {Array} candidates - Array of candidate UIDs
 * @param {string} candidateUID - UID of the candidate
 * @returns {string} Choice number
 */
export function getChoiceLetter(candidates, candidateUID) {
  const index = candidates.indexOf(candidateUID);
  return index >= 0 ? (index + 1).toString() : "";
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

/**
 * Calculate detailed session results
 * @param {Object} session - Session data
 * @param {Object} votes - Votes for the session
 * @param {Array} users - All users
 * @returns {Object} Detailed session results
 */
export function calculateSessionResults(session, votes, users) {
  const totalEligibleUsers = users?.length || 0;
  const voteEntries = Object.values(votes || {});
  const sessionVotes = voteEntries.length;
  
  // Get users who voted - votes are keyed by user ID in Firebase
  // Example: votes = { "25087ABE": { candidate_uid: "2", timestamp: 1754176151 } }
  const votedUserIds = Object.keys(votes || {}); // User IDs are the keys
  const notVotedUsers = users?.filter(user => {
    const userIdentifier = user.uid || user.id;
    return !votedUserIds.includes(userIdentifier);
  }) || [];
  
  // Calculate participation rate - exclude candidates from eligible voters for elections
  let eligibleVoters = totalEligibleUsers;
  if (session.voteType === 'election') {
    const candidateCount = Object.keys(session.candidates || {}).length;
    eligibleVoters = Math.max(0, totalEligibleUsers - candidateCount);
  }
  
  const participationRate = eligibleVoters > 0 
    ? Math.round((sessionVotes / eligibleVoters) * 100) 
    : 0;

  const isElection = session.voteType === 'election';
  
  let results = {
    totalEligibleUsers,
    sessionVotes,
    notVotedUsers,
    participationRate,
    isElection,
    totalVotes: sessionVotes, // for backward compatibility
    candidateVotes: {},
    questionResults: {}
  };

  if (isElection) {
    // Calculate election results
    const candidateVotes = {};
    const candidates = Object.keys(session.candidates || {});
    
    // Initialize vote counts
    candidates.forEach(candidate => {
      candidateVotes[candidate] = 0;
    });
    
    // Count votes for each candidate - handle multiple field names
    voteEntries.forEach(vote => {
      const candidateKey = vote.candidate_uid || vote.vote || vote.candidate_choice || vote.candidateId;
      
      // Handle index-based votes (new system) - map index to candidate UID
      if (candidateKey && /^\d+$/.test(candidateKey.toString())) {
        const candidateIndex = parseInt(candidateKey) - 1; // Convert to 0-based index
        if (candidateIndex >= 0 && candidateIndex < candidates.length) {
          const actualCandidateUID = candidates[candidateIndex];
          candidateVotes[actualCandidateUID]++;
        }
      }
      // Handle direct UID votes (legacy system)
      else if (candidateKey && candidateVotes.hasOwnProperty(candidateKey)) {
        candidateVotes[candidateKey]++;
      }
    });
    
    results.candidateVotes = candidateVotes;
    
    // Find winner
    const maxVotes = Math.max(...Object.values(candidateVotes));
    const winners = Object.keys(candidateVotes).filter(candidate => candidateVotes[candidate] === maxVotes);
    results.winner = winners.length === 1 ? winners[0] : null;
    results.isTie = winners.length > 1;
    
  } else {
    // Calculate question results (Yes/No/Neutral)
    const questionResults = {
      yes: 0,
      no: 0,
      neutral: 0,
      YES: 0, // for backward compatibility
      NO: 0,
      NEUTRAL: 0
    };
    
    voteEntries.forEach(vote => {
      // Handle both choice and answer fields, and different case formats
      const voteValue = (vote.choice || vote.answer || vote.vote || '').toLowerCase();
      if (voteValue === 'agree' || voteValue === 'a') {
        questionResults.yes++;
        questionResults.YES++;
      } else if (voteValue === 'disagree' || voteValue === 'b') {
        questionResults.no++;
        questionResults.NO++;
      } else if (voteValue === 'neutral' || voteValue === 'c') {
        questionResults.neutral++;
        questionResults.NEUTRAL++;
      }
    });
    
    results.questionResults = questionResults;
    
    // Determine majority
    const totalResponses = questionResults.yes + questionResults.no + questionResults.neutral;
    if (totalResponses > 0) {
      results.majority = questionResults.yes > questionResults.no ? 'yes' : 
                        questionResults.no > questionResults.yes ? 'no' : 'tie';
      results.majorityPercentage = Math.round((Math.max(questionResults.yes, questionResults.no) / totalResponses) * 100);
    }
  }

  // Calculate participation rate (considering candidates can't vote in elections)
  if (session.voteType === 'election') {
    const candidates = Object.keys(session.candidates || {});
    const eligibleVoters = totalEligibleUsers - candidates.length;
    results.participationRate = eligibleVoters > 0 
      ? Math.round((sessionVotes / eligibleVoters) * 100)
      : 0;
  }
  
  return results;
}
