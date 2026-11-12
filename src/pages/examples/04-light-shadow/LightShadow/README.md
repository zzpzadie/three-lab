# 目标/实现/踩坑/题

## 目标
地面 + 物体 + Directional 阴影

学什么：环境光、平行光、点光、聚光、阴影贴图、HDRI、色调映射、曝光。
实战：室内产品展示，带阴影、环境反射、聚光灯。
验收：

能调阴影 bias、mapSize、camera 范围。

能解释阴影贴图原理和性能代价。

能用 HDRI 做环境光照。
面试题：阴影如何生成？PBR 与 Lambert/Phong 区别？

## 实现
### 阴影贴图原理和性能代价

**原理（Shadow Mapping）**
1. 从光源视角渲染场景，只写深度，得到一张 shadow map（深度纹理）。
2. 主相机正常着色时：把片元变换到光源空间，采样 shadow map。
3. 若「片元到灯的深度」>「shadow map 里记的深度」→ 被挡住 → 进阴影变暗。

平行光用正交阴影相机；聚光用透视阴影相机（跟锥体相关）。  
Three.js 里要：`renderer.shadowMap.enabled` + `light.castShadow` + `mesh.castShadow` / `receiveShadow`。

**常调参数**
| 参数 | 作用 | 代价/副作用 |
|------|------|-------------|
| `mapSize`（如 512→2048） | 阴影更锐 | 显存↑、带宽↑、多一次更大 RT |
| `bias` / `normalBias` | 消 acne / peter-panning | 过大阴影脱离；过小条纹噪点 |
| `shadow.camera` near/far/范围 | 阴影覆盖体积 | 范围太大 → 深度精度差、糊；太小 → 裁切 |

**性能代价**
- 每盏 `castShadow` 的灯 ≈ 至少多 1 次 depth pass（整场景或部分物体）。
- mapSize² 显存；多灯阴影近似线性变贵。
- 移动端优先少灯投阴影、降 mapSize、收紧 shadow camera。

改完 `shadow.camera` 的 near/far 等后要 `updateProjectionMatrix()`；Helper 只是可视化，另调 `helper.update()`。

### HDRI 做环境光照

- `HDRLoader` 加载 `.hdr` → `texture.mapping = EquirectangularReflectionMapping`
- `scene.environment = hdri`：给 Standard/Physical 做 IBL（环境光+反射）
- `scene.background = hdri`：才能看见全景天空（只设 environment 背景仍是纯色）
- 某材质若写了 `material.envMap`，会覆盖该材质对 `scene.environment` 的使用
- 常配合 `toneMapping`（如 ACESFilmic）+ `toneMappingExposure`；HDR 很亮时曝光过大易洗掉灯光/阴影

## 踩坑
### 修改后要调用更新方法
1.改了.shadow.camera设置光源阴影渲染范围要调用potLight.shadow.camera.updateProjectionMatrix()更新
2.CameraHelper(spotLight.shadow.camera) 画出来的那一圈「视锥线框」。
CameraHelper 在创建时按当时的相机矩阵生成线段；之后你改了 near/far 或灯动了，线框不会自动跟着变，要：
spotLight.shadow.camera.updateProjectionMatrix() // 先让相机矩阵正确
shadowCamHelper.update()                         // 再按新矩阵重画辅助线，只影响调试可视化，不影响真实阴影计算。没加 CameraHelper 就不用写这行
3.对象： new THREE.SpotLightHelper(spotLight) 那根圆锥线。
它根据灯的 世界坐标 position、target、angle、distance 重算锥体几何。创建时画一次；之后这些变了要手动 update()。
## 题

### 阴影如何生成？
阴影怎么生成？ 灯光视角渲染深度图 → 主相机渲染时比较深度 → 在阴影里则变暗；代价是多一次（或多次）shadow pass + 大贴图。
### PBR 与 Lambert/Phong 区别？

PBR vs Lambert/Phong？ Standard/Physical 用能量守恒、金属度/粗糙度、环境贴图；Lambert/Phong 是经验模型，高光不物理、环境反射弱。