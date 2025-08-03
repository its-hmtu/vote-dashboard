import React, { useState, useEffect } from "react";
import {
  Modal,
  Badge,
  Row,
  Col,
  Statistic,
  Switch,
  Empty,
  Typography,
  Card,
} from "antd";
import moment from "moment";
import {
  formatSeconds,
} from "../../utils/formatters";
import VoteResultsTable from "../../components/VoteResultsTable";
import { VOTE_TYPES } from "../../constants";
import { FirebaseService } from "../../services/firebaseService";

const { Title, Text } = Typography;

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
  const [sessionVotes, setSessionVotes] = useState({});


  // Fetch votes for the selected session to get real-time data
  useEffect(() => {
    if (selectedSession) {
      const unsubscribe = FirebaseService.listenToSessionVotes(
        selectedSession,
        (votes) => {
          setSessionVotes(votes);
        }
      );
      return unsubscribe;
    }
  }, [selectedSession]);

  if (!detailSession) return null;

  const isElection = detailSession.voteType === VOTE_TYPES.ELECTION;
  const isQuestion = detailSession.voteType === VOTE_TYPES.QUESTION;

  // Calculate analytics using actual vote data
  let totalVotes = 0;
  let notVotedUsersCount = 0;
  let participationRate = 0;
  let results = {};

  if (isElection) {
    // For elections, use the already calculated detailCandidateVotes
    totalVotes = Object.values(detailCandidateVotes || {}).reduce((sum, count) => sum + count, 0);
    
    // Calculate not voted users for elections
    const totalEligibleUsers = users?.length || 0;
    const candidateCount = detailCandidates?.length || 0;
    const eligibleVoters = Math.max(0, totalEligibleUsers - candidateCount);
    notVotedUsersCount = Math.max(0, eligibleVoters - totalVotes);
    participationRate = eligibleVoters > 0 ? Math.round((totalVotes / eligibleVoters) * 100) : 0;
  } else if (isQuestion) {
    // For questions, calculate from the fetched sessionVotes
    const votedUserIds = Object.keys(sessionVotes || {});
    totalVotes = votedUserIds.length;
    
    const totalEligibleUsers = users?.length || 0;
    notVotedUsersCount = Math.max(0, totalEligibleUsers - totalVotes);
    participationRate = totalEligibleUsers > 0 ? Math.round((totalVotes / totalEligibleUsers) * 100) : 0;
    
    // Calculate question results from actual vote data
    const questionResults = {
      yes: 0,
      no: 0,
      neutral: 0,
    };
    
    // Debug log to see what data we have
    console.log('Session votes for question:', sessionVotes);
    
    Object.values(sessionVotes || {}).forEach(vote => {
      console.log('Processing vote:', vote);
      const voteValue = (vote.choice || vote.answer || vote.vote || '').toLowerCase();
      if (voteValue === 'agree' || voteValue === 'a') {
        questionResults.yes++;
      } else if (voteValue === 'disagree' || voteValue === 'b') {
        questionResults.no++;
      } else if (voteValue === 'neutral' || voteValue === 'c') {
        questionResults.neutral++;
      }
    });
    
    console.log('Calculated question results:', questionResults);
    
    // Determine majority
    const totalResponses = questionResults.yes + questionResults.no + questionResults.neutral;
    results = {
      questionResults,
      majority: totalResponses > 0 ? (
        questionResults.yes > questionResults.no && questionResults.yes > questionResults.neutral ? 'yes' :
        questionResults.no > questionResults.yes && questionResults.no > questionResults.neutral ? 'no' : 
        questionResults.neutral > questionResults.yes && questionResults.neutral > questionResults.no ? 'neutral' : 'tie'
      ) : null,
      majorityPercentage: totalResponses > 0 ? Math.round((Math.max(questionResults.yes, questionResults.no, questionResults.neutral) / totalResponses) * 100) : 0,
    };
  }
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
            title="Participation Rate"
            value={totalVotes > 0 ? `${participationRate}%` : "0%"}
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
            <strong style={{ marginLeft: 16 }}>Type:</strong>
            <Badge
              color={isElection ? "blue" : "green"}
              text={isElection ? "Election" : "Question"}
            />
          </div>
        </Col>
        {isElection && (
          <Col span={4}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "end", gap: 8 }}>
              <span style={{fontWeight: 500}}>Show chart</span>
              <Switch checked={showChart} onChange={setShowChart} />
            </div>
          </Col>
        )}
      </Row>

      {/* Display results based on session type */}
      {isElection && detailCandidates?.length > 0 ? (
        <VoteResultsTable
          candidates={detailCandidates}
          candidateVotes={detailCandidateVotes}
          users={users}
          title={null}
          showChoiceLetter={false}
          showChart={showChart}
        />
      ) : isQuestion ? (
        <div>
          <Title level={5}>Question Results</Title>
          {detailSession.questions?.[0]?.text && (
            <Card size="small" style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' }}>
              <Text strong style={{ color: '#1976d2' }}>Question:</Text>
              <div style={{ marginTop: 8, fontSize: '14px', fontWeight: 500 }}>
                {detailSession.questions[0].text}
              </div>
            </Card>
          )}
          <Card size="small" style={{ background: '#fafafa', border: '1px solid #e8e8e8' }}>
            <Row gutter={[24, 16]}>
              <Col span={8}>
                <div className="vote-result-card" style={{ 
                  background: 'linear-gradient(135deg, #f6ffed, #d9f7be)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #b7eb8f'
                }}>
                  <div className="vote-count-number" style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a', marginBottom: '4px' }}>
                    {results.questionResults?.yes || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                    votes
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a', marginBottom: '4px' }}>
                    Agree
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: '#52c41a',
                    background: '#f6ffed',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #d9f7be'
                  }}>
                    {totalVotes > 0 ? Math.round(((results.questionResults?.yes || 0) / totalVotes) * 100) : 0}%
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="vote-result-card" style={{ 
                  background: 'linear-gradient(135deg, #fff2e8, #ffd8bf)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #ffbb96'
                }}>
                  <div className="vote-count-number" style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f', marginBottom: '4px' }}>
                    {results.questionResults?.no || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                    votes
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#ff4d4f', marginBottom: '4px' }}>
                    Disagree
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: '#ff4d4f',
                    background: '#fff2e8',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #ffd8bf'
                  }}>
                    {totalVotes > 0 ? Math.round(((results.questionResults?.no || 0) / totalVotes) * 100) : 0}%
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <div className="vote-result-card" style={{ 
                  background: 'linear-gradient(135deg, #fffbf0, #fff1b8)', 
                  padding: '16px', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  border: '1px solid #ffe58f'
                }}>
                  <div className="vote-count-number" style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14', marginBottom: '4px' }}>
                    {results.questionResults?.neutral || 0}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>
                    votes
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#faad14', marginBottom: '4px' }}>
                    Neutral
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    color: '#faad14',
                    background: '#fffbf0',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    border: '1px solid #fff1b8'
                  }}>
                    {totalVotes > 0 ? Math.round(((results.questionResults?.neutral || 0) / totalVotes) * 100) : 0}%
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
          </Card>
        </div>
      ) : (
        <Empty description="No results available" />
      )}
    </Modal>
  );
}

export default SessionDetailsModal;
