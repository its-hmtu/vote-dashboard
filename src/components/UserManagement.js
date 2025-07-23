import React from "react";
import { Table, Button, Card, Typography, Form } from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import moment from "moment";
import AddUserModal from "./AddUserModal";
import UserActions from "./UserActions";

const { Title, Text } = Typography;

function UserManagement({ users, onAddUser, onRemoveUser }) {
  const [adding, setAdding] = React.useState(false);
  const [form] = Form.useForm();

  const handleNew = () => {
    setAdding(true);
    form.resetFields();
  };

  const handleAddUser = async (uid, name) => {
    await onAddUser(uid, name);
    setAdding(false);
  };

  const columns = [
    { 
      title: "Name", 
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    { 
      title: "Card UID", 
      dataIndex: "uid",
      render: (uid) => (
        <Text code style={{ fontFamily: "monospace" }}>{uid}</Text>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (text) => moment(text).format("YYYY-MM-DD HH:mm:ss"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <UserActions
          user={record}
          onRemove={onRemoveUser}
        />
      ),
    },
  ];

  return (
    <Card style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          User Management ({users.length} users)
        </Title>
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
          pageSize: 10,
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
    </Card>
  );
}

export default UserManagement;
