import React from "react";
import { Card, Statistic, Row, Col, Alert } from "antd";
import { ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { formatSeconds } from "../utils";
import VoteResultsTable from "./VoteResultsTable";

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

  const isTimeRunningOut = sessionTimeLeft < 300; // Less than 5 minutes

  return (
    <Card title="Current Voting Session" style={{ marginBottom: 24 }}>
      {isTimeRunningOut && (
        <Alert
          message="Time is running out!"
          description={`Only ${formatSeconds(sessionTimeLeft)} remaining`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Row gutter={[24, 16]}>
        <Col xs={24} md={8}>
          <Statistic
            title="Time Remaining"
            value={formatSeconds(sessionTimeLeft)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ 
              color: isTimeRunningOut ? "#cf1322" : "#3f8600",
              fontFamily: "monospace",
            }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Total Votes Cast"
            value={sessionVoteCount}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: "#3f8600" }}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Users Not Voted"
            value={notVotedUserCount}
            prefix={<ExclamationCircleOutlined />}
            valueStyle={{ color: notVotedUserCount > 0 ? "#cf1322" : "#3f8600" }}
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
