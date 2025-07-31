import React from "react";
import { Table, Button, Card, Typography, Form } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import moment from "moment";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import UserActions from "./UserActions";

const { Title, Text } = Typography;

function UserManagement({ users, onAddUser, onRemoveUser, onEditUser }) {
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [pageSize, setPageSize] = React.useState(10);

  const handleNew = () => {
    setAdding(true);
    form.resetFields();
  };

  const handleAddUser = async (uid, name) => {
    await onAddUser(uid, name);
    setAdding(false);
  };

  const handleEditUser = (uid, name) => {
    const user = users.find(u => u.uid === uid);
    setSelectedUser(user);
    setEditing(true);
  };

  const handleUpdateUser = async (uid, name) => {
    await onEditUser(uid, name);
    setEditing(false);
    setSelectedUser(null);
  };

  const columns = [
    { 
      title: "Name", 
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      align: 'center'
    },
    { 
      title: "Card UID", 
      dataIndex: "uid",
      render: (uid) => (
        <Text code style={{ fontFamily: "monospace" }}>{uid}</Text>
      ),
      align: 'center'
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text) => moment(text).format("YYYY-MM-DD HH:mm:ss"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      align: 'center'
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <UserActions
          user={record}
          onRemove={onRemoveUser}
          onEdit={handleEditUser}
        />
      ),
      align: 'center'
    },
  ];

  return (
      <Card>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleNew}
          >
            Add New User
          </Button>
        </div>
        <Table
          dataSource={users}
          columns={columns}
          pagination={{
            pageSize: pageSize,
            onChange: (page, size) => setPageSize(size),
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          size="small"
          rowKey="uid"
        />
        <AddUserModal
          open={adding}
          onCancel={() => setAdding(false)}
          onAddUser={handleAddUser}
          form={form}
        />
        <EditUserModal
          open={editing}
          onCancel={() => setEditing(false)}
          onEditUser={handleUpdateUser}
          form={editForm}
          user={selectedUser}
        />
      </Card>
  );
}

export default UserManagement;
