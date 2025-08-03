import React, { useState, useEffect } from "react";
import { Card, Statistic, Row, Col, Typography, Tag, Empty, List, Avatar, Tooltip, Button } from "antd";
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
          <Card size="small" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', marginBottom: 16 }}>
            <Text strong style={{ color: '#1976d2' }}>Question:</Text>
            <div style={{ marginTop: 8, marginBottom: 16, fontSize: '14px', fontWeight: 500 }}>
              {latestSession.questions?.[0]?.text || latestSession.question_text || 'Question not available'}
            </div>
          </Card>
          
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div className="vote-result-card" style={{ 
                background: 'linear-gradient(135deg, #f6ffed, #d9f7be)', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #b7eb8f',
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.15)'
              }}>
                <div className="vote-count-number" style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#52c41a', 
                  marginBottom: '8px',
                  textShadow: '0 2px 4px rgba(82, 196, 26, 0.2)'
                }}>
                  {questionResults?.yes || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '12px' }}>
                  votes
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#52c41a', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ✓ Agree
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#52c41a',
                  background: '#f6ffed',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '2px solid #d9f7be',
                  display: 'inline-block'
                }}>
                  {totalVotes > 0 ? Math.round(((questionResults?.yes || 0) / totalVotes) * 100) : 0}%
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ 
                background: 'linear-gradient(135deg, #fff2e8, #ffd8bf)', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #ffbb96',
                boxShadow: '0 4px 12px rgba(255, 77, 79, 0.15)'
              }}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#ff4d4f', 
                  marginBottom: '8px',
                  textShadow: '0 2px 4px rgba(255, 77, 79, 0.2)'
                }}>
                  {questionResults?.no || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '12px' }}>
                  votes
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#ff4d4f', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ✗ Disagree
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#ff4d4f',
                  background: '#fff2e8',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '2px solid #ffd8bf',
                  display: 'inline-block'
                }}>
                  {totalVotes > 0 ? Math.round(((questionResults?.no || 0) / totalVotes) * 100) : 0}%
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ 
                background: 'linear-gradient(135deg, #fffbf0, #fff1b8)', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #ffe58f',
                boxShadow: '0 4px 12px rgba(250, 173, 20, 0.15)'
              }}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: '#faad14', 
                  marginBottom: '8px',
                  textShadow: '0 2px 4px rgba(250, 173, 20, 0.2)'
                }}>
                  {questionResults?.neutral || 0}
                </div>
                <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '12px' }}>
                  votes
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#faad14', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  ⚪ Neutral
                </div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#faad14',
                  background: '#fffbf0',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '2px solid #fff1b8',
                  display: 'inline-block'
                }}>
                  {totalVotes > 0 ? Math.round(((questionResults?.neutral || 0) / totalVotes) * 100) : 0}%
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Enhanced Results Summary */}
          <div style={{ marginTop: 20 }}>
            {/* Primary Results */}
            {results.majority && results.majority !== 'tie' && (
              <div className="majority-result" style={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid #91d5ff',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ fontSize: '18px', color: '#1976d2' }}>
                    Majority Choice
                  </Text>
                </div>
                <div style={{ 
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: results.majority === 'yes' ? '#52c41a' : 
                        results.majority === 'no' ? '#ff4d4f' : '#faad14',
                  marginBottom: '4px'
                }}>
                  {results.majority === 'yes' ? '✓ AGREE' : 
                   results.majority === 'no' ? '✗ DISAGREE' : 
                   results.majority === 'neutral' ? '⚪ NEUTRAL' : results.majority.toUpperCase()}
                </div>
                <div className="percentage-badge" style={{ 
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  display: 'inline-block',
                  marginTop: '8px'
                }}>
                  {results.majorityPercentage}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vote Logs Section */}
      {Object.keys(sessionVotes).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5}>Vote Logs</Title>
            <Button 
              onClick={() => setShowVoteLogs(!showVoteLogs)}
              type={showVoteLogs ? "primary" : "default"}
              style={{ borderRadius: 99 }}
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
                            {/* {vote.timestamp && (
                              <Text type="secondary" style={{ marginLeft: 16 }}>
                                {moment.unix(vote.timestamp).format('MMM DD, HH:mm:ss')}
                              </Text>
                            )} */}
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
