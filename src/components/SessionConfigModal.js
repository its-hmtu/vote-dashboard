import React from "react";
import { Modal, Form, Input, Select } from "antd";
import { SESSION_CONFIG } from "../constants";
import { validateSessionDuration, validateCandidates } from "../utils/validation";

const { Option } = Select;

function SessionConfigModal({
  open,
  onCancel,
  onStartSession,
  users,
  form,
}) {
  const handleFinish = (values) => {
    // Validate before submission
    if (!validateSessionDuration(values.duration)) {
      form.setFields([
        {
          name: 'duration',
          errors: [`Duration must be between ${SESSION_CONFIG.MIN_DURATION} and ${SESSION_CONFIG.MAX_DURATION} minutes`],
        },
      ]);
      return;
    }

    if (!validateCandidates(values.candidates)) {
      form.setFields([
        {
          name: 'candidates',
          errors: [`Please select ${SESSION_CONFIG.MIN_CANDIDATES} to ${SESSION_CONFIG.MAX_CANDIDATES} candidates`],
        },
      ]);
      return;
    }

    onStartSession(values.duration, values.candidates);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Configure Voting Session"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      width={600}
      destroyOnClose
    >
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="duration"
          label={`Session Duration (${SESSION_CONFIG.MIN_DURATION}-${SESSION_CONFIG.MAX_DURATION} minutes)`}
          rules={[
            { required: true, message: "Please input session duration" },
            {
              type: 'number',
              min: SESSION_CONFIG.MIN_DURATION,
              max: SESSION_CONFIG.MAX_DURATION,
              message: `Duration must be between ${SESSION_CONFIG.MIN_DURATION} and ${SESSION_CONFIG.MAX_DURATION} minutes`,
            },
          ]}
        >
          <Input 
            type="number" 
            min={SESSION_CONFIG.MIN_DURATION} 
            max={SESSION_CONFIG.MAX_DURATION}
            placeholder={`Enter duration (${SESSION_CONFIG.MIN_DURATION}-${SESSION_CONFIG.MAX_DURATION} minutes)`}
          />
        </Form.Item>
        
        <Form.Item
          name="candidates"
          label={`Select Candidates (${SESSION_CONFIG.MIN_CANDIDATES}-${SESSION_CONFIG.MAX_CANDIDATES})`}
          rules={[
            {
              required: true,
              message: `Please select ${SESSION_CONFIG.MIN_CANDIDATES} to ${SESSION_CONFIG.MAX_CANDIDATES} candidates`,
            },
            {
              validator: (_, value) => {
                if (!validateCandidates(value)) {
                  return Promise.reject(
                    new Error(`Please select ${SESSION_CONFIG.MIN_CANDIDATES} to ${SESSION_CONFIG.MAX_CANDIDATES} candidates`)
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select candidates"
            maxCount={SESSION_CONFIG.MAX_CANDIDATES}
            optionFilterProp="label"
            showSearch
          >
            {users.map((user) => (
              <Option key={user.uid} value={user.uid} label={user.name}>
                {user.name} ({user.uid})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default SessionConfigModal;
