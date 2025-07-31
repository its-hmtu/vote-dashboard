import React, { useEffect } from "react";
import { Modal, Form, Input } from "antd";

function EditUserModal({ open, onCancel, onEditUser, form, user }) {
  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        name: user.name,
        uid: user.uid,
      });
    }
  }, [open, user, form]);

  const handleFinish = (values) => {
    onEditUser(user.uid, values.name);
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Edit User"
      open={open}
      onOk={() => form.submit()}
      onCancel={handleCancel}
      width={500}
    >
      <Form form={form} onFinish={handleFinish} layout="vertical">
        <Form.Item
          name="name"
          label="User Name"
          rules={[
            { required: true, message: "Please enter the user's name" },
            { min: 2, message: "Name must be at least 2 characters" },
            { max: 50, message: "Name must be less than 50 characters" },
          ]}
        >
          <Input placeholder="Enter user name" />
        </Form.Item>
        
        <Form.Item
          name="uid"
          label="Card UID"
          rules={[{ required: true, message: "Please enter the card UID" }]}
          help="Card UID cannot be changed"
        >
          <Input placeholder="Enter card UID" disabled />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default EditUserModal;
