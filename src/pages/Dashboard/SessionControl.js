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
  buttonOnly = false,
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
      {buttonOnly ? (
        // Simple button mode for header
        !votingActive ? (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleOpenModal}
            disabled={users.length < 2}
          >
            Start Voting Session
          </Button>
        ) : null
      ) : (
        // Full control panel mode
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
                  />
                
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
      )}

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
