import React, { useState, useMemo, useEffect } from 'react';
import { Card, Row, Col, Alert, Table, Tag, Progress, Timeline, Button, Modal, Typography } from 'antd';
import { TrophyOutlined, AlertOutlined, RocketOutlined, DownloadOutlined } from '@ant-design/icons';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from 'react-toastify';
import moment from 'moment';
import { calculateUserEngagement, analyzeCandidatePerformance, generateSessionInsights, analyzeVotingPatterns, exportSessionData } from '../../utils/analytics';
import { useSessions } from '../../hooks/useVoting';
import { useVotingContext } from '../../contexts/VotingContext';
import { FirebaseService } from '../../services/firebaseService';

const { Title, Text } = Typography;

function AdvancedAnalytics() {
  const { sessions } = useSessions();
  const { users } = useVotingContext();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [sessionVotes, setSessionVotes] = useState({});

  // Fetch votes for all sessions
  useEffect(() => {
    const fetchVotesForSessions = async () => {
      if (!sessions || sessions.length === 0) return;
      
      try {
        const sessionIds = sessions
          .filter(session => session.sessionId)
          .map(session => session.sessionId);
        
        if (sessionIds.length > 0) {
          const votesData = await FirebaseService.getAllSessionVotes(sessionIds);
          setSessionVotes(votesData);
        }
      } catch (error) {
        console.error('Error fetching session votes:', error);
        setSessionVotes({});
      }
    };

    fetchVotesForSessions();
  }, [sessions]);

  const analytics = useMemo(() => {
    const userEngagement = calculateUserEngagement(users || [], sessions || [], sessionVotes);
    const candidatePerformance = analyzeCandidatePerformance(sessions || [], sessionVotes, users || []);
    const sessionInsights = generateSessionInsights(sessions || [], sessionVotes, users || []);
    const votingPatterns = analyzeVotingPatterns(sessions || [], sessionVotes);

    // Prepare hourly voting pattern data
    const hourlyData = votingPatterns.hourly.map((count, hour) => ({
      hour: `${hour}:00`,
      votes: count
    }));

    // Prepare daily voting pattern data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = votingPatterns.daily.map((count, day) => ({
      day: dayNames[day],
      votes: count
    }));

    return {
      userEngagement,
      candidatePerformance,
      sessionInsights,
      hourlyData,
      dailyData
    };
  }, [sessions, users, sessionVotes]);

  const handleExportData = () => {
    try {
      const csvData = exportSessionData(sessions || [], sessionVotes, users || []);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `session-analytics-${moment().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportModalVisible(false);
      
      // Add success toast
      toast.success('Analytics data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics data. Please try again.');
    }
  };  const renderInsightsCard = () => (
    <Card title="Key Insights" style={{ marginBottom: 24 }}>
      <Timeline>
        {analytics.sessionInsights.map((insight, index) => (
          <Timeline.Item
            key={index}
            color={insight.type === 'positive' ? 'green' : insight.type === 'negative' ? 'red' : 'orange'}
            dot={
              insight.type === 'positive' ? <TrophyOutlined /> :
              insight.type === 'negative' ? <AlertOutlined /> :
              <RocketOutlined />
            }
          >
            <div>
              <Text strong>{insight.title}</Text>
              <br />
              <Text type="secondary">{insight.description}</Text>
              <br />
              <Tag color={insight.type === 'positive' ? 'green' : insight.type === 'negative' ? 'red' : 'orange'}>
                {insight.value}
              </Tag>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
      {analytics.sessionInsights.length === 0 && (
        <Alert message="No insights available yet. Conduct more sessions to generate insights." type="info" />
      )}
    </Card>
  );

  const renderUserEngagementCard = () => (
    <Card title="User Engagement Analysis" extra={
      <Button icon={<DownloadOutlined />} onClick={() => setExportModalVisible(true)}>
        Export Data
      </Button>
    }>
      <Table
        dataSource={analytics.userEngagement.slice(0, 15)}
        pagination={false}
        size="small"
        columns={[
          {
            title: 'User',
            dataIndex: 'name',
            key: 'name',
            width: 120,
          },
          {
            title: 'Engagement Score',
            dataIndex: 'engagementScore',
            key: 'engagementScore',
            width: 150,
            render: (score) => (
              <div>
                <Progress 
                  percent={Math.round(score)} 
                  size="small" 
                  strokeColor={score > 80 ? '#52c41a' : score > 60 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                />
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>{Math.round(score)}</Text>
              </div>
            ),
            sorter: (a, b) => a.engagementScore - b.engagementScore,
          },
          {
            title: 'Participation',
            dataIndex: 'participationRate',
            key: 'participationRate',
            width: 100,
            render: (rate) => `${Math.round(rate)}%`,
            sorter: (a, b) => a.participationRate - b.participationRate,
          },
          {
            title: 'Votes Cast',
            dataIndex: 'totalVotes',
            key: 'totalVotes',
            width: 80,
            sorter: (a, b) => a.totalVotes - b.totalVotes,
          },
          {
            title: 'Avg Response Time',
            dataIndex: 'avgResponseTime',
            key: 'avgResponseTime',
            width: 120,
            render: (time) => time > 0 ? `${Math.round(time / 60)}min` : 'N/A',
          },
        ]}
      />
    </Card>
  );

  const renderCandidatePerformanceCard = () => (
    <Card title="Candidate Performance Analysis">
      <Table
        dataSource={analytics.candidatePerformance.slice(0, 10)}
        pagination={false}
        size="small"
        columns={[
          {
            title: 'Candidate',
            dataIndex: 'name',
            key: 'name',
            width: 150,
          },
          {
            title: 'Elections',
            dataIndex: 'timesCandidate',
            key: 'timesCandidate',
            width: 80,
            sorter: (a, b) => a.timesCandidate - b.timesCandidate,
          },
          {
            title: 'Wins',
            dataIndex: 'timesWon',
            key: 'timesWon',
            width: 70,
            sorter: (a, b) => a.timesWon - b.timesWon,
          },
          {
            title: 'Win Rate',
            dataIndex: 'winRate',
            key: 'winRate',
            width: 120,
            render: (rate) => (
              <div>
                <Progress 
                  percent={Math.round(rate)} 
                  size="small" 
                  strokeColor={rate > 60 ? '#52c41a' : rate > 30 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                />
                <Text style={{ marginLeft: 8, fontSize: '12px' }}>{Math.round(rate)}%</Text>
              </div>
            ),
            sorter: (a, b) => a.winRate - b.winRate,
          },
          {
            title: 'Total Votes',
            dataIndex: 'totalVotesReceived',
            key: 'totalVotesReceived',
            width: 100,
            sorter: (a, b) => a.totalVotesReceived - b.totalVotesReceived,
          },
          {
            title: 'Avg Vote Share',
            dataIndex: 'averageVoteShare',
            key: 'averageVoteShare',
            width: 120,
            render: (share) => `${Math.round(share)}%`,
            sorter: (a, b) => a.averageVoteShare - b.averageVoteShare,
          },
        ]}
      />
      {analytics.candidatePerformance.length === 0 && (
        <Alert message="No candidate performance data available yet." type="info" />
      )}
    </Card>
  );

  const renderVotingPatternsCard = () => (
    <Row gutter={16}>
      <Col xs={24} lg={12}>
        <Card title="Voting by Hour of Day" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="votes" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title="Voting by Day of Week" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <RechartsTooltip />
              <Bar dataKey="votes" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Col>
    </Row>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3}>Advanced Analytics</Title>
      </div>

      {/* Key Insights */}
      <Row gutter={16}>
        <Col xs={24} lg={8}>
          {renderInsightsCard()}
        </Col>
        <Col xs={24} lg={16}>
          {renderVotingPatternsCard()}
        </Col>
      </Row>

      {/* User Engagement */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          {renderUserEngagementCard()}
        </Col>
      </Row>

      {/* Candidate Performance */}
      <Row gutter={16}>
        <Col xs={24}>
          {renderCandidatePerformanceCard()}
        </Col>
      </Row>

      {/* Export Modal */}
      <Modal
        title="Export Analytics Data"
        open={exportModalVisible}
        onOk={handleExportData}
        onCancel={() => setExportModalVisible(false)}
        okText="Download CSV"
      >
        <p>This will export all session data including:</p>
        <ul>
          <li>Session details and performance metrics</li>
          <li>Participation rates and vote counts</li>
          <li>Duration and efficiency data</li>
          <li>Timestamps and session types</li>
        </ul>
        <Alert 
          message="Data Export" 
          description="The exported file will be saved to your Downloads folder."
          type="info" 
          showIcon 
        />
      </Modal>
    </div>
  );
}

export default AdvancedAnalytics;
