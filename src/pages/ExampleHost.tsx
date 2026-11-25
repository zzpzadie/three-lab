// 全屏示例的入口壳
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import Basics from './examples/01-basics'
import Camera from './examples/02-camera'
import GeometryMaterial from './examples/03-geometry-material'
import LightShadow from './examples/04-light-shadow/LightShadow'
import LightShadowHDR from './examples/04-light-shadow/hdr'
import ModelAnimation from './examples/05-model/01-model-animation'
import ModelVideo from './examples/05-model/02-model-video'
import Interaction from './examples/06-interaction/01-model-animation'
import BaiyuJing from './examples/09-scenes/01-cloud-palace'
import '@/styles/layout.css'
import { findSubIdByExample } from '@/data/catalog'

const pages: Record<string, React.ComponentType> = {
  '01-basics': Basics,
  '02-camera': Camera,
  '03-geometry-material': GeometryMaterial,
  '04-light-shadow': LightShadow,
  '04-light-shadow-hdr': LightShadowHDR,
  '05-model-animation': ModelAnimation,
  '05-model-video': ModelVideo,
  '06-interaction': Interaction,
  '09-baiyu-jing': BaiyuJing,
}

const Host = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0b0f17;
`

const BackLink = styled(Link)`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1;
  text-decoration: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.28);
    color: #fff;
  }

  &:active {
    transform: translateY(1px);
  }
`

const Missing = styled.div`
  padding: 24px;
  color: #1f1f1f;

  a {
    color: #1677ff;
  }
`

export default function ExampleHost() {
  const { majorId = 'three', exampleId = '' } = useParams()
  const Page = pages[exampleId]
  const subId = findSubIdByExample(majorId, exampleId)
  const backTo = subId ? `/${majorId}/${subId}` : `/${majorId}`
  
  if (!Page) {
    return (
      <Missing>
        <p>未找到示例：{exampleId}</p>
        <Link to={`/${majorId}`}>← 返回</Link>
      </Missing>
    )
  }

  return (
    <Host>
      <BackLink to={backTo}>← 返回列表</BackLink>

      <Page />
    </Host>
  )
}
