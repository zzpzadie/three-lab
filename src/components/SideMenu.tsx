// 侧边栏组件

import { Menu } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getMajor } from '@/data/catalog'
import { useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

export default function SideMenu() {
  const navigate = useNavigate()
  const { majorId = 'three', subId } = useParams()
  const major = getMajor(majorId)
  if (!major) return null
  const items = major.groups.map((g) => ({
    key: g.id,
    label: g.title,
    children: g.children.map((s) => ({
      key: s.id,          // 注意：key 是子分组 id，不是 example.path
      label: s.title,
    })),
  }))

  // 当前项所属分组默认展开
  // const openKeys = groups.filter((g) =>
  //   catalog.some((c) => c.group === g && c.path === pathname),
  // )
 // 当前子菜单所属的一级分组
 const parentKey = useMemo(
    () => major.groups.find((g) => g.children.some((s) => s.id === subId))?.id,
    [major, subId],
  )
  const [openKeys, setOpenKeys] = useState<string[]>(
    () => [parentKey ?? major.groups[0]?.id].filter(Boolean) as string[],
  )
  // 路由变化时展开对应分组（返回 /three/2.1 时打开「2」）
  useEffect(() => {
    if (!parentKey) return
    setOpenKeys((keys) => (keys.includes(parentKey) ? keys : [...keys, parentKey]))
  }, [parentKey])
  return (
    <Menu
      theme="dark"
      mode="inline"
    
      selectedKeys={subId ? [subId] : []}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      items={items}
      onClick={({ key }) => {
        if (key.includes('.')) navigate(`/${majorId}/${key}`)
      }}
    />
  )
}