import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 雨夜小城 · 巷子在下雨
 * 参考 yisky/rainy-night-webgpu：雨丝、湿路、河灯、涟漪与偶发闪电
 * （WebGL 程序化简化版，便于本仓库学习与扩展）
 */
export function createRainyNightScene(host: HTMLDivElement) {
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0c1828, 0.018)
  scene.background = new THREE.Color(0x070c14)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200)
  camera.position.set(-1.2, 2.6, 11.5)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setClearColor(0x070c14, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  host.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.055
  controls.target.set(0.5, 1.6, -1.5)
  controls.minDistance = 4
  controls.maxDistance = 22
  controls.maxPolarAngle = Math.PI * 0.48
  controls.update()

  // —— 夜空 ——
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 24, 12),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x05080f) },
        mid: { value: new THREE.Color(0x0c1a2e) },
        bottom: { value: new THREE.Color(0x152438) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 top;
        uniform vec3 mid;
        uniform vec3 bottom;
        varying vec3 vPos;
        void main() {
          float h = normalize(vPos).y;
          vec3 col = mix(bottom, mid, smoothstep(-0.2, 0.35, h));
          col = mix(col, top, smoothstep(0.2, 0.95, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  )
  scene.add(sky)

  scene.add(new THREE.AmbientLight(0x4a5a78, 1.1))
  scene.add(new THREE.HemisphereLight(0x5a7090, 0x1a1e28, 0.85))

  const moon = new THREE.DirectionalLight(0xa8b8d0, 0.9)
  moon.position.set(-12, 18, 6)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.camera.near = 2
  moon.shadow.camera.far = 40
  moon.shadow.camera.left = -16
  moon.shadow.camera.right = 16
  moon.shadow.camera.top = 16
  moon.shadow.camera.bottom = -16
  scene.add(moon)

  // 巷中补光，避免立面死黑
  const fillA = new THREE.PointLight(0xffb070, 2.4, 16, 1.6)
  fillA.position.set(0, 3.2, 0.5)
  scene.add(fillA)
  const fillB = new THREE.PointLight(0x7090c0, 1.6, 18, 1.6)
  fillB.position.set(-2, 4, 4)
  scene.add(fillB)

  const wood = mat(0x5a4538, 0.88, 0.05)
  const plaster = mat(0x6a7584, 0.86, 0.02)
  const roof = mat(0x3a4450, 0.78, 0.08)
  const stone = mat(0x55606c, 0.88, 0.04)

  // —— 街巷体块 ——
  const alley = new THREE.Group()
  scene.add(alley)

  box(alley, [22, 0.18, 5.2], [0, 0.09, 0], stone) // 石板路
  box(alley, [22, 0.12, 3.4], [0, 0.04, -4.4], mat(0x1c222c, 0.55, 0.15)) // 河岸
  // 河面
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0c1828,
    roughness: 0.18,
    metalness: 0.55,
    emissive: 0x061018,
    emissiveIntensity: 0.35,
  })
  const water = box(alley, [22, 0.04, 2.6], [0, -0.02, -6.2], waterMat)
  water.receiveShadow = true

  // 两侧店面
  const leftRow = [
    { x: -7.2, w: 4.2, d: 3.2, h: 4.6, windows: 3 },
    { x: -2.6, w: 3.6, d: 3.0, h: 3.8, windows: 2 },
    { x: 1.8, w: 4.0, d: 3.4, h: 5.2, windows: 3 },
    { x: 6.6, w: 3.8, d: 3.1, h: 4.2, windows: 2 },
  ]
  const rightRow = [
    { x: -6.5, w: 3.8, d: 2.8, h: 3.6, windows: 2 },
    { x: -2.2, w: 4.2, d: 3.0, h: 4.8, windows: 3 },
    { x: 2.4, w: 3.6, d: 2.9, h: 3.9, windows: 2 },
    { x: 6.8, w: 4.0, d: 3.2, h: 5.0, windows: 3 },
  ]

  for (const b of leftRow) addShop(alley, b, -2.85, plaster, wood, roof, 1)
  for (const b of rightRow) addShop(alley, b, 2.7, plaster, wood, roof, -1)

  // 石桥
  const bridge = new THREE.Group()
  bridge.position.set(0.4, 0, -4.2)
  alley.add(bridge)
  box(bridge, [3.2, 0.22, 4.6], [0, 0.55, 0], stone)
  box(bridge, [0.16, 0.55, 4.6], [-1.45, 0.9, 0], stone)
  box(bridge, [0.16, 0.55, 4.6], [1.45, 0.9, 0], stone)

  // —— 灯笼 ——
  const lanterns: { light: THREE.PointLight; flame: THREE.Mesh }[] = []
  const lanternSpots: [number, number, number][] = [
    [-5.4, 2.55, -1.35],
    [-1.0, 2.35, -1.2],
    [3.2, 2.7, -1.4],
    [7.0, 2.45, -1.25],
    [-4.8, 2.4, 1.45],
    [0.2, 2.5, 1.5],
    [4.6, 2.55, 1.4],
  ]
  for (const [x, y, z] of lanternSpots) {
    lanterns.push(addLantern(alley, x, y, z))
  }

  // —— 雨丝（实例化广告牌） ——
  const RAIN = 2800
  const rainGeo = new THREE.PlaneGeometry(0.035, 1.05)
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xdcffff,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const rain = new THREE.InstancedMesh(rainGeo, rainMat, RAIN)
  rain.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(rain)

  const rainDummy = new THREE.Object3D()
  const rainY = new Float32Array(RAIN)
  const rainX = new Float32Array(RAIN)
  const rainZ = new Float32Array(RAIN)
  const rainSpeed = new Float32Array(RAIN)
  const rainArea = 22
  for (let i = 0; i < RAIN; i += 1) {
    rainX[i] = (Math.random() - 0.5) * rainArea
    rainZ[i] = (Math.random() - 0.5) * 14 - 1
    rainY[i] = Math.random() * 14 + 2
    rainSpeed[i] = 10 + Math.random() * 8
  }

  // —— 水花 ——
  const SPLASH = 120
  const splashGeo = new THREE.PlaneGeometry(0.35, 0.35)
  const splashCanvas = document.createElement('canvas')
  splashCanvas.width = 64
  splashCanvas.height = 64
  {
    const ctx = splashCanvas.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 28)
    g.addColorStop(0, 'rgba(220,255,255,0.9)')
    g.addColorStop(0.35, 'rgba(180,220,255,0.35)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
  }
  const splashTex = new THREE.CanvasTexture(splashCanvas)
  const splashMat = new THREE.MeshBasicMaterial({
    map: splashTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const splashes = new THREE.InstancedMesh(splashGeo, splashMat, SPLASH)
  scene.add(splashes)
  const splashDummy = new THREE.Object3D()
  const splashLife = new Float32Array(SPLASH)
  const splashX = new Float32Array(SPLASH)
  const splashZ = new Float32Array(SPLASH)
  for (let i = 0; i < SPLASH; i += 1) {
    splashLife[i] = Math.random()
    splashX[i] = (Math.random() - 0.5) * 18
    splashZ[i] = (Math.random() - 0.5) * 4.5
  }

  // —— 地面涟漪（程序化环） ——
  const rippleVert = /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  const rippleUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x8ec8ff) },
  }
  const ripples = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 4.6),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: rippleUniforms,
      vertexShader: rippleVert,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        void main() {
          vec2 p = (vUv - 0.5) * vec2(20.0, 4.6);
          float sum = 0.0;
          for (int i = 0; i < 9; i++) {
            float fi = float(i);
            vec2 cell = floor(p * 0.55 + vec2(fi * 0.37, fi * 0.19));
            float h = hash(cell);
            float phase = fract(uTime * 0.28 + h);
            vec2 center = (cell + 0.5 + (vec2(hash(cell + 1.7), hash(cell + 3.1)) - 0.5) * 0.6) / 0.55;
            float ring = abs(length(p - center) - phase * 1.6);
            float band = smoothstep(0.08, 0.0, ring) * (1.0 - phase) * (1.0 - phase);
            sum += band * 0.45;
          }
          float mask = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
          gl_FragColor = vec4(uColor, sum * mask * 0.55);
        }
      `,
    }),
  )
  ripples.rotation.x = -Math.PI / 2
  ripples.position.set(0, 0.2, 0)
  scene.add(ripples)

  // 河面涟漪（更疏）
  const canalRippleUniforms = {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x6ab0ff) },
  }
  const canalRipples = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 2.4),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: canalRippleUniforms,
      vertexShader: rippleVert,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(91.2, 47.3))) * 23421.631);
        }
        void main() {
          vec2 p = (vUv - 0.5) * vec2(20.0, 2.4);
          float sum = 0.0;
          for (int i = 0; i < 6; i++) {
            float fi = float(i);
            vec2 cell = floor(p * 0.22 + vec2(fi * 0.51, fi * 0.27));
            float h = hash(cell);
            float phase = fract(uTime * 0.18 + h);
            vec2 center = (cell + 0.5) / 0.22;
            float ring = abs(length(p - center) - phase * 2.4);
            sum += smoothstep(0.12, 0.0, ring) * (1.0 - phase) * (1.0 - phase);
          }
          gl_FragColor = vec4(uColor, sum * 0.4);
        }
      `,
    }),
  )
  canalRipples.rotation.x = -Math.PI / 2
  canalRipples.position.set(0, 0.03, -6.2)
  scene.add(canalRipples)

  // —— 闪电 ——
  const flash = new THREE.PointLight(0xc8e0ff, 0, 40, 2)
  flash.position.set(2, 12, -4)
  scene.add(flash)
  let nextFlash = 4 + Math.random() * 6
  let flashT = 0
  const nightBg = new THREE.Color(0x070c14)
  const flashBg = new THREE.Color()

  const clock = new THREE.Clock()
  let frameId = 0

  const loop = () => {
    frameId = requestAnimationFrame(loop)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime

    // 灯笼微闪
    for (let i = 0; i < lanterns.length; i += 1) {
      const { light, flame } = lanterns[i]
      const flicker = 0.85 + Math.sin(t * 6.2 + i * 1.7) * 0.08 + Math.sin(t * 13 + i) * 0.05
      light.intensity = 3.2 * flicker
      const matFlame = flame.material as THREE.MeshStandardMaterial
      matFlame.emissiveIntensity = 2.2 * flicker
    }

    // 雨
    const lookYaw = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z)
    for (let i = 0; i < RAIN; i += 1) {
      rainY[i] -= rainSpeed[i] * dt
      // 简化「撞地」：路约 y=0.2，桥面约 0.65，屋檐区更高则重生更早
      const ground =
        Math.abs(rainZ[i] + 4.2) < 2.2 && Math.abs(rainX[i] - 0.4) < 1.6
          ? 0.75
          : rainZ[i] < -5
            ? 0.05
            : 0.22
      if (rainY[i] < ground) {
        rainY[i] = 8 + Math.random() * 10
        rainX[i] = (Math.random() - 0.5) * rainArea
        rainZ[i] = (Math.random() - 0.5) * 14 - 1
      }
      rainDummy.position.set(rainX[i], rainY[i], rainZ[i])
      rainDummy.rotation.set(0, lookYaw, 0)
      rainDummy.updateMatrix()
      rain.setMatrixAt(i, rainDummy.matrix)
    }
    rain.instanceMatrix.needsUpdate = true

    // 水花
    for (let i = 0; i < SPLASH; i += 1) {
      splashLife[i] += dt * 1.8
      if (splashLife[i] > 1) {
        splashLife[i] = 0
        splashX[i] = (Math.random() - 0.5) * 18
        splashZ[i] = (Math.random() - 0.5) * 4.2
      }
      const life = splashLife[i]
      const s = 0.35 + life * 0.9
      splashDummy.position.set(splashX[i], 0.24, splashZ[i])
      splashDummy.scale.setScalar(s)
      splashDummy.quaternion.copy(camera.quaternion)
      splashDummy.updateMatrix()
      splashes.setMatrixAt(i, splashDummy.matrix)
    }
    splashes.instanceMatrix.needsUpdate = true
    splashMat.opacity = 0.55

    rippleUniforms.uTime.value = t
    canalRippleUniforms.uTime.value = t * 0.85

    // 闪电
    nextFlash -= dt
    if (nextFlash <= 0) {
      flashT = 0.12 + Math.random() * 0.1
      nextFlash = 5 + Math.random() * 9
    }
    if (flashT > 0) {
      flashT -= dt
      flash.intensity = (0.4 + Math.random() * 1.6) * 18
      flashBg.setHSL(0.58, 0.15, 0.08 + Math.random() * 0.04)
      scene.background = flashBg
    } else {
      flash.intensity = 0
      scene.background = nightBg
    }

    // 河面微波动
    water.position.y = -0.02 + Math.sin(t * 1.3) * 0.008

    controls.update()
    renderer.render(scene, camera)
  }
  loop()

  const resize = () => {
    const w = Math.max(host.clientWidth, 1)
    const h = Math.max(host.clientHeight, 1)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  return {
    dispose() {
      cancelAnimationFrame(frameId)
      ro.disconnect()
      controls.dispose()
      rainGeo.dispose()
      rainMat.dispose()
      splashGeo.dispose()
      splashMat.dispose()
      splashTex.dispose()
      renderer.dispose()
      host.replaceChildren()
    },
  }
}

