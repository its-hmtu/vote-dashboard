import React from "react";
import "antd/dist/reset.css";
import {
  AppLayout,
  SessionControl,
  CurrentSessionDashboard,
  SessionHistory,
  UserManagement,
  SessionDetailsModal,
} from "./components";
import {
  useUsers,
  useSessions,
  useVotingSession,
  useSessionDetails,
} from "./hooks/useVoting";

function App() {
  // Custom hooks for state management
  const { users, addUser, removeUser } = useUsers();
  const { sessions, removeSession } = useSessions();
  const {
    votingActive,
    sessionTimeLeft,
    sessionVoteCount,
    sessionCandidates,
    candidateVotes,
    notVotedUserCount,
    startVotingSession,
    stopVotingSession,
  } = useVotingSession(users);
  const {
    selectedSession,
    openSessionDetail,
    detailSession,
    detailCandidates,
    detailCandidateVotes,
    openDetails,
    closeDetails,
  } = useSessionDetails();

  return (
    <AppLayout>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>
        Voting Dashboard
      </h1>

      {/* Session Control Section */}
      <SessionControl
        votingActive={votingActive}
        onStartSession={startVotingSession}
        onStopSession={stopVotingSession}
        users={users}
      />

      {/* Current Session Dashboard */}
      <CurrentSessionDashboard
        votingActive={votingActive}
        sessionTimeLeft={sessionTimeLeft}
        sessionVoteCount={sessionVoteCount}
        notVotedUserCount={notVotedUserCount}
        sessionCandidates={sessionCandidates}
        candidateVotes={candidateVotes}
        users={users}
      />

      {/* User Management Section */}
      <UserManagement
        users={users}
        onAddUser={addUser}
        onRemoveUser={removeUser}
      />

      {/* Session History */}
      <SessionHistory
        sessions={sessions}
        onViewDetails={openDetails}
        onRemoveSession={removeSession}
      />

      {/* Session Details Modal */}
      <SessionDetailsModal
        open={openSessionDetail}
        onClose={closeDetails}
        selectedSession={selectedSession}
        detailSession={detailSession}
        detailCandidates={detailCandidates}
        detailCandidateVotes={detailCandidateVotes}
        users={users}
      />
    </AppLayout>
  );
}

export default App;
