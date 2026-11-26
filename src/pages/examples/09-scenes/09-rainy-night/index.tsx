// 应用场景：雨夜小城
// 巷子在下雨 · 参考 yisky/rainy-night-webgpu
import { useEffect, useRef, useState } from 'react'
import { createRainyNightScene } from './scene'
import '@/styles/layout.css'

export default function RainyNightPage() {
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

    const api = createRainyNightScene(host)
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
