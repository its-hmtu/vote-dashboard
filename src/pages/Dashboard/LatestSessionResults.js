import React, { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Typography, Tag, Empty, List, Avatar, Tooltip, Button } from "antd";
import { 
  EyeOutlined 
} from "@ant-design/icons";
import moment from "moment";
import { formatSeconds, calculateSessionResults } from "../../utils";
import VoteResultsTable from "../../components/VoteResultsTable";
import { VOTE_TYPES } from "../../constants";
import { FirebaseService } from "../../services/firebaseService";

const { Title, Text } = Typography;

function LatestSessionResults({ sessions, users }) {
  const [sessionVotes, setSessionVotes] = useState({});
  const [showVoteLogs, setShowVoteLogs] = useState(false);

  const latestSession = sessions
    ?.filter(session => session.status !== 'active')
    ?.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))?.[0];

  // Fetch votes for the latest session
  useEffect(() => {
    if (latestSession?.sessionId) {
      const unsubscribe = FirebaseService.listenToSessionVotes(
        latestSession.sessionId,
        (votes) => {
          setSessionVotes(votes);
        }
      );
      return unsubscribe;
    }
  }, [latestSession?.sessionId]);

  if (!sessions || sessions.length === 0) {
    return (
      <Card title="Latest Session Results">
        <Empty description="No sessions available" />
      </Card>
    );
  }

  if (!latestSession) {
    return (
      <Card title="Latest Session Results">
        <Empty description="No completed sessions yet" />
      </Card>
    );
  }

  // Calculate detailed results
  const results = calculateSessionResults(latestSession, sessionVotes, users);
  const sessionCandidates = Object.keys(latestSession.candidates || {});
  
  // Extract results for easier access
  const {
    totalEligibleUsers,
    sessionVotes: totalVotes,
    notVotedUsers,
    participationRate,
    isElection,
    questionResults,
    candidateVotes
  } = results;
  
  // Calculate session duration
  const sessionDuration = latestSession.duration || 0;
  const actualDuration = latestSession.end_time && latestSession.start_time
    ? moment(latestSession.end_time).diff(moment.unix(latestSession.start_time), 'seconds')
    : sessionDuration;

  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Latest Session Results</span>
          <Tag color={latestSession.status === 'stopped' ? 'orange' : 'green'}>
            {latestSession.status === 'stopped' ? 'Completed' : latestSession.status}
          </Tag>
        </div>
      }
      style={{ marginBottom: 24 }}
    >
      {/* Session Info */}
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          Session: {latestSession.sessionId?.split("session_")[1] || 'Unknown'} • 
          Type: {latestSession.voteType || 'election'} • 
          Started: {moment(latestSession.startTime).format('MMM DD, YYYY HH:mm')}
        </Text>
      </div>

      {/* Performance Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Statistic
            title="Total Votes"
            value={totalVotes}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Participation"
            value={participationRate}
            suffix="%"
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Duration"
            value={formatSeconds(actualDuration)}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic
            title="Not Voted"
            value={notVotedUsers.length}
          />
        </Col>
      </Row>

      {/* Vote Results */}
      {isElection && sessionCandidates.length > 0 && (
        <div>
          <Title level={5}>Final Results</Title>
          <VoteResultsTable
            candidates={sessionCandidates}
            candidateVotes={candidateVotes}
            users={users}
            title="Final Vote Results"
            showChoiceLetter={true}
            showTable={false}
            size="small"
          />
        </div>
      )}

      {latestSession.voteType === VOTE_TYPES.QUESTION && (
        <div>
          <Title level={5}>Question Results</Title>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
            <Text strong>Question:</Text>
            <div style={{ marginTop: 8, marginBottom: 16 }}>
              {latestSession.questions?.[0]?.text || latestSession.question_text || 'Question not available'}
            </div>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic 
                  title="Yes" 
                  value={questionResults?.yes || 0} 
                  suffix="votes"
                  valueStyle={{ color: "#52c41a" }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="No" 
                  value={questionResults?.no || 0} 
                  suffix="votes"
                  valueStyle={{ color: "#ff4d4f" }}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="Neutral" 
                  value={questionResults?.neutral || 0} 
                  suffix="votes"
                  valueStyle={{ color: "#faad14" }}
                />
              </Col>
            </Row>
            {results.majority && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text strong>
                  Majority: <span style={{ 
                    color: results.majority === 'yes' ? '#52c41a' : 
                          results.majority === 'no' ? '#ff4d4f' : '#faad14' 
                  }}>
                    {results.majority.toUpperCase()}
                  </span> ({results.majorityPercentage}%)
                </Text>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Vote Logs Section */}
      {Object.keys(sessionVotes).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5}>Vote Logs</Title>
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => setShowVoteLogs(!showVoteLogs)}
              type={showVoteLogs ? "primary" : "default"}
            >
              {showVoteLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </div>
          
          {showVoteLogs && (
            <Card size="small">
              <List
                size="small"
                dataSource={Object.entries(sessionVotes).map(([userId, voteData]) => ({
                  userId,
                  ...voteData,
                  user: users.find(u => u.id === userId)
                }))}
                renderItem={(vote) => {
                  const userName = vote.user?.name || `User ${vote.userId.slice(-4)}`;
                  let voteDisplay = 'Unknown';
                  
                  if (isElection) {
                    // For elections, show candidate name
                    // Handle index-based votes (new system)
                    const candidateKey = vote.candidate_uid;
                    if (candidateKey && /^\d+$/.test(candidateKey)) {
                      const candidateIndex = parseInt(candidateKey) - 1; // Convert to 0-based index
                      if (candidateIndex >= 0 && candidateIndex < sessionCandidates.length) {
                        const actualCandidateUID = sessionCandidates[candidateIndex];
                        const candidate = users.find(u => u.id === actualCandidateUID || u.uid === actualCandidateUID);
                        voteDisplay = candidate?.name || actualCandidateUID || `Candidate ${candidateKey}`;
                      } else {
                        voteDisplay = `Invalid choice: ${candidateKey}`;
                      }
                    } else {
                      // Handle direct UID votes (legacy system)
                      const candidate = users.find(u => u.id === candidateKey || u.uid === candidateKey);
                      voteDisplay = candidate?.name || candidateKey || 'Unknown Candidate';
                    }
                  } else {
                    // For questions, show formatted answer
                    const answer = (vote.choice || vote.answer || vote.vote || 'Unknown').toLowerCase();
                    if (answer === 'agree' || answer === 'a') {
                      voteDisplay = 'Agree';
                    } else if (answer === 'disagree' || answer === 'b') {
                      voteDisplay = 'Disagree'; 
                    } else if (answer === 'neutral' || answer === 'c') {
                      voteDisplay = 'Neutral';
                    } else {
                      voteDisplay = vote.choice || vote.answer || vote.vote || 'Unknown';
                    }
                  }
                  
                  return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ backgroundColor: '#87d068' }}>
                            {userName.charAt(0).toUpperCase()}
                          </Avatar>
                        }
                        title={userName}
                        description={
                          <div>
                            <Text>Voted for: <Text strong>{voteDisplay}</Text></Text>
                            {vote.timestamp && (
                              <Text type="secondary" style={{ marginLeft: 16 }}>
                                {moment.unix(vote.timestamp).format('MMM DD, HH:mm:ss')}
                              </Text>
                            )}
                          </div>
                        }
                      />
                      <Tooltip title={isElection ? "Election Vote" : "Question Response"}>
                        <Tag color={isElection ? "blue" : "green"}>
                          {isElection ? "Election" : "Question"}
                        </Tag>
                      </Tooltip>
                    </List.Item>
                  );
                }}
              />
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary">
                  Total: {Object.keys(sessionVotes).length} vote{Object.keys(sessionVotes).length !== 1 ? 's' : ''}
                </Text>
              </div>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
}

export default LatestSessionResults;
