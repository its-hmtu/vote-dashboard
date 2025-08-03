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
            <Card size="small" style={{ 
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
              marginBottom: 16,
              border: '1px solid #91d5ff'
            }}>
              <Row gutter={[20, 16]}>
                <Col span={8}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f6ffed, #d9f7be)', 
                    padding: '16px', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '2px solid #b7eb8f',
                    boxShadow: '0 3px 8px rgba(82, 196, 26, 0.12)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  // onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  // onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      color: '#52c41a', 
                      marginBottom: '6px',
                      textShadow: '0 1px 3px rgba(82, 196, 26, 0.3)'
                    }}>
                      {questionResults.agree}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '10px' }}>
                      votes
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#52c41a', 
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ✓ Agree
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: '#52c41a',
                      background: '#f6ffed',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid #d9f7be',
                      display: 'inline-block'
                    }}>
                      {sessionVoteCount > 0 ? Math.round((questionResults.agree / sessionVoteCount) * 100) : 0}%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fff2e8, #ffd8bf)', 
                    padding: '16px', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '2px solid #ffbb96',
                    boxShadow: '0 3px 8px rgba(255, 77, 79, 0.12)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  // onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  // onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      color: '#ff4d4f', 
                      marginBottom: '6px',
                      textShadow: '0 1px 3px rgba(255, 77, 79, 0.3)'
                    }}>
                      {questionResults.disagree}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '10px' }}>
                      votes
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#ff4d4f', 
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ✗ Disagree
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: '#ff4d4f',
                      background: '#fff2e8',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid #ffd8bf',
                      display: 'inline-block'
                    }}>
                      {sessionVoteCount > 0 ? Math.round((questionResults.disagree / sessionVoteCount) * 100) : 0}%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ 
                    background: 'linear-gradient(135deg, #fffbf0, #fff1b8)', 
                    padding: '16px', 
                    borderRadius: '10px',
                    textAlign: 'center',
                    border: '2px solid #ffe58f',
                    boxShadow: '0 3px 8px rgba(250, 173, 20, 0.12)',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  // onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  // onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 'bold', 
                      color: '#faad14', 
                      marginBottom: '6px',
                      textShadow: '0 1px 3px rgba(250, 173, 20, 0.3)'
                    }}>
                      {questionResults.neutral}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '10px' }}>
                      votes
                    </div>
                    <div style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold', 
                      color: '#faad14', 
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      ⚪ Neutral
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: '#faad14',
                      background: '#fffbf0',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid #fff1b8',
                      display: 'inline-block'
                    }}>
                      {sessionVoteCount > 0 ? Math.round((questionResults.neutral / sessionVoteCount) * 100) : 0}%
                    </div>
                  </div>
                </Col>
              </Row>
              
              {sessionVoteCount > 0 && (
                <div>
                  {/* Current Leader */}
                  <div style={{ 
                    marginTop: 16, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #91d5ff',
                    marginBottom: '16px'
                  }}>
                    <Text style={{ fontSize: '16px', fontWeight: 500 }}>
                      🔥 Currently Leading: {
                        questionResults.agree > questionResults.disagree && questionResults.agree > questionResults.neutral 
                          ? <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>AGREE</Text>
                          : questionResults.disagree > questionResults.agree && questionResults.disagree > questionResults.neutral
                          ? <Text strong style={{ color: '#ff4d4f', fontSize: '18px' }}>DISAGREE</Text>
                          : questionResults.neutral > questionResults.agree && questionResults.neutral > questionResults.disagree
                          ? <Text strong style={{ color: '#faad14', fontSize: '18px' }}>NEUTRAL</Text>
                          : <Text strong style={{ color: '#8c8c8c', fontSize: '18px' }}>TIE</Text>
                      }
                    </Text>
                  </div>
                  
                  {/* Live Breakdown */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '14px', color: '#495057' }}>
                        📊 Live Results
                      </Text>
                    </div>
                    
                    <Row gutter={[12, 8]}>
                      <Col span={8}>
                        <div className="vote-result-card" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#f6ffed',
                          borderRadius: '6px',
                          border: '1px solid #d9f7be'
                        }}>
                          <span style={{ fontWeight: '600', color: '#52c41a', fontSize: '12px' }}>✓ Agree</span>
                          <div style={{ textAlign: 'right' }}>
                            <div className="vote-count-number" style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a' }}>
                              {questionResults.agree}
                            </div>
                            <div className="percentage-badge" style={{ 
                              fontSize: '11px', 
                              fontWeight: 'bold', 
                              color: '#389e0d',
                              background: 'rgba(82, 196, 26, 0.1)',
                              padding: '1px 6px',
                              borderRadius: '8px'
                            }}>
                              {sessionVoteCount > 0 ? Math.round((questionResults.agree / sessionVoteCount) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </Col>
                      
                      <Col span={8}>
                        <div className="vote-result-card" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#fff2e8',
                          borderRadius: '6px',
                          border: '1px solid #ffd8bf'
                        }}>
                          <span style={{ fontWeight: '600', color: '#ff4d4f', fontSize: '12px' }}>✗ Disagree</span>
                          <div style={{ textAlign: 'right' }}>
                            <div className="vote-count-number" style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff4d4f' }}>
                              {questionResults.disagree}
                            </div>
                            <div className="percentage-badge" style={{ 
                              fontSize: '11px', 
                              fontWeight: 'bold', 
                              color: '#cf1322',
                              background: 'rgba(255, 77, 79, 0.1)',
                              padding: '1px 6px',
                              borderRadius: '8px'
                            }}>
                              {sessionVoteCount > 0 ? Math.round((questionResults.disagree / sessionVoteCount) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </Col>
                      
                      <Col span={8}>
                        <div className="vote-result-card" style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '8px 12px',
                          background: '#fffbf0',
                          borderRadius: '6px',
                          border: '1px solid #fff1b8'
                        }}>
                          <span style={{ fontWeight: '600', color: '#faad14', fontSize: '12px' }}>⚪ Neutral</span>
                          <div style={{ textAlign: 'right' }}>
                            <div className="vote-count-number" style={{ fontSize: '14px', fontWeight: 'bold', color: '#faad14' }}>
                              {questionResults.neutral}
                            </div>
                            <div className="percentage-badge" style={{ 
                              fontSize: '11px', 
                              fontWeight: 'bold', 
                              color: '#d48806',
                              background: 'rgba(250, 173, 20, 0.1)',
                              padding: '1px 6px',
                              borderRadius: '8px'
                            }}>
                              {sessionVoteCount > 0 ? Math.round((questionResults.neutral / sessionVoteCount) * 100) : 0}%
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
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
