// 项目专为入门设计，涵盖视图场景、界面操作、影像地形等核心概念。
// 练习重点：从零搭建第一个地球，并逐个拆解示例中的初始化参数。
import { useEffect, useRef, useState } from 'react'
import { createBasicsScene } from './scene'
import '@/styles/layout.css'

export default function BasicsPage() {
  const hostRef = useRef<HTMLDivElement>(null)
  // scene.ts 热更新时递增，触发下面 useEffect 重建场景
  const [sceneVersion, setSceneVersion] = useState(0)

  const tanglinRef = useRef<ReturnType<typeof createBasicsScene>>(null)
  useEffect(() => {
    if (!import.meta.hot) return
    import.meta.hot.accept('./scene', () => {
      setSceneVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const tanglin = createBasicsScene(host)
    tanglinRef.current = tanglin
    return () => {
      tanglin.dispose()
      host.replaceChildren()
    }
  }, [sceneVersion])
 
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log('handleClick index.tsx', event)
    tanglinRef.current?.handleClick(event.nativeEvent)
  }
  return (
    <div className="example-page">
      <div ref={hostRef}  onClick={handleClick} className="canvas-host" />
    </div>
  )
}
