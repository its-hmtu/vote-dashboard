import React, { useState } from "react";
import { 
  Typography, 
  Row, 
  Col, 
  Card, 
  Statistic, 
  List, 
  Avatar, 
  Button, 
  Space,
  Badge,
  Drawer,
  Timeline,
  Empty,
  Tag
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  HistoryOutlined,
  BarChartOutlined,
  TeamOutlined
} from "@ant-design/icons";
import {
  SessionControl,
  CurrentSessionDashboard,
} from "../../components";
import { useVotingContext } from "../../contexts/VotingContext";
import { useSessions } from "../../hooks/useVoting";

const { Title, Text } = Typography;

function Dashboard() {
  const [voteLogOpen, setVoteLogOpen] = useState(false);
  const {
    users,
    votingActive,
    sessionTimeLeft,
    sessionVoteCount,
    sessionCandidates,
    candidateVotes,
    notVotedUserCount,
    startVotingSession,
    stopVotingSession,
  } = useVotingContext();
  
  const { sessions } = useSessions();

  // Calculate dashboard analytics
  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter(s => s.status !== 'active')?.length || 0;
  const totalUsers = users?.length || 0;
  const totalVotes = sessions?.reduce((acc, session) => acc + (session.voteCount || 0), 0) || 0;
  
  // Recent sessions (last 5)
  const recentSessions = sessions
    ?.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    ?.slice(0, 5) || [];

  // Get recent vote activity (mock data for now - would come from real-time logs)
  const recentVoteActivity = [
    { id: 1, voter: "User A1B2", candidate: "John Doe", time: "2 minutes ago", type: "vote" },
    { id: 2, voter: "User C3D4", candidate: "Jane Smith", time: "3 minutes ago", type: "vote" },
    { id: 3, voter: "System", action: "Session started", time: "5 minutes ago", type: "system" },
    { id: 4, voter: "User E5F6", candidate: "John Doe", time: "8 minutes ago", type: "vote" },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <BarChartOutlined style={{ marginRight: '8px' }} />
            Dashboard Overview
          </Title>
          <Text type="secondary">Real-time voting analytics and system status</Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<HistoryOutlined />}
              onClick={() => setVoteLogOpen(true)}
            >
              Vote Log
            </Button>
            {votingActive ? (
              <Badge dot color="green">
                <Button 
                  type="primary" 
                  icon={<PauseCircleOutlined />}
                  onClick={stopVotingSession}
                  danger
                >
                  Stop Session
                </Button>
              </Badge>
            ) : (
              <SessionControl
                votingActive={votingActive}
                onStartSession={startVotingSession}
                onStopSession={stopVotingSession}
                users={users}
                buttonOnly={true}
              />
            )}
          </Space>
        </Col>
      </Row>

      {/* Analytics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={totalSessions}
              prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Votes"
              value={totalVotes}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Column - Current Session & Analytics */}
        <Col xs={24} lg={16}>
          {/* Current Session Status */}
          {votingActive ? (
            <Card 
              title={
                <Space>
                  <Badge status="processing" />
                  <span>Live Voting Session</span>
                </Space>
              }
              style={{ marginBottom: '16px' }}
            >
              <CurrentSessionDashboard
                votingActive={votingActive}
                sessionTimeLeft={sessionTimeLeft}
                sessionVoteCount={sessionVoteCount}
                notVotedUserCount={notVotedUserCount}
                sessionCandidates={sessionCandidates}
                candidateVotes={candidateVotes}
                users={users}
              />
            </Card>
          ) : (
            <Card 
              title="Session Control"
              style={{ marginBottom: '16px' }}
            >
              <Empty
                description="No active voting session"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <SessionControl
                  votingActive={votingActive}
                  onStartSession={startVotingSession}
                  onStopSession={stopVotingSession}
                  users={users}
                />
              </Empty>
            </Card>
          )}

          {/* Recent Sessions */}
          <Card title="Recent Sessions">
            <List
              dataSource={recentSessions}
              locale={{ emptyText: "No sessions yet" }}
              renderItem={(session) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<TrophyOutlined />} 
                        style={{ backgroundColor: session.status === 'active' ? '#52c41a' : '#1890ff' }}
                      />
                    }
                    title={
                      <Space>
                        <span>Session {session.sessionId?.slice(-6) || 'Unknown'}</span>
                        <Tag color={session.status === 'active' ? 'green' : 'blue'}>
                          {session.status || 'completed'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>Started: {session.startTime || 'Unknown'}</div>
                        <div>Votes: {session.voteCount || 0}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Column - Vote Activity */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <HistoryOutlined />
                <span>Live Activity</span>
              </Space>
            }
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => setVoteLogOpen(true)}
              >
                View All
              </Button>
            }
          >
            <Timeline
              items={recentVoteActivity.map(activity => ({
                color: activity.type === 'system' ? 'blue' : 'green',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {activity.type === 'system' ? activity.action : `${activity.voter} voted`}
                    </div>
                    {activity.candidate && (
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        for {activity.candidate}
                      </div>
                    )}
                    <div style={{ color: '#999', fontSize: '11px' }}>
                      {activity.time}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Vote Log Drawer */}
      <Drawer
        title="Vote Activity Log"
        placement="right"
        onClose={() => setVoteLogOpen(false)}
        open={voteLogOpen}
        width={400}
      >
        <Timeline>
          {recentVoteActivity.map(activity => (
            <Timeline.Item
              key={activity.id}
              color={activity.type === 'system' ? 'blue' : 'green'}
            >
              <div>
                <div style={{ fontWeight: 500 }}>
                  {activity.type === 'system' ? activity.action : `${activity.voter} voted`}
                </div>
                {activity.candidate && (
                  <div style={{ color: '#666' }}>
                    for {activity.candidate}
                  </div>
                )}
                <div style={{ color: '#999', fontSize: '12px' }}>
                  {activity.time}
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Drawer>
    </div>
  );
}

export default Dashboard;
