import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Divider,
  Spin,
  Alert,
} from "antd";
import { toast } from "react-toastify";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { FirebaseService } from "../../services/firebaseService";
import { SESSION_CONFIG } from "../../constants";

const { Title, Paragraph } = Typography;

function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Default settings based on current SESSION_CONFIG
  const defaultSettings = useMemo(
    () => ({
      maxSessionDuration: SESSION_CONFIG.MAX_DURATION * 60, // Convert minutes to seconds
      maxCandidates: SESSION_CONFIG.TYPES?.ELECTION?.MAX_CANDIDATES || 10,
      minCandidates: SESSION_CONFIG.MIN_CANDIDATES || 2,
      autoRefresh: true,
      refreshInterval: 5, // seconds
      showVoteLogs: true,
      enableNotifications: true,
    }),
    []
  );

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await FirebaseService.getSettings();
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        setSettings(mergedSettings);
        form.setFieldsValue(mergedSettings);
      } catch (error) {
        console.error("Error loading settings:", error);
        toast.error("Failed to load settings");
        // Use default settings if loading fails
        setSettings(defaultSettings);
        form.setFieldsValue(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form, defaultSettings]);

  // Listen for settings changes in real-time
  useEffect(() => {
    const unsubscribe = FirebaseService.listenToSettings((updatedSettings) => {
      const mergedSettings = { ...defaultSettings, ...updatedSettings };
      setSettings(mergedSettings);
      form.setFieldsValue(mergedSettings);
      setHasChanges(false);
    });

    return unsubscribe;
  }, [form, defaultSettings]);

  const onFinish = async (values) => {
    setSaving(true);
    try {
      await FirebaseService.saveSettings(values);
      setSettings(values);
      setHasChanges(false);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onFormChange = () => {
    setHasChanges(true);
  };

  const handleReset = () => {
    form.setFieldsValue(settings);
    setHasChanges(false);
    toast.info("Form reset to last saved values");
  };

  const handleRestoreDefaults = async () => {
    try {
      setSaving(true);
      await FirebaseService.saveSettings(defaultSettings);
      setSettings(defaultSettings);
      form.setFieldsValue(defaultSettings);
      setHasChanges(false);
      toast.success("Settings restored to defaults!");
    } catch (error) {
      console.error("Error restoring defaults:", error);
      toast.error("Failed to restore default settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Settings</Title>

      {hasChanges && (
        <Alert
          message="You have unsaved changes"
          description="Don't forget to save your settings before leaving this page."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Title level={4}>System Configuration</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onFormChange}
      >
        <Form.Item
          name="refreshInterval"
          label="Auto Refresh Interval (seconds)"
          rules={[
            { required: true, message: "Please input refresh interval!" },
            {
              type: "number",
              min: 1,
              max: 60,
              message: "Must be between 1 and 60 seconds",
            },
          ]}
          extra="How often the dashboard refreshes automatically when enabled"
        >
          <Input type="number" min={1} max={60} />
        </Form.Item>

        <Divider />

        <Form.Item
          name="autoRefresh"
          label="Auto Refresh Dashboard"
          valuePropName="checked"
          extra="Automatically refresh dashboard data at regular intervals"
        >
          <Switch />
        </Form.Item>
        <Divider />

        <Form.Item>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges}
            >
              Save Settings
            </Button>
            <Button
              onClick={handleReset}
              icon={<ReloadOutlined />}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Button danger onClick={handleRestoreDefaults} loading={saving}>
              Restore Defaults
            </Button>
          </div>
        </Form.Item>
      </Form>
      <Divider />
      <Title level={4}>About</Title>
      <Paragraph>
        <strong>Voting Dashboard v1.0.0</strong>
      </Paragraph>
      <Paragraph>
        A real-time voting system with Firebase integration and ESP32 hardware
        support.
      </Paragraph>
      <Paragraph>
        <strong>Features:</strong>
        <ul>
          <li>Real-time voting sessions with RFID card support</li>
          <li>Election and question-based voting types</li>
          <li>Live analytics and session management</li>
          <li>User management with card scanning</li>
          <li>Responsive web interface</li>
        </ul>
      </Paragraph>
      <Paragraph type="secondary">
        Last settings update:{" "}
        {settings.updatedAt
          ? new Date(settings.updatedAt).toLocaleString()
          : "Never"}
      </Paragraph>
    </div>
  );
}

export default Settings;
