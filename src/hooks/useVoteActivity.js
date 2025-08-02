import { useState, useEffect } from "react";
import { FirebaseService } from "../services/firebaseService";
import moment from "moment";

/**
 * Custom hook for managing real-time vote activity
 */
export function useVoteActivity(sessions, users, limit = 10) {
  const [voteActivity, setVoteActivity] = useState([]);

  useEffect(() => {
    if (!sessions || sessions.length === 0 || !users || users.length === 0) {
      setVoteActivity([]);
      return;
    }

    // Get the most recent sessions (last 3) to show activity from
    const recentSessions = sessions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 3);

    if (recentSessions.length === 0) {
      setVoteActivity([]);
      return;
    }

    const unsubscribers = [];
    const allActivity = [];

    // Listen to votes from recent sessions
    recentSessions.forEach((session) => {
      const unsubscribe = FirebaseService.listenToSessionVotes(
        session.sessionId,
        (votes) => {
          const sessionActivity = Object.entries(votes || {}).map(([userId, voteData]) => {
            const user = users.find(u => u.id === userId || u.uid === userId);
            const userName = user?.name || `User ${userId.slice(-4)}`;
            
            let voteDisplay = 'Unknown';
            if (session.voteType === 'election') {
              // For elections, show candidate name
              // Handle index-based votes (new system)
              const candidateKey = voteData.candidate_uid;
              if (candidateKey && /^\d+$/.test(candidateKey)) {
                const candidateIndex = parseInt(candidateKey) - 1; // Convert to 0-based index
                const candidates = Object.keys(session.candidates || {});
                if (candidateIndex >= 0 && candidateIndex < candidates.length) {
                  const actualCandidateUID = candidates[candidateIndex];
                  const candidate = users.find(u => u.id === actualCandidateUID || u.uid === actualCandidateUID);
                  voteDisplay = candidate?.name || actualCandidateUID || `Candidate ${candidateKey}`;
                } else {
                  voteDisplay = `Invalid choice: ${candidateKey}`;
                }
              } else {
                // Handle direct UID votes (legacy system)
                const candidate = users.find(u => u.id === candidateKey || u.uid === candidateKey);
                voteDisplay = candidate?.name || candidateKey || 'Unknown Candidate';
              }
            } else {
              // For questions, show the answer with proper formatting
              const answer = (voteData.choice || voteData.answer || voteData.vote || 'Unknown Response').toLowerCase();
              if (answer === 'agree' || answer === 'a') {
                voteDisplay = 'Agree';
              } else if (answer === 'disagree' || answer === 'b') {
                voteDisplay = 'Disagree';
              } else if (answer === 'neutral' || answer === 'c') {
                voteDisplay = 'Neutral';
              } else {
                voteDisplay = voteData.choice || voteData.answer || voteData.vote || 'Unknown Response';
              }
            }

            return {
              id: `${session.sessionId}_${userId}`,
              sessionId: session.sessionId,
              sessionType: session.voteType || 'election',
              voter: userName,
              candidate: voteDisplay,
              time: voteData.timestamp ? moment.unix(voteData.timestamp).fromNow() : 'Unknown time',
              timestamp: voteData.timestamp || moment(session.startTime).unix(),
              type: "vote",
            };
          });

          // Add session start activity
          const sessionStartActivity = {
            id: `session_start_${session.sessionId}`,
            sessionId: session.sessionId,
            sessionType: session.voteType || 'election',
            voter: "System",
            action: `${session.voteType === 'question' ? 'Question' : 'Election'} session started`,
            time: moment(session.startTime).fromNow(),
            timestamp: moment(session.startTime).unix(),
            type: "system",
          };

          // Update the activity array
          const currentIndex = allActivity.findIndex(act => act.sessionId === session.sessionId);
          if (currentIndex !== -1) {
            // Replace existing session activity
            allActivity.splice(currentIndex, 1, ...sessionActivity, sessionStartActivity);
          } else {
            // Add new session activity
            allActivity.push(...sessionActivity, sessionStartActivity);
          }

          // Sort by timestamp and limit results
          const sortedActivity = allActivity
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

          setVoteActivity(sortedActivity);
        }
      );

      unsubscribers.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [sessions, users, limit]);

  return voteActivity;
}
