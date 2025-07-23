import React from "react";
import { Layout } from "antd";

const { Content } = Layout;

function AppLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        {children}
      </Content>
    </Layout>
  );
}

export default AppLayout;
