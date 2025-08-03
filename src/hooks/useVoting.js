import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { FirebaseService } from "../services/firebaseService";
import { getNotVotedUsers, calculateCandidateVotes } from "../utils/formatters";
import { MESSAGES, VOTE_TYPES } from "../constants";

/**
 * Custom hook for managing users data
 * @deprecated Use useVotingContext instead for better state persistence across routes
 */
export function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToUsers(setUsers);
    return unsubscribe;
  }, []);

  const addUser = async (uid, name) => {
    try {
      await FirebaseService.createUser(uid, name);
      toast.success(MESSAGES.SUCCESS.USER_ADDED);
    } catch (error) {
      toast.error(`${MESSAGES.ERROR.USER_ADD_FAILED}: ${error.message}`);
    }
  };

  const removeUser = async (uid, name) => {
    try {
      await FirebaseService.removeUser(uid);
      toast.success(MESSAGES.SUCCESS.USER_REMOVED);
    } catch (error) {
      toast.error(`${MESSAGES.ERROR.USER_REMOVE_FAILED}: ${error.message}`);
    }
  };

  return { users, addUser, removeUser };
}

/**
 * Custom hook for managing sessions
 */
export function useSessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToSessions(setSessions);
    return unsubscribe;
  }, []);

  const removeSession = async (sessionId) => {
    try {
      await FirebaseService.removeSession(sessionId);
      toast.success(MESSAGES.SUCCESS.SESSION_REMOVED);
    } catch (error) {
      toast.error(`${MESSAGES.ERROR.SESSION_REMOVE_FAILED}: ${error.message}`);
    }
  };

  return { sessions, removeSession };
}

/**
 * Custom hook for managing voting sessions
 * @deprecated Use useVotingContext instead for better state persistence across routes
 */
