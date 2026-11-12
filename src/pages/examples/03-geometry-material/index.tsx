/**几何材质
 * 实战：程序化地形、粒子星系、自定义 BufferGeometry 几何体。
 * 验收：
 * - 能手写顶点和索引创建几何体
 * - 能解释 UV、法线、切线的作用
 * - 能处理纹理颜色空间和重复包裹
 * 面试题：
 * - BufferGeometry 为什么比旧 Geometry 快？
 * - PBR 材质常用参数有哪些？
 * **/
import { useEffect, useRef} from 'react'
import { createGeometryMaterialScene } from './geometryMaterialScene.ts'
import '@/styles/layout.css'
import styled from 'styled-components'
const CanvasHost = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`
export default function GeometryMaterialPage() {
  const hostRef = useRef<HTMLDivElement>(null)
  const tanglinRef = useRef<ReturnType<typeof createGeometryMaterialScene>>(null)


  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const tanglin = createGeometryMaterialScene(host)
    tanglinRef.current = tanglin
    return () => {
      tanglin.dispose()
      tanglin.renderer.dispose()
      tanglin.renderer.domElement.remove()
      host.replaceChildren()
    }
  }, [])

  return (
    <div className="example-page">
      <CanvasHost ref={hostRef} />
    </div>
  )
}

