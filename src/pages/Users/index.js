import React from "react";
import { Typography } from "antd";
import UserManagement from "./UserManagement";
import { useVotingContext } from "../../contexts/VotingContext";

const { Title } = Typography;

function Users() {
  const { users, addUser, removeUser, updateUser } = useVotingContext();

  return (
    <div>
      <Title level={2}>User Management ({users.length})</Title>

      <UserManagement
        users={users}
        onAddUser={addUser}
        onRemoveUser={removeUser}
        onEditUser={updateUser}
      />
    </div>
  );
}

export default Users;
