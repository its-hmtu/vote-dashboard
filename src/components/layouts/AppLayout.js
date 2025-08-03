import React, { useState } from "react";
import { Layout, Menu, Button, Tooltip, Typography } from "antd";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  TeamOutlined,
  HistoryOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import AppBreadcrumb from "../AppBreadcrumb";
import { useAuth } from "../../contexts/AuthContext";
import { PATH } from "../../constants/PATH";

const { Content, Sider, Header } = Layout;
const { Title } = Typography;

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate(PATH.LOGIN);
    } catch (error) {
      toast.error("Failed to log out");
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
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={60}
        style={{
          boxShadow: "2px 0 6px rgba(0, 21, 41, 0.08)",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "0 16px",
            background: "rgba(255, 255, 255, 0.1)",
            margin: "16px 8px",
            borderRadius: 8,
          }}
        >
          {!collapsed ? (
            <Title
              level={4}
              style={{
                color: "white",
                margin: 0,
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              Vote System
            </Title>
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#1890ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
              }}
            >
              V
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            border: "none",
            background: "transparent",
          }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0, 21, 41, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 32,
                height: 32,
              }}
            />
            <AppBreadcrumb />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#666", fontSize: "14px" }}>
              {user?.email || "User"}
            </span>
            <Tooltip title="Logout">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                style={{
                  color: "#666",
                  borderRadius: "6px",
                }}
              />
            </Tooltip>
          </div>
        </Header>

        <Content
          style={{
            padding: 24,
            background: "#f5f5f5",
            overflow: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 24,
              minHeight: "calc(100vh - 112px)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
