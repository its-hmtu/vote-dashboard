import React from "react";
import { Layout, Menu, Dropdown, Button, Avatar, message, Tooltip } from "antd";
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
import AppBreadcrumb from "../AppBreadcrumb";
import { useAuth } from "../../contexts/AuthContext";
import { PATH } from "../../constants/PATH";

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

  const menuItems = [
    {
      key: PATH.DASHBOARD,
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: PATH.ANALYTICS,
      icon: <BarChartOutlined />,
      label: "Analytics",
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
    if (pathname === "/" || pathname === PATH.DASHBOARD) return PATH.DASHBOARD;
    return pathname;
  };

  return (
    <Layout>
      <Sider
        style={{
          overflowY: "auto",
          overflowX: "hidden",
          height: "100vh",
          position: "sticky",
          insetInlineStart: 0,
          top: 0,
          bottom: 0,
          scrollbarWidth: "thin",
          zIndex: 10,
        }}
      >
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0, 21, 41, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <h2 style={{ margin: 0 }}>Voting System</h2>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{user?.email || "User"}</span>
              <Tooltip title="Logout">
                <Button type="text" onClick={handleLogout}>
                  <LogoutOutlined />
                </Button>
              </Tooltip>
            </div>
          </div>
        </Header>

        <Content style={{ padding: 24, minHeight: "100vh" }}>
          <AppBreadcrumb />
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
