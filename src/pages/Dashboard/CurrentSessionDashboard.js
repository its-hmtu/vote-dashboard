import React, { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Alert, Typography } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { formatSeconds } from "../../utils";
import VoteResultsTable from "../../components/VoteResultsTable";
import { VOTE_TYPES } from "../../constants";
import { FirebaseService } from "../../services/firebaseService";

const { Text, Title } = Typography;

function CurrentSessionDashboard({
  votingActive,
  sessionTimeLeft,
  sessionVoteCount,
  notVotedUserCount,
  sessionCandidates,
  candidateVotes,
  users,
  currentSessionId,
  currentSessionType,
}) {
  const [sessionData, setSessionData] = useState(null);
  const [sessionVotes, setSessionVotes] = useState({});

  // Fetch current session data for questions
  useEffect(() => {
    if (!votingActive || !currentSessionId) return;

    const unsubscribeSession = FirebaseService.listenToSessionData(
      currentSessionId,
      (session) => {
        setSessionData(session);
      }
    );

    const unsubscribeVotes = FirebaseService.listenToSessionVotes(
      currentSessionId,
      (votes) => {
        setSessionVotes(votes);
      }
    );

    return () => {
      unsubscribeSession();
      unsubscribeVotes();
    };
  }, [votingActive, currentSessionId]);

  if (!votingActive) return null;

  const isElection = currentSessionType === VOTE_TYPES.ELECTION;
  const isQuestion = currentSessionType === VOTE_TYPES.QUESTION;

  // Calculate question results for real-time display
  const questionResults = isQuestion ? {
    agree: 0,
    disagree: 0,
    neutral: 0
  } : null;

  if (isQuestion && sessionVotes) {
    Object.values(sessionVotes).forEach(vote => {
      // Handle both choice and answer fields, and different formats
      const answer = (vote.choice || vote.answer || vote.vote || '').toLowerCase();
      if (answer === 'agree' || answer === 'a') {
        questionResults.agree++;
      } else if (answer === 'disagree' || answer === 'b') {
        questionResults.disagree++;
      } else if (answer === 'neutral' || answer === 'c') {
        questionResults.neutral++;
      }
    });
  }

  const getSessionTitle = () => {
    if (isElection) return "Current Election Session";
    if (isQuestion) return "Current Question Session";
    return "Current Voting Session";
  };

  return (
    <Card title={getSessionTitle()} style={{ marginBottom: 24 }}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={6}>
          <Statistic
            title="Time Remaining"
            value={formatSeconds(sessionTimeLeft)}
            prefix={<ClockCircleOutlined />}
            valueStyle={{
              fontFamily: "monospace",
            }}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="Total Votes Cast"
            value={sessionVoteCount}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="Users Not Voted"
            value={notVotedUserCount}
            prefix={<ExclamationCircleOutlined />}
          />
        </Col>
        <Col xs={24} md={6}>
          <Statistic
            title="Session Type"
            value={isElection ? "Election" : "Question"}
            prefix={isElection ? <CheckCircleOutlined /> : <QuestionCircleOutlined />}
            valueStyle={{
              color: isElection ? "#1890ff" : "#52c41a"
            }}
          />
        </Col>
      </Row>

      {/* Display current question for question sessions */}
      {isQuestion && sessionData?.questions?.[0] && (
        <Alert
          message="Current Question"
          description={sessionData.questions[0].text}
          type="info"
          showIcon
          style={{ margin: "24px 0" }}
        />
      )}

      <div style={{ marginTop: 24 }}>
        {isElection && sessionCandidates.length > 0 ? (
          <VoteResultsTable
            candidates={sessionCandidates}
            candidateVotes={candidateVotes}
            users={users}
            title="Live Election Results"
            showChoiceLetter={true}
          />
        ) : isQuestion && questionResults ? (
          <div>
            <Title level={5}>Live Question Results</Title>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="Agree" 
                    value={questionResults.agree} 
                    suffix="votes"
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Disagree" 
                    value={questionResults.disagree} 
                    suffix="votes"
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Neutral" 
                    value={questionResults.neutral} 
                    suffix="votes"
                    valueStyle={{ color: "#faad14" }}
                  />
                </Col>
              </Row>
              
              {sessionVoteCount > 0 && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text type="secondary">
                    Leading: {
                      questionResults.agree > questionResults.disagree && questionResults.agree > questionResults.neutral 
                        ? <Text strong style={{ color: '#52c41a' }}>Agree</Text>
                        : questionResults.disagree > questionResults.agree && questionResults.disagree > questionResults.neutral
                        ? <Text strong style={{ color: '#ff4d4f' }}>Disagree</Text>
                        : questionResults.neutral > questionResults.agree && questionResults.neutral > questionResults.disagree
                        ? <Text strong style={{ color: '#faad14' }}>Neutral</Text>
                        : <Text strong>Tie</Text>
                    }
                  </Text>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Alert
            message="Waiting for session data..."
            type="info"
            showIcon
          />
        )}
      </div>
    </Card>
  );
}

export default CurrentSessionDashboard;
