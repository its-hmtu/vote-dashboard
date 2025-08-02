import React from "react";
import { Table, Button, Badge, Dropdown, Card } from "antd";
import { EllipsisOutlined } from "@ant-design/icons";
import moment from "moment";
import { formatSeconds, sortSessions } from "../../utils";
import { MESSAGES } from "../../constants";
function SessionHistory({ sessions, onViewDetails, onRemoveSession }) {
  const sortedSessions = sortSessions(sessions)?.map((session) => ({
    ...session,
    key: session.sessionId,
  }));

  const [pageSize, setPageSize] = React.useState(10);

  const columns = [
    {
      title: "Session ID",
      dataIndex: "sessionId",
      render: (sessionId) => (
        <code style={{ fontSize: "12px" }}>{sessionId}</code>
      ),
      align: "center",
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      sorter: (a, b) => new Date(a.startTime) - new Date(b.startTime),
      align: "center",
    },
    {
      title: "End Time",
      dataIndex: "end_time",
      render: (text) =>
        text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : "-",
      align: "center",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      render: (secs) => formatSeconds(secs),
      align: "center",
    },
    {
      title: "Type",
      dataIndex: "voteType",
      render: (type) => (
        <Badge
          color={type === "election" ? "blue" : "green"}
          text={type === "election" ? "Election" : "Question"}
        />
      ),
      filters: [
        { text: "Election", value: "election" },
        { text: "Question", value: "question" },
      ],
      onFilter: (value, record) => record.voteType === value,
      align: "center",
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
        { text: "Active", value: "active" },
        { text: "Stopped", value: "stopped" },
        { text: "Completed", value: "completed" },
      ],
      onFilter: (value, record) => record.status === value,
      align: "center",
    },
    {
      title: "Total Votes",
      dataIndex: "voteCount",
      sorter: (a, b) => a.voteCount - b.voteCount,
      align: "center",
    },
    {
      title: "Not Voted Users",
      dataIndex: "notVotedUsers",
      render: (_, record) => {
        const notVotedUsers = record.notVotedUsers || [];
        return notVotedUsers.length > 0 ? (
          <span style={{ color: "#cf1322" }}>{notVotedUsers.length}</span>
        ) : (
          <span style={{ color: "#3f8600" }}>0</span>
        );
      },
      sorter: (a, b) => {
        const aCount = (a.notVotedUsers || []).length;
        const bCount = (b.notVotedUsers || []).length;
        return aCount - bCount;
      },
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          menu={{
            items: [
              {
                key: "viewDetails",
                label: "View Details",
                onClick: () => onViewDetails(record.sessionId),
              },
              {
                key: "removeSession",
                label: "Remove Session",
                danger: true,
                onClick: () => {
                  // We need to handle the confirmation here
                  if (window.confirm(MESSAGES.CONFIRMATION.REMOVE_SESSION)) {
                    onRemoveSession(record.sessionId);
                  }
                },
              },
            ],
          }}
        >
          <Button
            type="text"
            style={{ padding: 0, border: "none", background: "transparent" }}
          >
            <EllipsisOutlined />
          </Button>
        </Dropdown>
      ),
      align: "center",
    },
  ];

  return (
    <Card>
      <Table
        dataSource={sortedSessions}
        columns={columns}
        pagination={{
          pageSize: pageSize,
          onChange: (page, size) => setPageSize(size),
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
