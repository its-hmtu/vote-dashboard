/**
 * Advanced analytics utilities for vote dashboard
 */
import moment from 'moment';

/**
 * Calculate session efficiency metrics
 */
export function calculateSessionEfficiency(sessions) {
  return sessions.map(session => {
    const planned = session.duration || 0;
    const actual = session.actualDuration || planned;
    const efficiency = planned > 0 ? (actual / planned) * 100 : 100;
    
    return {
      ...session,
      efficiency: Math.min(efficiency, 200), // Cap at 200% for display
      timeVariance: actual - planned
    };
  });
}

/**
 * Analyze voting patterns by time of day
 */
export function analyzeVotingPatterns(sessions, votes) {
  const patterns = {
    hourly: new Array(24).fill(0),
    daily: new Array(7).fill(0),
    monthly: {}
  };

  Object.values(votes).forEach(sessionVotes => {
    Object.values(sessionVotes).forEach(vote => {
      if (vote.timestamp) {
        const time = moment.unix(vote.timestamp);
        patterns.hourly[time.hour()]++;
        patterns.daily[time.day()]++;
        
        const month = time.format('YYYY-MM');
        patterns.monthly[month] = (patterns.monthly[month] || 0) + 1;
      }
    });
  });

  return patterns;
}

/**
 * Calculate user engagement score
 */
export function calculateUserEngagement(users, sessions, votes) {
  return users.map(user => {
    let userVotes = 0;
    const voteTimes = [];
    
    // Count user votes across all sessions
    Object.entries(votes).forEach(([sessionId, sessionVotes]) => {
      // Check if user voted in this session (user ID is the key in sessionVotes)
      const userIdentifier = user.uid || user.id;
      if (sessionVotes[userIdentifier]) {
        userVotes++;
        
        // Calculate response time if timestamp exists
        const userVote = sessionVotes[userIdentifier];
        if (userVote.timestamp) {
          const session = sessions.find(s => s.sessionId === sessionId);
          if (session && session.start_time) {
            const startTime = typeof session.start_time === 'number' 
              ? session.start_time 
              : moment(session.start_time).unix();
            const responseTime = userVote.timestamp - startTime;
            if (responseTime > 0) {
              voteTimes.push(responseTime);
            }
          }
        }
      }
    });
    
    // Count eligible sessions (exclude sessions where user is a candidate)
    const eligibleSessions = sessions.filter(session => {
      if (session.voteType !== 'election') return true;
      const userIdentifier = user.uid || user.id;
      return !(session.candidates && session.candidates[userIdentifier]);
    }).filter(session => session.status === 'stopped' || session.status === 'completed').length;
    
    const participationRate = eligibleSessions > 0 ? (userVotes / eligibleSessions) * 100 : 0;
    
    const avgResponseTime = voteTimes.length > 0 
      ? voteTimes.reduce((sum, time) => sum + time, 0) / voteTimes.length 
      : 0;
    
    let engagementScore = participationRate;
    if (avgResponseTime > 0 && avgResponseTime < 300) { // Bonus for quick responses (5 minutes)
      engagementScore += 10;
    }
    
    return {
      ...user,
      participationRate,
      avgResponseTime,
      engagementScore: Math.min(engagementScore, 100),
      totalVotes: userVotes
    };
  }).sort((a, b) => b.engagementScore - a.engagementScore);
}

/**
 * Analyze candidate performance across elections
 */
