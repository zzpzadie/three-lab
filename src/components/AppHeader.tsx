// # 顶栏组件
import { useLocation, NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { majors } from '@/data/catalog'

/** 与 AppLayout Sider 宽度一致 */
const SIDER_WIDTH = 240

const AppHeaderContainer = styled.div`
  display: grid;
  grid-template-columns: ${SIDER_WIDTH}px 1fr auto;
  grid-template-areas: 'title nav github';
  align-items: center;
  height: 56px;
`

const AppHeaderTitle = styled.h1`
  grid-area: title;
  margin: 0;
  width: ${SIDER_WIDTH}px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  line-height: 56px;
`

const AppHeaderNav = styled.nav`
  grid-area: nav;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px;
  min-width: 0;

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    padding: 0 20px;
    height: 56px;
    font-size: 15px;
    white-space: nowrap;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.85);
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }

    &.active {
      color: #ff4d4f;
      font-weight: 600;
    }
  }
`

const AppHeaderRight = styled.div`
  grid-area: github;
  display: flex;
  align-items: center;
  padding-right: 20px;

  a {
    padding: 0 12px;
    font-size: 14px;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;

    &:hover {
      color: #fff;
    }
  }
`

export default function AppHeader() {
  const { pathname } = useLocation()

  return (
    <AppHeaderContainer>
      <AppHeaderTitle>Three Lab</AppHeaderTitle>
      <AppHeaderNav>
        {majors.map((m) => (
          <NavLink
            key={m.id}
            to={`/${m.id}`}
            className={() => (pathname.startsWith(m.path) ? 'active' : undefined)}
          >
            {m.title}
          </NavLink>
        ))}
      </AppHeaderNav>
      <AppHeaderRight>
        <a
          href="https://github.com/zzpzadie/three-lab"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </AppHeaderRight>
    </AppHeaderContainer>
  )
}
