import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import GalleryPage from './pages/Home'
import ExampleHost from './pages/ExampleHost'

export default function App() {
  return (
    <HashRouter>
    <Routes>
      {/* 画廊壳：顶栏 + 侧栏 */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/three/1.1" replace />} />
        <Route path="/:majorId" element={<GalleryPage />} />
        <Route path="/:majorId/:subId" element={<GalleryPage />} />
      </Route>

      {/* 示例全屏：无 Header / Sider */}
      <Route path="/examples/:majorId/:exampleId" element={<ExampleHost />} />
    </Routes>
    </HashRouter>
  )
}