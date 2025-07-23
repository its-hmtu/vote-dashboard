import React from "react";
import { Layout } from "antd";

const { Content, Sider, Header } = Layout;

function AppLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} style={{ background: "#fff" }}>
        {/* You can add a sidebar here if needed */}
      </Sider>
      <Layout>
        <Header />
        <Content style={{ padding: 24 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}

export default AppLayout;
