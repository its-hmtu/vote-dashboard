import React, { useState, useMemo, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Tabs, Table, Tag, Progress, DatePicker, Select } from "antd";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { useSessions } from "../../hooks/useVoting";
import { useVotingContext } from "../../contexts/VotingContext";
import { calculateSessionResults } from "../../utils/formatters";
import { FirebaseService } from "../../services/firebaseService";
import AdvancedAnalytics from "./AdvancedAnalytics";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function Analytics() {
  const { sessions } = useSessions();
  const { users } = useVotingContext();
  const [dateRange, setDateRange] = useState([]);
  const [sessionTypeFilter, setSessionTypeFilter] = useState('all');
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

  // Filter sessions based on date range and type
  const filteredSessions = useMemo(() => {
    let filtered = sessions || [];
    
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter(session => {
        const sessionDate = moment(session.startTime);
        return sessionDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
      });
    }
    
    if (sessionTypeFilter !== 'all') {
      filtered = filtered.filter(session => session.voteType === sessionTypeFilter);
    }
    
    return filtered;
  }, [sessions, dateRange, sessionTypeFilter]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const totalSessions = filteredSessions.length;
    const activeSessions = filteredSessions.filter(s => s.status === 'active').length;
    const completedSessions = filteredSessions.filter(s => s.status === 'stopped').length;
    const totalUsers = users?.length || 0;
    
    // Calculate total votes and participation
    let totalVotes = 0;
    let totalParticipationRate = 0;
    let electionSessions = 0;
    let questionSessions = 0;
    
    const sessionResults = filteredSessions.map(session => {
      // Get votes for this specific session
      const votes = sessionVotes[session.sessionId] || {};
      const sessionData = calculateSessionResults(session, votes, users);
      
      totalVotes += sessionData.sessionVotes || 0;
      totalParticipationRate += sessionData.participationRate || 0;
      
      if (session.voteType === 'election') electionSessions++;
      else questionSessions++;
      
      return {
        ...session,
        ...sessionData
      };
    });
    
    const avgParticipationRate = completedSessions > 0 ? totalParticipationRate / completedSessions : 0;
    
    // Session trends over time
    const sessionTrends = filteredSessions.reduce((acc, session) => {
      const date = moment(session.startTime).format('YYYY-MM-DD');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    const sessionTrendData = Object.entries(sessionTrends).map(([date, count]) => ({
      date,
      sessions: count
    })).sort((a, b) => moment(a.date).diff(moment(b.date)));
    
    // Participation analysis
    const participationData = sessionResults
      .filter(s => s.status === 'stopped')
      .map(session => ({
        sessionId: session.sessionId?.split('_')[1]?.slice(-6) || 'Unknown',
        participationRate: session.participationRate,
        totalVotes: session.sessionVotes,
        type: session.voteType || 'election'
      }));
    
    // User activity analysis
    const userActivity = users?.map(user => {
      let userVotedSessions = 0;
      let totalCompletedSessions = 0;
      
      sessionResults.forEach(session => {
        if (session.status === 'stopped') {
          totalCompletedSessions++;
          
          // Check if user voted in this session
          const votes = sessionVotes[session.sessionId] || {};
          const userVoted = Object.keys(votes).includes(user.uid) || Object.keys(votes).includes(user.id);
          
          if (userVoted) {
            userVotedSessions++;
          }
        }
      });
      
      return {
        name: user.name,
        participationRate: totalCompletedSessions > 0 ? (userVotedSessions / totalCompletedSessions) * 100 : 0,
        totalSessions: userVotedSessions
      };
    }).sort((a, b) => b.participationRate - a.participationRate) || [];
    
    // Session type distribution
    const sessionTypeData = [
      { name: 'Elections', value: electionSessions, color: COLORS[0] },
      { name: 'Questions', value: questionSessions, color: COLORS[1] }
    ];
    
    // Duration analysis
    const durationData = sessionResults
      .filter(s => s.status === 'stopped' && s.duration)
      .map(session => ({
        sessionId: session.sessionId?.split('_')[1]?.slice(-6) || 'Unknown',
        plannedDuration: session.duration / 60, // Convert to minutes
        actualDuration: session.actualDuration ? session.actualDuration / 60 : session.duration / 60,
        participationRate: session.participationRate
      }));
    
    return {
      totalSessions,
      activeSessions,
      completedSessions,
      totalUsers,
      totalVotes,
      avgParticipationRate,
      electionSessions,
      questionSessions,
      sessionTrendData,
      participationData,
      userActivity,
      sessionTypeData,
      durationData,
      sessionResults
    };
  }, [filteredSessions, users, sessionVotes]);

  const renderOverviewTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={analytics.totalSessions}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed Sessions"
              value={analytics.completedSessions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Votes"
              value={analytics.totalVotes}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Participation"
              value={Math.round(analytics.avgParticipationRate)}
              suffix="%"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Session Types Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.sessionTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.sessionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Sessions Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.sessionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => moment(value).format('MM/DD')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => moment(value).format('MMM DD, YYYY')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderParticipationTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Session Participation Rates">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.participationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sessionId" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="participationRate" fill="#8884d8" name="Participation %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Top User Participation">
            <Table
              dataSource={analytics.userActivity.slice(0, 10)}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'User',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Participation Rate',
                  dataIndex: 'participationRate',
                  key: 'participationRate',
                  render: (rate) => (
                    <div>
                      <Progress 
                        percent={Math.round(rate)} 
                        size="small" 
                        strokeColor={rate > 80 ? '#52c41a' : rate > 60 ? '#faad14' : '#ff4d4f'}
                      />
                      <Text style={{ marginLeft: 8 }}>{Math.round(rate)}%</Text>
                    </div>
                  ),
                  sorter: (a, b) => a.participationRate - b.participationRate,
                },
                {
                  title: 'Sessions Participated',
                  dataIndex: 'totalSessions',
                  key: 'totalSessions',
                  sorter: (a, b) => a.totalSessions - b.totalSessions,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderPerformanceTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Session Duration vs Participation">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analytics.durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sessionId" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="plannedDuration" fill="#8884d8" name="Planned Duration (min)" />
                <Bar yAxisId="right" dataKey="participationRate" fill="#82ca9d" name="Participation %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="Recent Session Performance">
            <Table
              dataSource={analytics.sessionResults
                .filter(s => s.status === 'stopped')
                .sort((a, b) => moment(b.startTime).diff(moment(a.startTime)))
                .slice(0, 10)}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Session ID',
                  dataIndex: 'sessionId',
                  key: 'sessionId',
                  render: (id) => id?.split('_')[1]?.slice(-8) || 'Unknown'
                },
                {
                  title: 'Type',
                  dataIndex: 'voteType',
                  key: 'voteType',
                  render: (type) => (
                    <Tag color={type === 'election' ? 'blue' : 'green'}>
                      {type || 'election'}
                    </Tag>
                  )
                },
                {
                  title: 'Votes',
                  dataIndex: 'sessionVotes',
                  key: 'sessionVotes',
                },
                {
                  title: 'Participation',
                  dataIndex: 'participationRate',
                  key: 'participationRate',
                  render: (rate) => `${rate}%`,
                  sorter: (a, b) => a.participationRate - b.participationRate,
                },
                {
                  title: 'Duration',
                  dataIndex: 'duration',
                  key: 'duration',
                  render: (duration) => `${Math.round(duration / 60)}min`,
                },
                {
                  title: 'Date',
                  dataIndex: 'startTime',
                  key: 'startTime',
                  render: (time) => moment(time).format('MM/DD HH:mm'),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>Analytics & Reports</Title>
        <div style={{ display: 'flex', gap: 16 }}>
          <RangePicker 
            onChange={setDateRange}
            placeholder={['Start Date', 'End Date']}
          />
          <Select
            value={sessionTypeFilter}
            onChange={setSessionTypeFilter}
            style={{ width: 120 }}
          >
            <Option value="all">All Types</Option>
            <Option value="election">Elections</Option>
            <Option value="question">Questions</Option>
          </Select>
        </div>
      </div>
      
      <Tabs defaultActiveKey="overview">
        <Tabs.TabPane tab="Overview" key="overview">
          {renderOverviewTab()}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Participation" key="participation">
          {renderParticipationTab()}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Performance" key="performance">
          {renderPerformanceTab()}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Advanced" key="advanced">
          <AdvancedAnalytics />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Analytics;
