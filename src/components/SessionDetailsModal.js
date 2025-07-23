import React from "react";
import { Modal, Badge, Row, Col, Statistic, Divider } from "antd";
import moment from "moment";
import { formatSeconds, getNotVotedUsers } from "../utils/formatters";
import VoteResultsTable from "./VoteResultsTable";

function SessionDetailsModal({
  open,
  onClose,
  selectedSession,
  detailSession,
  detailCandidates,
  detailCandidateVotes,
  users,
}) {
  if (!detailSession) return null;

  const notVotedUsersCount = getNotVotedUsers(
    users,
    detailCandidates,
    detailCandidateVotes
  ).length;

  const totalVotes = Object.values(detailCandidateVotes).reduce((sum, votes) => sum + votes, 0);

  return (
    <Modal
      title={`Session Details: ${selectedSession || ""}`}
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      width={1200}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="Start Time"
            value={detailSession.start_time
              ? moment.unix(detailSession.start_time).format("YYYY-MM-DD HH:mm:ss")
              : "-"}
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Duration"
            value={formatSeconds(detailSession.duration)}
            valueStyle={{ fontSize: '14px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total Votes"
            value={totalVotes}
            valueStyle={{ fontSize: '14px', color: '#3f8600' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Not Voted"
            value={notVotedUsersCount}
            valueStyle={{ 
              fontSize: '14px', 
              color: notVotedUsersCount > 0 ? '#cf1322' : '#3f8600' 
            }}
          />
        </Col>
      </Row>

      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>Status:</strong>
            <Badge
              status={
                detailSession.status === "active"
                  ? "processing"
                  : detailSession.status === "stopped"
                  ? "error"
                  : "default"
              }
              text={
                detailSession.status.charAt(0).toUpperCase() +
                detailSession.status.slice(1)
              }
            />
          </div>
        </Col>
      </Row>

      <Divider />
      
      <VoteResultsTable
        candidates={detailCandidates}
        candidateVotes={detailCandidateVotes}
        users={users}
        title="Final Results"
        showChoiceLetter={false}
      />
    </Modal>
  );
}

export default SessionDetailsModal;
