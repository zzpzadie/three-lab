# 目标/实现/踩坑/面试题

## 目标

在基础场景之上，搞懂**相机取景、轨道控制、射线拾取、机位动画**。

具体要搞懂：

- 透视相机 `fov / aspect / near / far` 构成视锥体；resize 时同步 `aspect` + `updateProjectionMatrix`
- `OrbitControls`：阻尼 / 缩放 / 平移 / 旋转；`target` 是旋转中心，和 `lookAt` 要对齐
- `Raycaster`：屏幕点击 → NDC → 射线 → 与物体求交（高亮和聚焦共用这条拾取链路）
- **点击高亮**：命中后只改材质颜色；未命中则恢复颜色（不改相机）
- **双击聚焦**：命中后改 `camera.position` + `lookAt` + `controls.target`；空白处回到 `(5,5,5)`
- 相机平滑移动：用时间进度 + `Vector3.lerp` 做缓动，并能飞回起点且不卡死控制器

验收：能解释 Raycaster；aspect 随容器变化；能写出可往返的相机缓动。

## 实现

入口：`index.tsx` 挂载画布，绑定 click / dblclick，按钮调用 `smoothMoveCamera`；场景逻辑在 `cameraScene.ts`。

| 模块 | 做法 |

|------|------|

| 场景物体 | 三个球体组成 `Group`，加环境光 + 平行光（Lambert 才看得见） |

| 相机 | `PerspectiveCamera(75, aspect, 0.1, 1000)`，初始 `(5,5,5)` 看向原点 |

| 渲染 / resize | 尺寸用 `host.clientWidth/Height`；改 `aspect` 后必须 `updateProjectionMatrix()` |

| 轨道控制 | `OrbitControls`：`enableDamping`；无持续 rAF 时靠 `change` 事件 `render`；程序改机位后要 `controls.update()` |

| 点击高亮 | 同样走 Raycaster 拾取 → `highlightObject` 改 `material.color`；未命中 `unhighlightObject` 恢复原色 |

| 双击聚焦 | 同样走 Raycaster 拾取 → `focusObject`：相机挪到物体旁 + `lookAt(物体)` + `controls.target` 同步；空白处 `unfocusObject` 回到 `(5,5,5)` |

| 平滑移动 | `performance.now` 算进度 `t∈[0,1]`；`camera.position.copy(start).lerp(end, t)`；动画中 `controls.enabled = false`；结束后用 `thenHome` 飞回一次再重新启用控制器 |

两者区别：**高亮动材质，聚焦动机位**；拾取步骤相同，命中后的处理不同。

### 透视投影与视锥体

`fov, aspect, near, far` 构成四棱台视锥体，只有视锥体内的物体才会被渲染。

### Raycaster 原理

在 CPU 上从相机发出一根“针”，把二维鼠标映射到三维模型。

- **Ray**（起点 + 方向）：几何基础
- **Raycaster**：拿 Ray 与物体求交的工具；可手动喂 Ray，也可用鼠标 + 相机自动生成
- **物体**：  求交的对象，其世界坐标（由 updateMatrixWorld 维护）决定了能否被命中
- 鼠标只是自动生成 Ray 的一种输入，不是必要条件



### 屏幕坐标 → NDC → 世界坐标

```js

const x = (px / width) * 2 - 1

const y = -(py / height) * 2 + 1

```

| 坐标 | 含义 |

|------|------|

| `clientX/Y` | 相对浏览器视口，不受页面滚动影响 |

| `offsetX/Y` | 相对事件源（Canvas）左上角，拾取时常用 |

| `screenX/Y` | 相对整块显示器 |

| NDC（标准坐标） | -1～1，原点在屏幕中心，Raycaster 的输入 |

| 世界坐标 | 

```markdown
这是 Three.js 三维场景中的三维坐标 (x, y, z)。你无法直接从鼠标事件里拿到它。流程是：先获取 clientX/Y，将其转换为 NDC（标准化设备坐标），再通过 Raycaster 发射射线，射线与物体表面相交后返回的交点 hit.point 才是世界坐标。hit.point 完全依赖于射线的起点和方向，射线不同，交点自然不同
```

 |

### 相机平滑移动（lerp）

不瞬移，而是在时长内插值：`结果 = start + (end - start) * t`。

- `Vector3.lerp(目标, t)`：在**当前向量**与目标之间插；应先 `copy(固定起点)` 再 `lerp`
- `MathUtils.lerp(x, y, t)`：`t=0` 得 x，`t=1` 得 y
- 反向：对调起终点，或用 `1 - t`

往返用参数控制，例如 `smoothMoveCamera(target, thenHome = true)`，回家时传 `false`，避免结束回调再次触发回家。

## 踩坑



### 1. 平滑目标写成物体中心 `(0,0,0)`

相机会飞进模型内部，被 `near` 裁掉，画面变空。旁观机位应离开物体一段距离（如 `(0,5,10)`）。

### 2. `lerp` 每帧在已变化的 `position` 上累加

错误：`camera.position.lerp(end, progress)`（`this` 每帧都在变）。  

正确：`camera.position.copy(start).lerp(end, t)`，起点固定，只推进 `t`。

### 3. 回家动画无限递归

结束时无条件调用 `smoothMoveCamera(home)`，回家结束后又进同一分支 → rAF 永不停止，每帧覆盖 `camera.position`，轨道缩放/旋转失效。  

解决：第二次调用传 `thenHome: false`，并在最终结束时 `controls.enabled = true`。

### 4. 只改 `camera.position`，不改 `lookAt` / `controls.target`

OrbitControls 绕 `target` 转；程序改机位后要对齐「朝哪看」和「绕哪转」，并 `controls.update()`（尤其开了 damping）。

### 5. 动画与控制器抢控制权

平滑过程中应 `controls.enabled = false`，结束再打开，避免拖拽与 lerp 互相覆盖。

### 6. 拾取用错尺寸基准

NDC 分母要用 canvas/`host` 宽高，不要用整窗；监听绑在 host 上时用 `offsetX/Y`（或按 getBoundingClientRect 换算）。

### 7. 改了 `aspect` 却忘记 `updateProjectionMatrix`

投影矩阵不更新，画面会拉伸变形。

## 面试题

- 视锥体四个参数各自影响什么？`near` 太大切掉近处物体会怎样？
- Raycaster 从点击到命中的完整链路？NDC 为什么 Y 要取负？
- 点击高亮和双击聚焦共用拾取，后续分别改什么？
- `camera.lookAt` 和 `controls.target` 分别管什么？为什么程序改机位后两者都要动？
- `Vector3.lerp` 与 `MathUtils.lerp` 参数有何不同？为何必须基于固定起点每帧重算？
- 开了 `enableDamping` 时，为什么需要周期性 `controls.update()`？

