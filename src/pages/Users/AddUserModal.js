import React from "react";
import { Modal, Form, Input, Button, Alert, Space } from "antd";
import { ScanOutlined } from "@ant-design/icons";
import { useCardScanning } from "../../hooks/useVoting";
import { FirebaseService } from "../../services/firebaseService";
import { validateUser } from "../../utils/validation";

function AddUserModal({ open, onCancel, onAddUser, form }) {
  const { waitingForCard, listenForCard, stopListening } = useCardScanning();
  const [cardScanned, setCardScanned] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    // Start listening for card when modal opens
    FirebaseService.setCreateMode(true);
    const unsubscribe = listenForCard((uid) => {
      form.setFieldsValue({ uid });
      setCardScanned(true);
    });

    return () => {
      unsubscribe();
      stopListening();
    };
  }, [open, form, listenForCard, stopListening]);

  const handleCancel = () => {
    stopListening();
    FirebaseService.setCreateMode(false);
    form.resetFields();
    setCardScanned(false);
    onCancel();
  };

  const handleSubmit = async (values) => {
    const validation = validateUser(values.uid, values.name);
    
    if (!validation.isValid) {
      // Set form errors
      validation.errors.forEach((error, index) => {
        const field = error.includes('UID') ? 'uid' : 'name';
        form.setFields([
          {
            name: field,
            errors: [error],
          },
        ]);
      });
      return;
    }

    await onAddUser(values.uid.trim(), values.name.trim());
    handleCancel();
  };

  return (
    <Modal
      title="Add New User"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={500}
    >
      <div style={{ marginBottom: 16 }}>
        {!cardScanned ? (
          <Alert
            message="Scan Card Required"
            description="Please scan your RFID card to register a new user."
            type="info"
            icon={<ScanOutlined />}
            showIcon
          />
        ) : (
          <Alert
            message="Card Scanned Successfully"
            description="Card detected! Please enter the user's name."
            type="success"
            showIcon
          />
        )}
      </div>

      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item 
          label="Card UID" 
          name="uid" 
          rules={[{ required: true, message: 'Please scan your card' }]}
        >
          <Input 
            placeholder="Please scan your card" 
            readOnly 
          />
        </Form.Item>
        
        <Form.Item 
          label="User Name" 
          name="name" 
          rules={[
            { required: true, message: 'Please enter user name' },
            { min: 2, message: 'Name must be at least 2 characters' },
            { max: 50, message: 'Name must be less than 50 characters' },
          ]}
        >
          <Input 
            placeholder="Enter user name" 
            disabled={waitingForCard || !cardScanned}
            maxLength={50}
          />
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              disabled={waitingForCard || !cardScanned}
              loading={waitingForCard}
            >
              {waitingForCard ? "Waiting for card..." : "Save User"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddUserModal;