function mat(color: number, roughness: number, metalness: number) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  pos: [number, number, number],
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material)
  mesh.position.set(...pos)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}

function addShop(
  parent: THREE.Object3D,
  b: { x: number; w: number; d: number; h: number; windows: number },
  z: number,
  plaster: THREE.Material,
  wood: THREE.Material,
  roofMat: THREE.Material,
  face: 1 | -1,
) {
  const g = new THREE.Group()
  g.position.set(b.x, 0, z)
  parent.add(g)
  box(g, [b.w, b.h, b.d], [0, b.h / 2, 0], plaster)
  box(g, [b.w + 0.35, 0.22, b.d + 0.45], [0, b.h + 0.05, 0], roofMat)
  box(g, [b.w * 0.55, 0.08, 0.7], [0, 2.15, (b.d / 2 + 0.2) * face], wood) // 屋檐挑出

  const glow = new THREE.MeshStandardMaterial({
    color: 0xffd090,
    emissive: 0xffa040,
    emissiveIntensity: 2.2,
    roughness: 0.35,
    metalness: 0,
  })
  const winZ = (b.d / 2 - 0.02) * face
  for (let i = 0; i < b.windows; i += 1) {
    const wx = ((i + 0.5) / b.windows - 0.5) * (b.w - 0.8)
    box(g, [0.55, 0.7, 0.06], [wx, 1.55, winZ], glow)
    if (b.h > 4.2) box(g, [0.5, 0.55, 0.06], [wx, 3.1, winZ], glow)
  }
}

function addLantern(parent: THREE.Object3D, x: number, y: number, z: number) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  parent.add(g)

  const paper = new THREE.MeshStandardMaterial({
    color: 0xff8a4a,
    emissive: 0xff6020,
    emissiveIntensity: 1.6,
    roughness: 0.5,
    metalness: 0,
  })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.38, 12), paper)
  body.castShadow = true
  g.add(body)

  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xffe0a0,
    emissive: 0xffcc66,
    emissiveIntensity: 2.2,
    roughness: 0.3,
  })
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), flameMat)
  flame.position.y = 0.02
  g.add(flame)

  const light = new THREE.PointLight(0xff9a4a, 3.2, 9, 1.8)
  light.position.set(0, 0, 0)
  g.add(light)

  // 吊绳
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x1a1210 }),
  )
  cord.position.y = 0.42
  g.add(cord)

  return { light, flame }
}
