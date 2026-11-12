// 学什么：环境光、平行光、点光、聚光、阴影贴图、HDRI、色调映射、曝光。
// 实战：室内产品展示，带阴影、环境反射、聚光灯。
// 验收：

// 能调阴影 bias、mapSize、camera 范围。

// 能解释阴影贴图原理和性能代价。

// 能用 HDRI 做环境光照。
// 面试题：阴影如何生成？PBR 与 Lambert/Phong 区别？
import { useEffect, useRef, useState } from 'react'
import { createHDRScene } from './hdrScene'
import '@/styles/layout.css'

export default function HDRPage() {
  const hostRef = useRef<HTMLDivElement>(null)
  // scene.ts 热更新时递增，触发下面 useEffect 重建场景
  const [sceneVersion, setSceneVersion] = useState(0)

  useEffect(() => {
    if (!import.meta.hot) return
    import.meta.hot.accept('./hdrScene', () => {
      setSceneVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const tanglin = createHDRScene(host)

    return () => {
      tanglin.dispose()
      tanglin.renderer.dispose()
      tanglin.renderer.domElement.remove()
      host.replaceChildren()
    }
  }, [sceneVersion])

  return (
    <div className="example-page">
      <div ref={hostRef} className="canvas-host" />
    </div>
  )
}
