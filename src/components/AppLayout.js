import React from "react";
import { Layout, Menu, Dropdown, Button, Avatar, message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  TeamOutlined,
  HistoryOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import AppBreadcrumb from "./AppBreadcrumb";
import { useAuth } from "../contexts/AuthContext";
import { PATH } from "../constants/PATH";

const { Content, Sider, Header } = Layout;

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      message.success("Logged out successfully");
      navigate(PATH.LOGIN);
    } catch (error) {
      message.error("Failed to log out");
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "Profile",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  const menuItems = [
    {
      key: PATH.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: PATH.SESSIONS,
      icon: <HistoryOutlined />,
      label: "Sessions",
    },
    {
      key: PATH.USERS,
      icon: <TeamOutlined />,
      label: "Users",
    },
    {
      key: PATH.ANALYTICS,
      icon: <BarChartOutlined />,
      label: "Analytics",
    },
    {
      key: PATH.SETTINGS,
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Get current selected key based on pathname
  const getSelectedKey = () => {
    const pathname = location.pathname;
    if (pathname === '/' || pathname === PATH.DASHBOARD) return PATH.DASHBOARD;
    return pathname;
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} style={{ background: "#fff" }}>
        <div style={{ padding: "16px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <h3 style={{ margin: 0, color: "#1890ff" }}>Vote Dashboard</h3>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ height: "100%", borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
            <h2 style={{ margin: 0 }}>Voting System</h2>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === "logout") {
                    handleLogout();
                  }
                },
              }}
              placement="bottomRight"
              arrow
            >
              <Button type="text" style={{ height: "auto", padding: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <span>{user?.email || "User"}</span>
                </div>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ padding: 24 }}>
          <AppBreadcrumb />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
