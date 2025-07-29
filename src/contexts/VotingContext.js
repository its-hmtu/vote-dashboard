import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import { FirebaseService } from "../services/firebaseService";
import { getNotVotedUsers, calculateCandidateVotes } from "../utils/formatters";
import { MESSAGES, VOTE_TYPES } from "../constants";

const VotingContext = createContext();

export const useVotingContext = () => {
  const context = useContext(VotingContext);
  if (!context) {
    throw new Error("useVotingContext must be used within a VotingProvider");
  }
  return context;
};

export const VotingProvider = ({ children }) => {
  const [votingActive, setVotingActive] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [sessionVoteCount, setSessionVoteCount] = useState(0);
  const [sessionCandidates, setSessionCandidates] = useState([]);
  const [candidateVotes, setCandidateVotes] = useState({});
  const [notVotedUserCount, setNotVotedUserCount] = useState(0);
  const [notVotedUserList, setNotVotedUserList] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentSessionType, setCurrentSessionType] = useState(null);
  const [users, setUsers] = useState([]);

  const timerRef = useRef(null);
  const sessionListenerRef = useRef(null);
  const votesListenerRef = useRef(null);
  const usersRef = useRef([]);
  const sessionCandidatesRef = useRef([]);

  // Keep refs updated
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    sessionCandidatesRef.current = sessionCandidates;
  }, [sessionCandidates]);

  // Listen to users data
  useEffect(() => {
    const unsubscribe = FirebaseService.listenToUsers(setUsers);
    return unsubscribe;
  }, []);

  // User management functions
  const addUser = async (uid, name) => {
    try {
      await FirebaseService.createUser(uid, name);
      message.success(MESSAGES.SUCCESS.USER_ADDED);
    } catch (error) {
      message.error(`${MESSAGES.ERROR.USER_ADD_FAILED}: ${error.message}`);
    }
  };

  const removeUser = async (uid, name) => {
    try {
      await FirebaseService.removeUser(uid);
      message.success(MESSAGES.SUCCESS.USER_REMOVED);
    } catch (error) {
      message.error(`${MESSAGES.ERROR.USER_REMOVE_FAILED}: ${error.message}`);
    }
  };

  // Listen to current session
  useEffect(() => {
    const unsubscribe = FirebaseService.listenToCurrentSession((sessionInfo) => {
      if (sessionInfo.active) {
        setVotingActive(true);
        setCurrentSessionId(sessionInfo.sessionId);
        if (sessionInfo.sessionData) {
          setSessionTimeLeft(sessionInfo.sessionData.duration);
          setCurrentSessionType(sessionInfo.sessionData.voteType);
        }
      } else {
        setVotingActive(false);
        setSessionTimeLeft(0);
        setCurrentSessionId(null);
        setCurrentSessionType(null);
      }
    });
    return unsubscribe;
  }, []);

  const stopVotingSession = useCallback(async () => {
    if (!votingActive || !currentSessionId) return;

    try {
      // Use refs to get current values
      const notVotedUsers = getNotVotedUsers(usersRef.current, sessionCandidatesRef.current, {});
      await FirebaseService.stopVotingSession(
        currentSessionId,
        notVotedUsers.map((u) => u.uid)
      );
      setVotingActive(false);
      setSessionTimeLeft(0);
      setCurrentSessionId(null);
      setCurrentSessionType(null);
      message.success(MESSAGES.SUCCESS.SESSION_STOPPED);
    } catch (error) {
      message.error(`${MESSAGES.ERROR.SESSION_STOP_FAILED}: ${error.message}`);
    }
  }, [votingActive, currentSessionId]);

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
    if (!votingActive || !currentSessionId) {
      // Clean up listeners when session is not active
      if (sessionListenerRef.current) {
        sessionListenerRef.current();
        sessionListenerRef.current = null;
      }
      if (votesListenerRef.current) {
        votesListenerRef.current();
        votesListenerRef.current = null;
      }
      return;
    }

    // Set up session data listener
    sessionListenerRef.current = FirebaseService.listenToSessionData(
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

    // Set up votes listener
    votesListenerRef.current = FirebaseService.listenToSessionVotes(
      currentSessionId,
      (votes) => {
        setSessionVoteCount(Object.keys(votes).length);
        setCandidateVotes(calculateCandidateVotes(votes));
        
        // Calculate not voted users (only for election type)
        // Use refs to get current values without triggering re-renders
        const notVotedUsers = getNotVotedUsers(usersRef.current, sessionCandidatesRef.current, votes);
        setNotVotedUserCount(notVotedUsers.length);
        setNotVotedUserList(notVotedUsers);
      }
    );

    // Cleanup function
    return () => {
      if (sessionListenerRef.current) {
        sessionListenerRef.current();
        sessionListenerRef.current = null;
      }
      if (votesListenerRef.current) {
        votesListenerRef.current();
        votesListenerRef.current = null;
      }
    };
  }, [votingActive, currentSessionId]);

  const startVotingSession = async (sessionConfig) => {
    const { duration, voteType, candidates, questions } = sessionConfig;

    // Validate based on vote type
    if (voteType === VOTE_TYPES.ELECTION && (!candidates || candidates.length < 2)) {
      message.error(MESSAGES.ERROR.MIN_CANDIDATES);
      return false;
    }

    if (voteType === VOTE_TYPES.QUESTION && (!questions || questions.length < 1)) {
      message.error("At least one question is required");
      return false;
    }

    try {
      const result = await FirebaseService.startVotingSession(sessionConfig);
      setSessionTimeLeft(result.duration);
      setVotingActive(true);
      setCurrentSessionId(result.sessionId);
      setCurrentSessionType(voteType);
      
      const typeText = voteType === VOTE_TYPES.ELECTION ? "election" : "question";
      message.success(`${MESSAGES.SUCCESS.SESSION_STARTED} (${typeText}) for ${duration} minutes`);
      return true;
    } catch (error) {
      message.error(`${MESSAGES.ERROR.SESSION_START_FAILED}: ${error.message}`);
      return false;
    }
  };

  const value = {
    // Session state
    votingActive,
    sessionTimeLeft,
    sessionVoteCount,
    sessionCandidates,
    candidateVotes,
    notVotedUserCount,
    notVotedUserList,
    currentSessionId,
    currentSessionType,
    
    // User data and actions
    users,
    addUser,
    removeUser,
    
    // Session actions
    startVotingSession,
    stopVotingSession,
  };

  return (
    <VotingContext.Provider value={value}>
      {children}
    </VotingContext.Provider>
  );
};
