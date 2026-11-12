import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import SideMenu from '@/components/SideMenu'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, height: 56, lineHeight: '56px' }}>
        <AppHeader />
      </Header>
      <Layout>
        <Sider width={240} theme="dark">
          <SideMenu />
        </Sider>
        <Content style={{ background: '#f5f5f5', padding: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}