import React, { useState } from "react";
import { Modal, Form, Input, Select, Radio, Button, Space } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { SESSION_CONFIG, VOTE_TYPES } from "../../constants";
import { validateSessionDuration, validateSessionConfig, validateCandidates } from "../../utils/validation";

const { Option } = Select;

function SessionConfigModal({
  open,
  onCancel,
  onStartSession,
  users,
  form,
}) {
  const [voteType, setVoteType] = useState(VOTE_TYPES.ELECTION);

  const handleFinish = (values) => {
    // Convert duration to number to ensure proper validation
    const duration = Number(values.duration);
    
    // Validate before submission
    if (!validateSessionDuration(duration)) {
      form.setFields([
        {
          name: 'duration',
          errors: [`Duration must be between ${SESSION_CONFIG.MIN_DURATION} and ${SESSION_CONFIG.MAX_DURATION} minutes`],
        },
      ]);
      return;
    }

    // Validate session config based on vote type
    const items = voteType === VOTE_TYPES.ELECTION ? values.candidates : values.questions;
    const validation = validateSessionConfig(voteType, items, users);
    
    if (!validation.isValid) {
      const fieldName = voteType === VOTE_TYPES.ELECTION ? 'candidates' : 'questions';
      form.setFields([
        {
          name: fieldName,
          errors: validation.errors,
        },
      ]);
      return;
    }

    onStartSession({
      duration,
      voteType,
      ...(voteType === VOTE_TYPES.ELECTION ? { candidates: values.candidates } : { questions: values.questions }),
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setVoteType(VOTE_TYPES.ELECTION);
    onCancel();
  };

  const handleVoteTypeChange = (e) => {
    const newVoteType = e.target.value;
    setVoteType(newVoteType);
    // Update form value
    form.setFieldValue('voteType', newVoteType);
    // Clear related fields when switching vote type
    form.setFieldsValue({
      candidates: undefined,
      questions: undefined,
    });
  };

  return (
    <Modal
      title="Configure Voting Session"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      width={700}
      maskClosable={false}
    >
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="duration"
          label={`Session Duration (${SESSION_CONFIG.MIN_DURATION}-${SESSION_CONFIG.MAX_DURATION} minutes)`}
          rules={[
            { required: true, message: "Please input session duration" },
            {
              validator: (_, value) => {
                const numValue = Number(value);
                if (isNaN(numValue) || numValue < SESSION_CONFIG.MIN_DURATION || numValue > SESSION_CONFIG.MAX_DURATION) {
                  return Promise.reject(
                    new Error(`Duration must be between ${SESSION_CONFIG.MIN_DURATION} and ${SESSION_CONFIG.MAX_DURATION} minutes`)
                  );
                }
                return Promise.resolve();
              },
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
          name="voteType"
          label="Vote Type"
          rules={[{ required: true, message: "Please select vote type" }]}
          initialValue={VOTE_TYPES.ELECTION}
        >
          <Radio.Group onChange={handleVoteTypeChange} value={voteType}>
            <Radio value={VOTE_TYPES.ELECTION}>Election (Choose candidates)</Radio>
            <Radio value={VOTE_TYPES.QUESTION}>Question (Yes/No answers)</Radio>
          </Radio.Group>
        </Form.Item>

        {voteType === VOTE_TYPES.ELECTION && (
          <Form.Item
            name="candidates"
            label={`Select Candidates (min: ${SESSION_CONFIG.TYPES[VOTE_TYPES.ELECTION].MIN_CANDIDATES}, max: ${users.length})`}
            rules={[
              {
                required: true,
                message: `Please select at least ${SESSION_CONFIG.TYPES[VOTE_TYPES.ELECTION].MIN_CANDIDATES} candidates`,
              },
              {
                validator: (_, value) => {
                  if (!validateCandidates(value, users)) {
                    const config = SESSION_CONFIG.TYPES[VOTE_TYPES.ELECTION];
                    return Promise.reject(
                      new Error(`Please select ${config.MIN_CANDIDATES} to ${users.length} candidates`)
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
              maxCount={users.length}
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
        )}

        {voteType === VOTE_TYPES.QUESTION && (
          <Form.List
            name="questions"
            rules={[
              {
                validator: async (_, questions) => {
                  if (!questions || questions.length < SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION].MIN_QUESTIONS) {
                    return Promise.reject(new Error(`At least ${SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION].MIN_QUESTIONS} question is required`));
                  }
                  if (questions.length > SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION].MAX_QUESTIONS) {
                    return Promise.reject(new Error(`Maximum ${SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION].MAX_QUESTIONS} questions allowed`));
                  }
                },
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <Form.Item label="Questions">
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'text']}
                        rules={[
                          { required: true, message: 'Question text is required' },
                          { min: 5, message: 'Question must be at least 5 characters' },
                          { max: 200, message: 'Question must be less than 200 characters' },
                        ]}
                      >
                        <Input placeholder="Enter question" style={{ width: 400 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      disabled={fields.length >= SESSION_CONFIG.TYPES[VOTE_TYPES.QUESTION].MAX_QUESTIONS}
                    >
                      Add Question
                    </Button>
                  </Form.Item>
                </Form.Item>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        )}
      </Form>
    </Modal>
  );
}

export default SessionConfigModal;
