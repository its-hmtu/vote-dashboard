import React, { useState } from "react";
import {
  Modal,
  Badge,
  Row,
  Col,
  Statistic,
  Switch,
  Empty,
} from "antd";
import moment from "moment";
import {
  formatSeconds,
} from "../../utils/formatters";
import VoteResultsTable from "../../components/VoteResultsTable";

function SessionDetailsModal({
  open,
  onClose,
  selectedSession,
  detailSession,
  detailCandidates,
  detailCandidateVotes,
  users,
}) {
  const [showChart, setShowChart] = useState(true);
  if (!detailSession)
    return null;
  const notVotedUsersCount = detailSession?.notVotedUsers?.length;
  const totalVotes = Object.values(detailCandidateVotes).reduce(
    (sum, votes) => sum + votes,
    0
  );
  const completionRate = totalVotes
    ? ((totalVotes / (users.length - notVotedUsersCount)) * 100).toFixed(1)
    : 0;
  return (
    <Modal
      title={`Session Details: ${selectedSession || ""}`}
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      width={"100%"}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Statistic
            title="Start Time"
            value={
              detailSession.start_time
                ? moment
                    .unix(detailSession.start_time)
                    .format("YYYY-MM-DD HH:mm:ss")
                : "-"
            }
            valueStyle={{ fontSize: "14px" }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Duration"
            value={formatSeconds(detailSession.duration)}
            valueStyle={{ fontSize: "14px" }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Total Votes"
            value={totalVotes}
            valueStyle={{ fontSize: "14px" }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Not Voted"
            value={notVotedUsersCount}
            valueStyle={{
              fontSize: "14px",
            }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="Completion Rate"
            value={totalVotes > 0 ? `${completionRate}%` : "0%"}
            valueStyle={{
              fontSize: "14px",
            }}
          />
        </Col>
      </Row>

      <Row style={{ marginBottom: 16 }}>
        <Col span={20}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
        <Col span={4}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "end", gap: 8 }}>
            <span style={{fontWeight: 500}}>Show chart</span>
            <Switch checked={showChart} onChange={setShowChart} />
          </div>
        </Col>
      </Row>
      <VoteResultsTable
        candidates={detailCandidates}
        candidateVotes={detailCandidateVotes}
        users={users}
        title={null}
        showChoiceLetter={false}
        showChart={showChart}
      />
    </Modal>
  );
}

export default SessionDetailsModal;
