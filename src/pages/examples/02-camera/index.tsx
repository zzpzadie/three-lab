// 透视场景 + OrbitControls + 一个预设机位按钮
// 透视参数、damping、updateProjectionMatrix
// 学什么：透视/正交相机、OrbitControls、视锥体、Raycaster、屏幕坐标转世界坐标、相机动画。
// 实战：点击物体高亮，双击聚焦，相机平滑移动。
// 验收：

// 能实现点击拾取并解释 Raycaster 原理。

// 能处理相机 aspect 随窗口变化。

// 能写相机缓动动画。
import { useEffect, useRef, type MouseEvent } from 'react'
import { createCameraScene } from './cameraScene'
import '@/styles/layout.css'
import * as THREE from 'three'
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
const Btn = styled.button`
  display: block;
  width: 100px;
  height: 40px;
  background-color: #000;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  border-radius: 4px;
  padding: 10px;
  margin: 10px;
  &:hover {
    background-color: #333;
    color: #fff;
  }
`
export default function CameraPage() {
  const hostRef = useRef<HTMLDivElement>(null)
  const tanglinRef = useRef<ReturnType<typeof createCameraScene>>(null)

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    tanglinRef.current?.handleClick(event.nativeEvent)
  }
  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    tanglinRef.current?.handleDoubleClick(event.nativeEvent)
  }
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const tanglin = createCameraScene(host)
    tanglinRef.current = tanglin
    return () => {
      tanglin.dispose()
      // tanglin.cube.geometry.dispose()
      // const { material } = tanglin.cube
      // if (Array.isArray(material)) {
      //   material.forEach((m) => m.dispose())
      // } else {
      //   material.dispose()
      // }
      tanglin.renderer.dispose()
      tanglin.renderer.domElement.remove()
      host.replaceChildren()
    }
  }, [])

  return (
    <div className="example-page">
      <Btn type='button'  className='btn' onClick={() => tanglinRef.current?.smoothMoveCamera(new THREE.Vector3(0, 0, 0))}>平滑移动</Btn>
      <CanvasHost ref={hostRef} onClick={handleClick} onDoubleClick={handleDoubleClick} />
    </div>
  )
}

