import React from "react";
import { Table, Button, Badge, Card, Typography, Space, Popconfirm } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import moment from "moment";
import { formatSeconds, sortSessions } from "../utils";
import { MESSAGES } from "../constants";

const { Title } = Typography;

function SessionHistory({ sessions, onViewDetails, onRemoveSession }) {
  const sortedSessions = sortSessions(sessions)?.map((session) => ({ 
    ...session,
    key: session.sessionId,
  }));

  const columns = [
    { 
      title: "Session ID", 
      dataIndex: "sessionId",
      render: (sessionId) => (
        <code style={{ fontSize: '12px' }}>{sessionId}</code>
      ),
    },
    { 
      title: "Start Time", 
      dataIndex: "startTime",
      sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime),
    },
    {
      title: "End Time",
      dataIndex: "end_time",
      render: (text) =>
        text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : "-",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      render: (secs) => formatSeconds(secs),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Badge
          status={
            status === "active"
              ? "processing"
              : status === "stopped"
              ? "error"
              : "default"
          }
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Stopped', value: 'stopped' },
        { text: 'Completed', value: 'completed' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    { 
      title: "Total Votes", 
      dataIndex: "voteCount",
      sorter: (a, b) => a.voteCount - b.voteCount,
    },
    {
      title: "Not Voted Users",
      dataIndex: "notVotedUsers",
      render: (_, record) => {
        const notVotedUsers = record.notVotedUsers || [];
        return notVotedUsers.length > 0 ? (
          <span style={{ color: '#cf1322' }}>{notVotedUsers.length}</span>
        ) : (
          <span style={{ color: '#3f8600' }}>0</span>
        );
      },
      sorter: (a, b) => {
        const aCount = (a.notVotedUsers || []).length;
        const bCount = (b.notVotedUsers || []).length;
        return aCount - bCount;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record.sessionId)}
            size="small"
          >
            View
          </Button>
          <Popconfirm
            title="Remove Session"
            description={MESSAGES.CONFIRMATION.REMOVE_SESSION}
            onConfirm={() => onRemoveSession(record.sessionId)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Remove
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ marginTop: 24 }}>
      <Title level={4}>Session History ({sessions?.length || 0} sessions)</Title>
      <Table
        dataSource={sortedSessions}
        columns={columns}
        pagination={{ 
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} sessions`,
        }}
        size="small"
        scroll={{ x: 1000 }}
      />
    </Card>
  );
}

export default SessionHistory;
