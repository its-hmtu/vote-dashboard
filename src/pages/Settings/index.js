// import React, { useState, useEffect, useMemo } from "react";
// import { Typography, Card, Form, Input, Button, Switch, Divider, message, Spin, Alert } from "antd";
// import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
// import { FirebaseService } from "../../services/firebaseService";
// import { SESSION_CONFIG } from "../../constants";

// const { Title, Paragraph } = Typography;

// function Settings() {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [settings, setSettings] = useState({});
//   const [hasChanges, setHasChanges] = useState(false);

//   // Default settings based on current SESSION_CONFIG
//   const defaultSettings = useMemo(() => ({
//     maxSessionDuration: SESSION_CONFIG.MAX_DURATION * 60, // Convert minutes to seconds
//     maxCandidates: SESSION_CONFIG.TYPES.ELECTION.MAX_CANDIDATES || 10,
//     minCandidates: SESSION_CONFIG.MIN_CANDIDATES,
//     autoRefresh: true,
//     refreshInterval: 5, // seconds
//     showVoteLogs: true,
//     enableNotifications: true,
//   }), []);

//   // Load settings on component mount
//   useEffect(() => {
//     const loadSettings = async () => {
//       try {
//         const savedSettings = await FirebaseService.getSettings();
//         const mergedSettings = { ...defaultSettings, ...savedSettings };
//         setSettings(mergedSettings);
//         form.setFieldsValue(mergedSettings);
//       } catch (error) {
//         console.error('Error loading settings:', error);
//         message.error('Failed to load settings');
//         // Use default settings if loading fails
//         setSettings(defaultSettings);
//         form.setFieldsValue(defaultSettings);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadSettings();
//   }, [form, defaultSettings]);

//   // Listen for settings changes in real-time
//   useEffect(() => {
//     const unsubscribe = FirebaseService.listenToSettings((updatedSettings) => {
//       const mergedSettings = { ...defaultSettings, ...updatedSettings };
//       setSettings(mergedSettings);
//       form.setFieldsValue(mergedSettings);
//       setHasChanges(false);
//     });

//     return unsubscribe;
//   }, [form, defaultSettings]);

//   const onFinish = async (values) => {
//     setSaving(true);
//     try {
//       await FirebaseService.saveSettings(values);
//       setSettings(values);
//       setHasChanges(false);
//       message.success('Settings saved successfully!');
//     } catch (error) {
//       console.error('Error saving settings:', error);
//       message.error('Failed to save settings. Please try again.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const onFormChange = () => {
//     setHasChanges(true);
//   };

//   const handleReset = () => {
//     form.setFieldsValue(settings);
//     setHasChanges(false);
//     message.info('Form reset to last saved values');
//   };

//   const handleRestoreDefaults = async () => {
//     try {
//       setSaving(true);
//       await FirebaseService.saveSettings(defaultSettings);
//       setSettings(defaultSettings);
//       form.setFieldsValue(defaultSettings);
//       setHasChanges(false);
//       message.success('Settings restored to defaults!');
//     } catch (error) {
//       console.error('Error restoring defaults:', error);
//       message.error('Failed to restore default settings');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div style={{ textAlign: 'center', padding: '50px' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: 16 }}>Loading settings...</div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <Title level={2}>Settings</Title>
      
//       {hasChanges && (
//         <Alert
//           message="You have unsaved changes"
//           description="Don't forget to save your settings before leaving this page."
//           type="warning"
//           showIcon
//           style={{ marginBottom: 24 }}
//         />
//       )}
      
//       <Card style={{ marginBottom: 24 }}>
//         <Title level={4}>System Configuration</Title>
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={onFinish}
//           onValuesChange={onFormChange}
//         >
//           <Form.Item
//             name="maxSessionDuration"
//             label="Maximum Session Duration (seconds)"
//             rules={[
//               { required: true, message: 'Please input maximum session duration!' },
//               { 
//                 type: 'number', 
//                 min: 60, 
//                 max: 86400, 
//                 message: 'Duration must be between 60 and 86400 seconds (1 minute to 24 hours)' 
//               }
//             ]}
//             extra="Maximum time limit for voting sessions (60 seconds to 24 hours)"
//           >
//             <Input type="number" min={60} max={86400} />
//           </Form.Item>

