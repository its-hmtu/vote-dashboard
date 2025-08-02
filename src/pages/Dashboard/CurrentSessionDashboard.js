import React from "react";
import { Card, Statistic, Row, Col, Alert } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { formatSeconds } from "../../utils";
import VoteResultsTable from "../../components/VoteResultsTable";

function CurrentSessionDashboard({
  votingActive,
  sessionTimeLeft,
  sessionVoteCount,
  notVotedUserCount,
  sessionCandidates,
  candidateVotes,
  users,
}) {
  if (!votingActive) return null;

  return (
    <Card title="Current Voting Session" style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={8}>
          <Statistic
            title="Time Remaining"
            value={formatSeconds(sessionTimeLeft)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{
              fontFamily: "monospace",
            }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Total Votes Cast"
            value={sessionVoteCount}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Users Not Voted"
            value={notVotedUserCount}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <VoteResultsTable
          candidates={sessionCandidates}
          candidateVotes={candidateVotes}
          users={users}
          title="Live Results"
          showChoiceLetter={true}
        />
      </div>
    </Card>
  );
}

export default CurrentSessionDashboard;
