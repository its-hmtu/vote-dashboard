import React from "react";
import { Typography } from "antd";
import { UserManagement } from "../../components";
import { useUsers } from "../../hooks/useVoting";

const { Title } = Typography;

function Users() {
  const { users, addUser, removeUser } = useUsers();

  return (
    <div>
      <Title level={2}>User Management</Title>
      
      {/* User Management Section */}
      <UserManagement
        users={users}
        onAddUser={addUser}
        onRemoveUser={removeUser}
      />
    </div>
  );
}

export default Users;