//           <Form.Item
//             name="maxCandidates"
//             label="Maximum Candidates per Session"
//             rules={[
//               { required: true, message: 'Please input maximum candidates!' },
//               { 
//                 type: 'number', 
//                 min: 2, 
//                 max: 50, 
//                 message: 'Must be between 2 and 50 candidates' 
//               }
//             ]}
//             extra="Maximum number of candidates allowed in election sessions"
//           >
//             <Input type="number" min={2} max={50} />
//           </Form.Item>

//           <Form.Item
//             name="minCandidates"
//             label="Minimum Candidates per Session"
//             rules={[
//               { required: true, message: 'Please input minimum candidates!' },
//               { 
//                 type: 'number', 
//                 min: 2, 
//                 max: 10, 
//                 message: 'Must be between 2 and 10 candidates' 
//               }
//             ]}
//             extra="Minimum number of candidates required to start an election"
//           >
//             <Input type="number" min={2} max={10} />
//           </Form.Item>

//           <Form.Item
//             name="refreshInterval"
//             label="Auto Refresh Interval (seconds)"
//             rules={[
//               { required: true, message: 'Please input refresh interval!' },
//               { 
//                 type: 'number', 
//                 min: 1, 
//                 max: 60, 
//                 message: 'Must be between 1 and 60 seconds' 
//               }
//             ]}
//             extra="How often the dashboard refreshes automatically when enabled"
//           >
//             <Input type="number" min={1} max={60} />
//           </Form.Item>

//           <Divider />

//           <Form.Item
//             name="autoRefresh"
//             label="Auto Refresh Dashboard"
//             valuePropName="checked"
//             extra="Automatically refresh dashboard data at regular intervals"
//           >
//             <Switch />
//           </Form.Item>

//           <Form.Item
//             name="showVoteLogs"
//             label="Show Vote Logs"
//             valuePropName="checked"
//             extra="Display detailed vote logs in session results"
//           >
//             <Switch />
//           </Form.Item>

//           <Form.Item
//             name="enableNotifications"
//             label="Enable Notifications"
//             valuePropName="checked"
//             extra="Show success/error notifications for user actions"
//           >
//             <Switch />
//           </Form.Item>

//           <Divider />

//           <Form.Item>
//             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 icon={<SaveOutlined />}
//                 loading={saving}
//                 disabled={!hasChanges}
//               >
//                 Save Settings
//               </Button>
//               <Button 
//                 onClick={handleReset}
//                 icon={<ReloadOutlined />}
//                 disabled={!hasChanges}
//               >
//                 Reset
//               </Button>
//               <Button 
//                 danger
//                 onClick={handleRestoreDefaults}
//                 loading={saving}
//               >
//                 Restore Defaults
//               </Button>
//             </div>
//           </Form.Item>
//         </Form>
//       </Card>

//       <Card>
//         <Title level={4}>About</Title>
//         <Paragraph>
//           <strong>Voting Dashboard v1.0.0</strong>
//         </Paragraph>
//         <Paragraph>
//           A real-time voting system with Firebase integration and ESP32 hardware support.
//         </Paragraph>
//         <Paragraph>
//           <strong>Features:</strong>
//           <ul>
//             <li>Real-time voting sessions with RFID card support</li>
//             <li>Election and question-based voting types</li>
//             <li>Live analytics and session management</li>
//             <li>User management with card scanning</li>
//             <li>Responsive web interface</li>
//           </ul>
//         </Paragraph>
//         <Paragraph type="secondary">
//           Last settings update: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}
//         </Paragraph>
//       </Card>
//     </div>
//   );
// }

// export default Settings;