export function useVotingSession(users) {
  const [votingActive, setVotingActive] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [sessionVoteCount, setSessionVoteCount] = useState(0);
  const [sessionCandidates, setSessionCandidates] = useState([]);
  const [candidateVotes, setCandidateVotes] = useState({});
  const [notVotedUserCount, setNotVotedUserCount] = useState(0);
  const [notVotedUserList, setNotVotedUserList] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const timerRef = useRef(null);

  // Listen to current session
  useEffect(() => {
    const unsubscribe = FirebaseService.listenToCurrentSession((sessionInfo) => {
      if (sessionInfo.active) {
        setVotingActive(true);
        setCurrentSessionId(sessionInfo.sessionId);
        if (sessionInfo.sessionData) {
          setSessionTimeLeft(sessionInfo.sessionData.duration);
        }
      } else {
        setVotingActive(false);
        setSessionTimeLeft(0);
        setCurrentSessionId(null);
      }
    });
    return unsubscribe;
  }, []);

  const stopVotingSession = useCallback(async () => {
    if (!votingActive || !currentSessionId) return;

    try {
      const notVotedUsers = getNotVotedUsers(users, sessionCandidates, {});
      await FirebaseService.stopVotingSession(
        currentSessionId,
        notVotedUsers.map((u) => u.uid)
      );
      setVotingActive(false);
      setSessionTimeLeft(0);
      setCurrentSessionId(null);
      toast.success(MESSAGES.SUCCESS.SESSION_STOPPED);
    } catch (error) {
      toast.error(`${MESSAGES.ERROR.SESSION_STOP_FAILED}: ${error.message}`);
    }
  }, [votingActive, currentSessionId, users, sessionCandidates]);

  // Timer effect
  useEffect(() => {
    if (votingActive && sessionTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSessionTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [votingActive, sessionTimeLeft]);

  // Handle session timeout
  useEffect(() => {
    if (sessionTimeLeft === 0 && votingActive && currentSessionId) {
      stopVotingSession();
    }
  }, [sessionTimeLeft, votingActive, currentSessionId, stopVotingSession]);

  // Listen to session data and votes when active
  useEffect(() => {
    if (!votingActive || !currentSessionId) return;

    const unsubscribeSession = FirebaseService.listenToSessionData(
      currentSessionId,
      (session) => {
        if (session.voteType === VOTE_TYPES.ELECTION) {
          const candidateUIDs = Object.keys(session.candidates || {});
          setSessionCandidates(candidateUIDs);
        } else {
          // For questions, we don't have candidates
          setSessionCandidates([]);
        }
      }
    );

    const unsubscribeVotes = FirebaseService.listenToSessionVotes(
      currentSessionId,
      (votes) => {
        setSessionVoteCount(Object.keys(votes).length);
        setCandidateVotes(calculateCandidateVotes(votes, sessionCandidates));
        
        // Calculate not voted users (only for election type)
        const notVotedUsers = getNotVotedUsers(users, sessionCandidates, votes);
        setNotVotedUserCount(notVotedUsers.length);
        setNotVotedUserList(notVotedUsers);
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeVotes();
    };
  }, [votingActive, currentSessionId, users, sessionCandidates]);

  const startVotingSession = async (sessionConfig) => {
    const { duration, voteType, candidates, questions } = sessionConfig;

    // Validate based on vote type
    if (voteType === VOTE_TYPES.ELECTION && (!candidates || candidates.length < 2)) {
      toast.error(MESSAGES.ERROR.MIN_CANDIDATES);
      return false;
    }

    if (voteType === VOTE_TYPES.QUESTION && (!questions || questions.length < 1)) {
      toast.error("At least one question is required");
      return false;
    }

    try {
      const result = await FirebaseService.startVotingSession(sessionConfig);
      setSessionTimeLeft(result.duration);
      setVotingActive(true);
      setCurrentSessionId(result.sessionId);
      
      const typeText = voteType === VOTE_TYPES.ELECTION ? "election" : "question";
      toast.success(`${MESSAGES.SUCCESS.SESSION_STARTED} (${typeText}) for ${duration} minutes`);
      return true;
    } catch (error) {
      toast.error(`${MESSAGES.ERROR.SESSION_START_FAILED}: ${error.message}`);
      return false;
    }
  };

  return {
    votingActive,
    sessionTimeLeft,
    sessionVoteCount,
    sessionCandidates,
    candidateVotes,
    notVotedUserCount,
    notVotedUserList,
    currentSessionId,
    startVotingSession,
    stopVotingSession,
  };
}

/**
 * Custom hook for card scanning
 */
export function useCardScanning() {
  const [waitingForCard, setWaitingForCard] = useState(false);

  const listenForCard = useCallback((onCardScanned) => {
    setWaitingForCard(true);
    
    const unsubscribe = FirebaseService.listenForCard((result) => {
      if (result.error) {
        toast.error(result.error);
        setWaitingForCard(false);
        return;
      }
      
      if (result.uid) {
        onCardScanned(result.uid);
        setWaitingForCard(false);
      }
    });

    return unsubscribe;
  }, []);

  const stopListening = useCallback(() => {
    setWaitingForCard(false);
  }, []);

  return { waitingForCard, listenForCard, stopListening };
}

/**
 * Custom hook for session details
 */
export function useSessionDetails() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [openSessionDetail, setOpenSessionDetail] = useState(false);
  const [detailSession, setDetailSession] = useState(null);
  const [detailCandidates, setDetailCandidates] = useState([]);
  const [detailCandidateVotes, setDetailCandidateVotes] = useState({});

  useEffect(() => {
    if (!openSessionDetail || !selectedSession) return;

    let currentCandidates = [];

    const unsubscribeSession = FirebaseService.listenToSessionData(
      selectedSession,
      (session) => {
        setDetailSession(session);
        currentCandidates = Object.keys(session.candidates || {});
        setDetailCandidates(currentCandidates);
      }
    );

    const unsubscribeVotes = FirebaseService.listenToSessionVotes(
      selectedSession,
      (votes) => {
        // Use the locally stored candidates array to avoid stale closure
        setDetailCandidateVotes(calculateCandidateVotes(votes, currentCandidates));
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeVotes();
    };
  }, [openSessionDetail, selectedSession]);

  const openDetails = useCallback((sessionId) => {
    setSelectedSession(sessionId);
    setOpenSessionDetail(true);
  }, []);

  const closeDetails = useCallback(() => {
    setOpenSessionDetail(false);
    setSelectedSession(null);
    setDetailSession(null);
    setDetailCandidates([]);
    setDetailCandidateVotes({});
  }, []);

  return {
    selectedSession,
    openSessionDetail,
    detailSession,
    detailCandidates,
    detailCandidateVotes,
    openDetails,
    closeDetails,
  };
}
