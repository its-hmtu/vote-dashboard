import React from "react";
import { Typography, Card, Form, Input, Button, Switch, Divider } from "antd";

const { Title, Paragraph } = Typography;

function Settings() {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log('Settings saved:', values);
  };

  return (
    <div>
      <Title level={2}>Settings</Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>System Configuration</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            autoRefresh: true,
            maxSessionDuration: 3600,
            maxCandidates: 10,
          }}
        >
          <Form.Item
            name="maxSessionDuration"
            label="Maximum Session Duration (seconds)"
            rules={[{ required: true, message: 'Please input maximum session duration!' }]}
          >
            <Input type="number" min={60} max={86400} />
          </Form.Item>

          <Form.Item
            name="maxCandidates"
            label="Maximum Candidates per Session"
            rules={[{ required: true, message: 'Please input maximum candidates!' }]}
          >
            <Input type="number" min={2} max={20} />
          </Form.Item>

          <Form.Item
            name="autoRefresh"
            label="Auto Refresh Dashboard"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Title level={4}>About</Title>
        <Paragraph>
          Voting Dashboard v1.0.0
        </Paragraph>
        <Paragraph>
          A real-time voting system with Firebase integration.
        </Paragraph>
      </Card>
    </div>
  );
}

export default Settings;
