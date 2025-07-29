import React from "react";
import { Button, Form, Space, Typography } from "antd";
import { PlayCircleOutlined, StopOutlined } from "@ant-design/icons";
import SessionConfigModal from "./SessionConfigModal";

const { Text } = Typography;

function SessionControl({
  votingActive,
  onStartSession,
  onStopSession,
  users,
}) {
  const [sessionModal, setSessionModal] = React.useState(false);
  const [form] = Form.useForm();

  const handleStartSession = async (sessionConfig) => {
    const success = await onStartSession(sessionConfig);
    if (success) {
      setSessionModal(false);
      form.resetFields();
    }
  };

  const handleOpenModal = () => {
    if (users.length < 2) {
      // Could show a message here
      return;
    }
    setSessionModal(true);
  };

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            {!votingActive ? (
              <Space direction="vertical" align="center">
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleOpenModal}
                  size="large"
                  disabled={users.length < 2}
                >
                  Start Voting Session
                </Button>
                {users.length < 2 && (
                  <Text type="secondary">
                    You need at least 2 users to start a voting session
                  </Text>
                )}
              </Space>
            ) : (
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                onClick={onStopSession}
                size="large"
              >
                Stop Voting Session
              </Button>
            )}
          </div>
        </Space>
      </div>

      <SessionConfigModal
        open={sessionModal}
        onCancel={() => setSessionModal(false)}
        onStartSession={handleStartSession}
        users={users}
        form={form}
      />
    </>
  );
}

export default SessionControl;