export function analyzeCandidatePerformance(sessions, votes, users) {
  const candidateStats = {};
  
  sessions.filter(s => s.voteType === 'election').forEach(session => {
    const sessionVotes = votes[session.sessionId] || {};
    const candidates = Object.keys(session.candidates || {});
    const totalVotes = Object.keys(sessionVotes).length;
    
    candidates.forEach(candidateUid => {
      if (!candidateStats[candidateUid]) {
        candidateStats[candidateUid] = {
          uid: candidateUid,
          name: users.find(u => u.uid === candidateUid)?.name || candidateUid,
          timesCandidate: 0,
          timesWon: 0,
          totalVotesReceived: 0,
          averageVoteShare: 0,
          sessions: []
        };
      }
      
      candidateStats[candidateUid].timesCandidate++;
      
      // Count votes for this candidate - handle both index-based and UID-based votes
      let candidateVotes = 0;
      Object.values(sessionVotes).forEach(vote => {
        const candidateKey = vote.candidate_uid || vote.vote || vote.candidate_choice || vote.candidateId;
        
        // Handle index-based votes (new system) - map index to candidate UID
        if (candidateKey && /^\d+$/.test(candidateKey.toString())) {
          const candidateIndex = parseInt(candidateKey) - 1; // Convert to 0-based index
          if (candidateIndex >= 0 && candidateIndex < candidates.length) {
            const actualCandidateUID = candidates[candidateIndex];
            if (actualCandidateUID === candidateUid) {
              candidateVotes++;
            }
          }
        }
        // Handle direct UID votes (legacy system)
        else if (candidateKey === candidateUid) {
          candidateVotes++;
        }
      });
      
      candidateStats[candidateUid].totalVotesReceived += candidateVotes;
      const voteShare = totalVotes > 0 ? (candidateVotes / totalVotes) * 100 : 0;
      
      candidateStats[candidateUid].sessions.push({
        sessionId: session.sessionId,
        votes: candidateVotes,
        voteShare,
        totalVotes,
        won: false // Will be calculated below
      });
    });
    
    // Determine winners for this session
    const voteCounts = {};
    candidates.forEach(candidateUid => {
      voteCounts[candidateUid] = 0;
    });
    
    Object.values(sessionVotes).forEach(vote => {
      const candidateKey = vote.candidate_uid || vote.vote || vote.candidate_choice || vote.candidateId;
      
      if (candidateKey && /^\d+$/.test(candidateKey.toString())) {
        const candidateIndex = parseInt(candidateKey) - 1;
        if (candidateIndex >= 0 && candidateIndex < candidates.length) {
          const actualCandidateUID = candidates[candidateIndex];
          voteCounts[actualCandidateUID]++;
        }
      } else if (candidateKey && voteCounts.hasOwnProperty(candidateKey)) {
        voteCounts[candidateKey]++;
      }
    });
    
    const maxVotes = Math.max(...Object.values(voteCounts));
    const winners = Object.keys(voteCounts).filter(uid => voteCounts[uid] === maxVotes && maxVotes > 0);
    
    // Update win status
    candidates.forEach(candidateUid => {
      const sessionEntry = candidateStats[candidateUid].sessions.find(s => s.sessionId === session.sessionId);
      if (sessionEntry) {
        sessionEntry.won = winners.includes(candidateUid);
        if (sessionEntry.won) {
          candidateStats[candidateUid].timesWon++;
        }
      }
    });
  });
  
  // Calculate averages
  Object.values(candidateStats).forEach(candidate => {
    candidate.winRate = candidate.timesCandidate > 0 
      ? (candidate.timesWon / candidate.timesCandidate) * 100 
      : 0;
    candidate.averageVoteShare = candidate.sessions.length > 0
      ? candidate.sessions.reduce((sum, s) => sum + s.voteShare, 0) / candidate.sessions.length
      : 0;
  });
  
  return Object.values(candidateStats).sort((a, b) => b.winRate - a.winRate);
}

/**
 * Generate session performance insights
 */
export function generateSessionInsights(sessions, votes, users) {
  const insights = [];
  
  // Participation trends
  const recentSessions = sessions
    .filter(s => s.status === 'stopped')
    .sort((a, b) => moment(b.startTime).diff(moment(a.startTime)))
    .slice(0, 5);
  
  if (recentSessions.length >= 2) {
    const recent = recentSessions[0].participationRate || 0;
    const previous = recentSessions[1].participationRate || 0;
    const change = recent - previous;
    
    if (Math.abs(change) > 10) {
      insights.push({
        type: change > 0 ? 'positive' : 'negative',
        title: `Participation ${change > 0 ? 'Improved' : 'Declined'}`,
        description: `Latest session had ${Math.abs(change).toFixed(1)}% ${change > 0 ? 'higher' : 'lower'} participation than previous session`,
        value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
      });
    }
  }
  
  // Low participation sessions
  const lowParticipationSessions = sessions.filter(s => 
    s.status === 'stopped' && (s.participationRate || 0) < 50
  );
  
  if (lowParticipationSessions.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Participation Alert',
      description: `${lowParticipationSessions.length} sessions had less than 50% participation`,
      value: `${lowParticipationSessions.length} sessions`
    });
  }
  
  // Quick sessions (high efficiency)
  const quickSessions = sessions.filter(s => 
    s.status === 'stopped' && s.actualDuration && s.duration && 
    (s.actualDuration / s.duration) < 0.8
  );
  
  if (quickSessions.length > 0) {
    insights.push({
      type: 'positive',
      title: 'Efficient Sessions',
      description: `${quickSessions.length} sessions completed faster than planned`,
      value: `${quickSessions.length} sessions`
    });
  }
  
  return insights;
}

/**
 * Export session data for external analysis
 */
export function exportSessionData(sessions, votes, users, format = 'csv') {
  const data = sessions.map(session => {
    const sessionVotes = votes[session.sessionId] || {};
    const voteCount = Object.keys(sessionVotes).length;
    
    return {
      sessionId: session.sessionId,
      type: session.voteType || 'election',
      startTime: session.startTime,
      duration: session.duration,
      status: session.status,
      voteCount,
      participationRate: session.participationRate || 0,
      candidateCount: Object.keys(session.candidates || {}).length
    };
  });
  
  if (format === 'csv') {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }
  
  return data;
}
