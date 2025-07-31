import React from "react";
import { Button, Dropdown } from "antd";
import {
  EllipsisOutlined,
} from "@ant-design/icons";
import { MESSAGES } from "../../constants";

function UserActions({ user, onEdit, onRemove, disabled = false }) {
  const handleRemove = () => {
    onRemove(user.uid, user.name);
  };

  const handleEdit = () => {
    onEdit(user.uid, user.name);
  }

  return (
    <Dropdown
      trigger={["click"]}
      menu={{
        items: [
          {
            key: "editUser",
            label: "Edit User",
            onClick: () => handleEdit(),
          },
          {
            key: "removeUser",
            label: "Remove User",
            danger: true,
            onClick: () => {
              // We need to handle the confirmation here
              if (window.confirm(MESSAGES.CONFIRMATION.REMOVE_USER)) {
                handleRemove();
              }
            },
          },
        ],
      }}
    >
      <Button
        type="text"
        style={{ padding: 0, border: "none", background: "transparent" }}
      >
        <EllipsisOutlined />
      </Button>
    </Dropdown>
  );
}

export default UserActions;
