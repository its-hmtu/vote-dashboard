import React from "react";
import { Typography, Card, Row, Col, Statistic } from "antd";
import { useSessions, useUsers } from "../../hooks/useVoting";

const { Title } = Typography;

function Analytics() {
  const { sessions } = useSessions();
  const { users } = useUsers();

  // Calculate analytics data
  const totalSessions = sessions?.length || 0;
  const activeSessions = sessions?.filter(s => s.status === 'active')?.length || 0;
  const totalUsers = users?.length || 0;
  const totalVotes = sessions?.reduce((acc, session) => acc + (session.voteCount || 0), 0) || 0;

  return (
    <div>
      <Title level={2}>Analytics & Reports</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={totalSessions}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={activeSessions}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={totalUsers}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Votes Cast"
              value={totalVotes}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Title level={4}>Session Performance</Title>
        <p>More detailed analytics coming soon...</p>
      </Card>
    </div>
  );
}

export default Analytics;
