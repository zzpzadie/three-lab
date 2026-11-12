# 目标/实现/踩坑/面试题

## 目标

从零搭起 Three.js 最小闭环：**Scene → Mesh → Camera → Renderer → 动画循环**，并理解父子层级、窗口自适应、轨道控制器与资源销毁。

具体要搞懂：

- 几何体 + 材质如何组成 `Mesh`，以及 `scene.add` 与 `parent.add(child)` 的区别
- 透视相机 `fov / aspect / near / far`，以及 `position` + `lookAt` 如何取景
- 渲染器尺寸必须跟挂载容器对齐，resize 时同步更新相机投影矩阵
- `requestAnimationFrame` 动画循环；用 `THREE.Timer`（替代已弃用的 `Clock`）测帧间隔
- `OrbitControls` 控制的是**相机**，不是几何体
- React 卸载 / 热更新时如何 `dispose`，避免监听器与动画泄漏

## 实现
场景代码用表格列出主/子物体、相机、resize、Timer 动画循环、控制器和 dispose
| 模块 | 做法 |
|------|------|
| 场景与主物体 | `Scene` + `BoxGeometry` + `ShaderMaterial`（自定义片元；也可换成 `MeshBasicMaterial`）组成主立方体 |
| 子物体层级 | 4 个小立方体用极坐标 `(cosθ·r, 0, sinθ·r)` 绕父物体一周，`cube.add(child)`，随父物体一起转 |
| 辅助线 | `AxesHelper(5)` 标出 XYZ |
| 相机 | `PerspectiveCamera(75, aspect, 0.1, 1000)`，放在 `(5,5,5)` 看向原点 |
| 渲染器 | `WebGLRenderer` 挂到 `host`；`setSize` + `setPixelRatio(min(dpr, 2))` |
| 窗口自适应 | 用 `host.clientWidth/Height`（不是 `window`）；改 `camera.aspect` 后必须 `updateProjectionMatrix()` |
| 动画 | `Timer.update` → `renderer.render` → `cube.rotateY` → `requestAnimationFrame` |
| 交互 | `OrbitControls`：阻尼 / 缩放 / 平移 / 旋转 |
| 销毁 | `dispose()`：取消 rAF、卸 resize、`controls.dispose()`；页面侧再 dispose 几何/材质/renderer |

入口：`index.tsx` 在 `useEffect` 里调用 `createBasicsScene(host)`，依赖 `sceneVersion` 以便热更新时重建。

## 踩坑
### useEffect 依赖 sceneVersion：自动销毁旧场景并重建
场合：除了手动改代码热更新
用户点「重置场景」
切换示例 / 切换模型配置
画布尺寸容器从 display:none 变成可见且要重配 renderer

## 面试题
Three.js 渲染流程？右手坐标系？MVP 矩阵？

### 窗口自适应 
浏览器窗口大小改变时，3D 画面不能拉伸变形，要跟着变。
要做的三件事：
1.更新相机宽高比：

camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
2.更新渲染器尺寸：

renderer.setSize(window.innerWidth, window.innerHeight);
3.监听 
resize 事件。
#### 典型应用场景
浏览器窗口缩放 — 最常见
布局变化 — 侧栏折叠、分栏拖拽、全屏，host 宽高变了但 window 未必变（更稳妥用 ResizeObserver 听容器）
设备像素比变化 — 拖到外接屏、系统缩放变化
移动端横竖屏 — orientation 变化
静态展示页 — 产品预览、建筑效果图：无旋转动画，但要撑满容器且可缩放窗口
什么时候可以不加
画布尺寸永远固定（例如写死 800×600，也不全屏、不跟布局走）时，可以只在初始化 setSize 一次。一旦可能变，就建议保留 resize。

结论： 无动画也需要 resize（只要容器可能变）；差别只是：有动画时靠下一帧重绘，无动画时要在 resize 回调里主动 render。
