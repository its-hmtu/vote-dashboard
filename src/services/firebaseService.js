import { db, ref, set, onValue, get, off, remove } from "../firebase";
import moment from "moment";
import { FIREBASE_PATHS, VOTE_TYPES } from "../constants";

/**
 * Firebase service functions for voting operations
 */

export const FirebaseService = {
  /**
   * Listen to users data
   */
  listenToUsers(callback) {
    const usersRef = ref(db, FIREBASE_PATHS.USERS);
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userList = Object.entries(data).map(([uid, user]) => ({
        uid,
        ...user,
      }));
      callback(userList);
    });
    return () => off(usersRef);
  },

  /**
   * Listen to sessions data
   */
  listenToSessions(callback) {
    const sessionsRef = ref(db, FIREBASE_PATHS.SESSIONS);
    onValue(sessionsRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const sessionList = await Promise.all(
        Object.entries(data).map(async ([sessionId, session]) => {
          const votesSnap = await get(ref(db, `${FIREBASE_PATHS.VOTES}/${sessionId}`));
          const votes = votesSnap.val() || {};
          
          // Handle both Unix timestamps and date strings for start_time
          let startTime;
          if (session.start_time) {
            // If it's a number (Unix timestamp), convert it
            if (typeof session.start_time === 'number') {
              startTime = moment.unix(session.start_time).format("YYYY-MM-DD HH:mm:ss");
            } else {
              // If it's already a string, use it as is
              startTime = session.start_time;
            }
          } else {
            // Fallback to current time if no start_time
            startTime = moment().format("YYYY-MM-DD HH:mm:ss");
          }
          
          return {
            sessionId,
            ...session,
            startTime,
            voteCount: Object.keys(votes).length,
          };
        })
      );
      callback(sessionList);
    });
    return () => off(sessionsRef);
  },

  /**
   * Listen to current session
   */
  listenToCurrentSession(callback) {
    const currentSessionRef = ref(db, FIREBASE_PATHS.CURRENT_SESSION);
    onValue(currentSessionRef, (snapshot) => {
      const currentSession = snapshot.val();
      if (currentSession) {
        get(ref(db, `${FIREBASE_PATHS.SESSIONS}/${currentSession}`)).then((sessionSnap) => {
          const sessionData = sessionSnap.val();
          callback({ active: true, sessionId: currentSession, sessionData });
        });
      } else {
        callback({ active: false, sessionId: null, sessionData: null });
      }
    });
    return () => off(currentSessionRef);
  },

  /**
   * Listen for card scanning
   */
  listenForCard(callback) {
    const uidRef = ref(db, FIREBASE_PATHS.NEW_USER);
    const usersRef = ref(db, FIREBASE_PATHS.USERS);

    const handleScan = async (snapshot) => {
      const uid = snapshot.val();
      if (!uid) return;
      
      const usersSnap = await get(usersRef);
      const users = usersSnap.val() || {};
      
      if (users[uid]) {
        callback({ error: "This card is already registered.", uid: null });
        await set(uidRef, null);
        return;
      }
      
      callback({ error: null, uid });
    };

    onValue(uidRef, handleScan);
    return () => off(uidRef);
  },

  /**
   * Create new user
   */
  async createUser(uid, name) {
    await set(ref(db, `${FIREBASE_PATHS.USERS}/${uid}`), {
      name,
      createdAt: moment().format(),
    });
    await set(ref(db, FIREBASE_PATHS.NEW_USER), null);
    await set(ref(db, FIREBASE_PATHS.CREATE_MODE), 0);
  },

  /**
   * Remove user
   */
  async removeUser(uid) {
    await remove(ref(db, `${FIREBASE_PATHS.USERS}/${uid}`));
  },

  /**
   * Update user
   */
  async updateUser(uid, name) {
    // Get existing user data to preserve createdAt
    const userRef = ref(db, `${FIREBASE_PATHS.USERS}/${uid}`);
    const snapshot = await get(userRef);
    const existingUser = snapshot.val() || {};
    
    await set(userRef, {
      name,
      createdAt: existingUser.createdAt, // Preserve original creation date
      updatedAt: moment().format(),
    });
  },

  /**
   * Start voting session
   */
  async startVotingSession(sessionConfig) {
    const { duration, voteType, candidates, questions } = sessionConfig;
    const sessionId = `session_${Date.now()}`;
    const startTime = Math.floor(Date.now() / 1000);
    const durationInSeconds = duration * 60;

    const sessionData = {
      status: "active",
      start_time: startTime,
      duration: durationInSeconds,
      voteType,
    };

    // Add vote-type specific data
    if (voteType === VOTE_TYPES.ELECTION) {
      sessionData.candidates = candidates.reduce((obj, uid) => {
        obj[uid] = true;
        return obj;
      }, {});
    } else if (voteType === VOTE_TYPES.QUESTION) {
      sessionData.questions = questions.map((q, index) => ({
        id: `q_${index}`,
        text: q.text,
        order: index,
      }));
    }

    await set(ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}`), sessionData);

    // Update ESP32 configuration
    await set(ref(db, FIREBASE_PATHS.CONFIG), {
      current_session: sessionId,
      vote_type: voteType, // Set vote type for ESP32
    });

    await set(ref(db, FIREBASE_PATHS.VOTE_MODE), 1);
    
    return { sessionId, duration: durationInSeconds };
  },

  /**
   * Stop voting session
   */
  async stopVotingSession(sessionId, notVotedUsers) {
    await set(ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}/notVotedUsers`), notVotedUsers);
    await set(ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}/status`), "stopped");
    await set(ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}/end_time`), moment().format());
    await set(
      ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}/end_time_unix`),
      Math.floor(Date.now() / 1000)
    );
    // Clear ESP32 configuration
    await set(ref(db, FIREBASE_PATHS.CONFIG), { 
      current_session: null,
      vote_type: null,
    });
    await set(ref(db, FIREBASE_PATHS.VOTE_MODE), 0);
  },

  /**
   * Remove session
   */
  async removeSession(sessionId) {
    await remove(ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}`));
    await remove(ref(db, `${FIREBASE_PATHS.VOTES}/${sessionId}`));
  },

  /**
   * Set create mode
   */
  async setCreateMode(active) {
    await set(ref(db, FIREBASE_PATHS.CREATE_MODE), active ? 1 : 0);
  },

  /**
   * Get session votes (one-time fetch)
   */
  async getSessionVotes(sessionId) {
    const votesRef = ref(db, `${FIREBASE_PATHS.VOTES}/${sessionId}`);
    const snapshot = await get(votesRef);
    return snapshot.val() || {};
  },

  /**
   * Get all votes for multiple sessions
   */
  async getAllSessionVotes(sessionIds) {
    const votesData = {};
    
    for (const sessionId of sessionIds) {
      try {
        votesData[sessionId] = await this.getSessionVotes(sessionId);
      } catch (error) {
        console.error(`Error fetching votes for session ${sessionId}:`, error);
        votesData[sessionId] = {};
      }
    }
    
    return votesData;
  },

  /**
   * Listen to session votes
   */
  listenToSessionVotes(sessionId, callback) {
    const votesRef = ref(db, `${FIREBASE_PATHS.VOTES}/${sessionId}`);
    onValue(votesRef, (snapshot) => {
      const votes = snapshot.val() || {};
      callback(votes);
    });
    return () => off(votesRef);
  },

  /**
   * Listen to session data
   */
  listenToSessionData(sessionId, callback) {
    const sessionRef = ref(db, `${FIREBASE_PATHS.SESSIONS}/${sessionId}`);
    onValue(sessionRef, (snapshot) => {
      const session = snapshot.val() || {};
      callback(session);
    });
    return () => off(sessionRef);
  },
};
