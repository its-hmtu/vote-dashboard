import React from "react";
import { Button, Space, Popconfirm } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { MESSAGES } from "../constants";

function UserActions({ user, onEdit, onRemove, disabled = false }) {
  const handleRemove = () => {
    onRemove(user.uid, user.name);
  };

  return (
    <Space size="small">
      {onEdit && (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(user)}
          disabled={disabled}
          size="small"
        >
          Edit
        </Button>
      )}
      
      <Popconfirm
        title="Remove User"
        description={`${MESSAGES.CONFIRMATION.REMOVE_USER} ${user.name} (${user.uid})?`}
        onConfirm={handleRemove}
        okText="Yes"
        cancelText="No"
        disabled={disabled}
      >
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          disabled={disabled}
          size="small"
        >
          Remove
        </Button>
      </Popconfirm>
    </Space>
  );
}

export default UserActions;
