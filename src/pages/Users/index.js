import React from "react";
import { Typography } from "antd";
import { UserManagement } from "../../components";
import { useVotingContext } from "../../contexts/VotingContext";

const { Title } = Typography;

function Users() {
  const { users, addUser, removeUser } = useVotingContext();

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
