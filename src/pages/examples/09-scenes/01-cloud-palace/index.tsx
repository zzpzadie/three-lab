// 应用场景：仙侠云海 · 白玉京
// 天上白玉京，十二楼五城。
import { useEffect, useRef, useState } from 'react'
import { createBaiyuJingScene } from './scene'
import '@/styles/layout.css'

export default function BaiyuJingPage() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [sceneVersion, setSceneVersion] = useState(0)

  useEffect(() => {
    if (!import.meta.hot) return
    import.meta.hot.accept('./scene', () => {
      setSceneVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const api = createBaiyuJingScene(host)
    return () => {
      api.dispose()
      host.replaceChildren()
    }
  }, [sceneVersion])

  return (
    <div className="example-page">
      <div ref={hostRef} className="canvas-host" />
    </div>
  )
}
