import React from "react";
import { Typography } from "antd";
import SessionHistory from "./SessionHistory";
import SessionDetailsModal from "./SessionDetailsModal";
import {
  useSessions,
  useSessionDetails,
} from "../../hooks/useVoting";
import { useVotingContext } from "../../contexts/VotingContext";

const { Title } = Typography;

function Sessions() {
  const { sessions, removeSession } = useSessions();
  const { users } = useVotingContext();
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
    <div>
      <Title level={2}>Session Management ({sessions.length})</Title>

      <SessionHistory
        sessions={sessions}
        onViewDetails={openDetails}
        onRemoveSession={removeSession}
      />

      <SessionDetailsModal
        open={openSessionDetail}
        onClose={closeDetails}
        selectedSession={selectedSession}
        detailSession={detailSession}
        detailCandidates={detailCandidates}
        detailCandidateVotes={detailCandidateVotes}
        users={users}
      />
    </div>
  );
}

export default Sessions;
