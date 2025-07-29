import React from "react";
import { Typography } from "antd";
import {
  SessionControl,
  CurrentSessionDashboard,
} from "../../components";
import {
  useUsers,
  useVotingSession,
} from "../../hooks/useVoting";

const { Title } = Typography;

function Dashboard() {
  const { users } = useUsers();
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

  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      
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
    </div>
  );
}

export default Dashboard;
