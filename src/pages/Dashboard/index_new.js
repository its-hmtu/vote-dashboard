import React, { useState, useMemo } from "react";
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
  Tag,
  Alert,
} from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  HistoryOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";
import CurrentSessionDashboard from "./CurrentSessionDashboard";
import LatestSessionResults from "./LatestSessionResults";
import SessionControl from "./SessionControl";
import { useVotingContext } from "../../contexts/VotingContext";
import { useSessions } from "../../hooks/useVoting";
import { useVoteActivity } from "../../hooks/useVoteActivity";
import { calculateSessionResults } from "../../utils/formatters";

const { Title } = Typography;

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

  // Get real-time vote activity
  const recentVoteActivity = useVoteActivity(sessions, users, 10);

  // Enhanced dashboard analytics with trends
  const dashboardAnalytics = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        activeSessions: 0,
        totalUsers: users?.length || 0,
        avgParticipationRate: 0,
        participationTrend: null,
        sessionTrend: null,
        recentSessions: [],
        currentSession: null,
        lowParticipationSessions: 0,
        todaySessions: 0
      };
    }

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => s.status === "stopped").length;
    const activeSessions = sessions.filter((s) => s.status === "active").length;
    const totalUsers = users?.length || 0;

    // Calculate participation rates for trend analysis
    const sessionsWithResults = sessions
      .filter(s => s.status === "stopped")
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    let avgParticipationRate = 0;
    let participationTrend = null;
    let lowParticipationSessions = 0;

    if (sessionsWithResults.length > 0) {
      const participationRates = sessionsWithResults.map(session => {
        const results = calculateSessionResults(session, {}, users);
        if (results.participationRate < 50) lowParticipationSessions++;
        return results.participationRate;
      });

      avgParticipationRate = participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length;

      // Calculate trend (last 3 vs previous 3 sessions)
      if (participationRates.length >= 3) {
        const recent = participationRates.slice(0, 3).reduce((sum, rate) => sum + rate, 0) / 3;
        const previous = participationRates.length >= 6 
          ? participationRates.slice(3, 6).reduce((sum, rate) => sum + rate, 0) / 3
          : recent;
        
        participationTrend = {
          direction: recent > previous ? 'up' : recent < previous ? 'down' : 'stable',
          change: Math.abs(recent - previous),
          isSignificant: Math.abs(recent - previous) > 5
        };
      }
    }

    // Session trend (this week vs last week)
    const now = moment();
    const thisWeekSessions = sessions.filter(s => 
      moment(s.startTime).isAfter(now.clone().startOf('week'))
    ).length;
    const lastWeekSessions = sessions.filter(s => 
      moment(s.startTime).isBetween(
        now.clone().subtract(1, 'week').startOf('week'),
        now.clone().startOf('week')
      )
    ).length;

    const sessionTrend = {
      direction: thisWeekSessions > lastWeekSessions ? 'up' : thisWeekSessions < lastWeekSessions ? 'down' : 'stable',
      change: Math.abs(thisWeekSessions - lastWeekSessions),
      isSignificant: Math.abs(thisWeekSessions - lastWeekSessions) > 0
    };

    // Today's sessions
    const todaySessions = sessions.filter(s => 
      moment(s.startTime).isSame(now, 'day')
    ).length;

    // Recent sessions (last 5)
    const recentSessions = sessions
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 5);

    // Current active session
    const currentSession = sessions.find(s => s.status === "active");

    return {
      totalSessions,
      completedSessions,
      activeSessions,
      totalUsers,
      avgParticipationRate: Math.round(avgParticipationRate),
      participationTrend,
      sessionTrend,
      recentSessions,
      currentSession,
      lowParticipationSessions,
      todaySessions,
      thisWeekSessions,
      lastWeekSessions
    };
  }, [sessions, users]);

  // Enhanced statistic card component
  const StatisticCard = ({ title, value, prefix, color, trend, suffix, extra }) => (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic
          title={title}
          value={value}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{ color }}
        />
        {trend && (
          <div style={{ textAlign: 'right' }}>
            {trend.isSignificant && (
              <div style={{ 
                color: trend.direction === 'up' ? '#52c41a' : trend.direction === 'down' ? '#ff4d4f' : '#8c8c8c',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                {trend.direction === 'up' && <ArrowUpOutlined />}
                {trend.direction === 'down' && <ArrowDownOutlined />}
                {trend.change > 0 && `${trend.change.toFixed(1)}${suffix || ''}`}
              </div>
            )}
          </div>
        )}
      </div>
      {extra && (
        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>
          {extra}
        </div>
      )}
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard Overview
          </Title>
          <div style={{ marginTop: 4, color: '#8c8c8c' }}>
            {dashboardAnalytics.todaySessions > 0 && (
              <span>{dashboardAnalytics.todaySessions} sessions today • </span>
            )}
            Last updated: {moment().format('HH:mm')}
          </div>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setVoteLogOpen(true)}
              type="text"
            />
            {votingActive ? (
              <Badge dot color="green">
                <Button
                  type="primary"
                  icon={<PauseCircleOutlined />}
                  onClick={stopVotingSession}
                  danger
                />
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

      {/* Current Session Alert */}
      {dashboardAnalytics.currentSession && (
        <Alert
          message="Live Voting Session"
          description={
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>
                <strong>{dashboardAnalytics.currentSession.sessionId?.split("session_")[1] || 'Unknown'}</strong> • 
                Type: {dashboardAnalytics.currentSession.voteType || 'election'} • 
                Started: {moment(dashboardAnalytics.currentSession.startTime).fromNow()}
              </span>
              <Badge status="processing" text="Active" />
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Enhanced Analytics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Total Sessions"
            value={dashboardAnalytics.totalSessions}
            prefix={<TrophyOutlined />}
            color="#3f8600"
            trend={dashboardAnalytics.sessionTrend}
            extra={`${dashboardAnalytics.thisWeekSessions} this week`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Completed Sessions"
            value={dashboardAnalytics.completedSessions}
            prefix={<CheckCircleOutlined />}
            color="#1890ff"
            extra={dashboardAnalytics.activeSessions > 0 ? `${dashboardAnalytics.activeSessions} active` : 'All completed'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Avg Participation"
            value={dashboardAnalytics.avgParticipationRate}
            suffix="%"
            prefix={<TeamOutlined />}
            color={dashboardAnalytics.avgParticipationRate > 70 ? "#52c41a" : dashboardAnalytics.avgParticipationRate > 50 ? "#faad14" : "#ff4d4f"}
            trend={dashboardAnalytics.participationTrend}
            extra={dashboardAnalytics.lowParticipationSessions > 0 ? `${dashboardAnalytics.lowParticipationSessions} low participation` : 'Good engagement'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatisticCard
            title="Total Users"
            value={dashboardAnalytics.totalUsers}
            prefix={<UserOutlined />}
            color="#722ed1"
            extra="Registered voters"
          />
        </Col>
      </Row>

      {/* Current Session Dashboard */}
      {votingActive && (
        <CurrentSessionDashboard
          votingActive={votingActive}
          sessionTimeLeft={sessionTimeLeft}
          sessionVoteCount={sessionVoteCount}
          notVotedUserCount={notVotedUserCount}
          sessionCandidates={sessionCandidates}
          candidateVotes={candidateVotes}
          users={users}
        />
      )}

      {/* Main Content Layout */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={16}>
          <LatestSessionResults sessions={sessions} users={users} />
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Recent Sessions</span>
                <Badge 
                  count={dashboardAnalytics.activeSessions} 
                  style={{ backgroundColor: '#52c41a' }}
                  size="small"
                />
              </div>
            }
          >
            <List
              dataSource={dashboardAnalytics.recentSessions}
              locale={{ emptyText: "No sessions yet" }}
              renderItem={(session) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={session.status === "active" ? <ClockCircleOutlined /> : <TrophyOutlined />}
                        style={{
                          backgroundColor:
                            session.status === "active" ? "#52c41a" : "#1890ff",
                        }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          Session{" "}
                          {session.sessionId?.split("session_")[1]?.slice(-6) || "Unknown"}
                        </span>
                        <div>
                          <Tag
                            color={session.status === "active" ? "green" : "blue"}
                            size="small"
                          >
                            {session.status === "active" ? "Live" : "Completed"}
                          </Tag>
                          <Tag
                            color={session.voteType === "election" ? "blue" : "orange"}
                            size="small"
                          >
                            {session.voteType || "election"}
                          </Tag>
                        </div>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {moment(session.startTime).fromNow()} • 
                          Votes: {session.voteCount || 0}
                          {session.status === "active" && (
                            <span style={{ marginLeft: 8 }}>
                              <Badge status="processing" text="In Progress" />
                            </span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            {dashboardAnalytics.recentSessions.length === 0 && (
              <Empty 
                description="No sessions yet" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ margin: '20px 0' }}
              />
            )}
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
        {recentVoteActivity.length > 0 ? (
          <Timeline>
            {recentVoteActivity.map((activity) => (
              <Timeline.Item
                key={activity.id}
                color={activity.type === "system" ? "blue" : "green"}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {activity.type === "system"
                      ? activity.action
                      : `${activity.voter} voted`}
                  </div>
                  {activity.candidate && activity.type !== "system" && (
                    <div style={{ color: "#666" }}>
                      for {activity.candidate}
                    </div>
                  )}
                  {activity.sessionType && (
                    <Tag
                      size="small"
                      color={
                        activity.sessionType === "election" ? "blue" : "green"
                      }
                      style={{ marginTop: 4 }}
                    >
                      {activity.sessionType}
                    </Tag>
                  )}
                  <div style={{ color: "#999", fontSize: "12px" }}>
                    {activity.time}
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty
            description="No vote activity yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Drawer>
    </div>
  );
}

export default Dashboard;
