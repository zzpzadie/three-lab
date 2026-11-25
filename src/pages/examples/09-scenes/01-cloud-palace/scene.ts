import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 白玉京 · 天上白玉京，十二楼五城
 * 复现仙侠云海：悬崖古树、白衣望仙、云瀑、浮空仙阙
 */
const createBaiyuJingScene = (host: HTMLDivElement) => {
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0xc8d6e8, 0.012)

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)
  // 构图：左前景崖树，右远景仙阙与云瀑
  camera.position.set(-18, 8, 28)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setClearColor(0xa8c4de, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  host.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(6, 10, -8)
  controls.minDistance = 12
  controls.maxDistance = 80
  controls.maxPolarAngle = Math.PI * 0.48
  controls.update()

  // —— 天空渐变 ——
  const skyGeo = new THREE.SphereGeometry(180, 32, 16)
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x6a9bc8) },
      midColor: { value: new THREE.Color(0xc8d8ea) },
      bottomColor: { value: new THREE.Color(0xf0e6d0) },
      offset: { value: 12 },
      exponent: { value: 0.55 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPos;
      void main() {
        float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
        float t = pow(max(h, 0.0), exponent);
        vec3 col = mix(bottomColor, midColor, smoothstep(0.0, 0.45, t));
        col = mix(col, topColor, smoothstep(0.35, 1.0, t));
        // 右上侧微金光
        float gold = smoothstep(0.2, 0.9, normalize(vWorldPos).x * 0.5 + normalize(vWorldPos).y);
        col = mix(col, vec3(0.95, 0.88, 0.72), gold * 0.22);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  scene.add(new THREE.Mesh(skyGeo, skyMat))

  // —— 光照 ——
  scene.add(new THREE.AmbientLight(0xdde8f5, 0.55))
  const hemi = new THREE.HemisphereLight(0xc8daf0, 0xb8a890, 0.7)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xffe6b8, 1.8)
  sun.position.set(-30, 40, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 120
  sun.shadow.camera.left = -40
  sun.shadow.camera.right = 40
  sun.shadow.camera.top = 40
  sun.shadow.camera.bottom = -40
  sun.shadow.bias = -0.0002
  scene.add(sun)

  const rim = new THREE.DirectionalLight(0xa8c8ff, 0.45)
  rim.position.set(25, 15, -30)
  scene.add(rim)

  // —— 云海纹理（程序噪声） ——
  const cloudTex = makeCloudTexture(256)
  const softDiscTex = makeSoftDiscTexture(128)

  // 云海平面层
  const cloudSea = new THREE.Group()
  scene.add(cloudSea)
  const cloudLayers: THREE.Mesh[] = []
  for (let i = 0; i < 7; i++) {
    const size = 90 + i * 12
    const geo = new THREE.PlaneGeometry(size, size)
    const mat = new THREE.MeshLambertMaterial({
      map: cloudTex,
      color: new THREE.Color().setHSL(0.58, 0.08, 0.92 - i * 0.02),
      transparent: true,
      opacity: 0.45 + i * 0.04,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set((i % 2) * 4 - 2, -2 + i * 0.35, -10 - i * 2)
    mesh.renderOrder = i
    cloudSea.add(mesh)
    cloudLayers.push(mesh)
  }

  // 飘散云朵 billboard
  const floatClouds: THREE.Mesh[] = []
  const cloudMat = new THREE.MeshBasicMaterial({
    map: softDiscTex,
    color: 0xf5f8fc,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  for (let i = 0; i < 40; i++) {
    const s = 4 + Math.random() * 10
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.55), cloudMat.clone())
    m.position.set(
      (Math.random() - 0.45) * 70,
      1 + Math.random() * 18,
      -5 - Math.random() * 50,
    )
    m.rotation.x = -0.35
    ;(m.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.random() * 0.35
    scene.add(m)
    floatClouds.push(m)
  }

  // —— 云瀑（垂直光幕） ——
  const waterfallGroup = new THREE.Group()
  waterfallGroup.position.set(14, 8, -18)
  scene.add(waterfallGroup)

  const fallUniforms = {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(0xffffff) },
    uColorB: { value: new THREE.Color(0xd0e4f8) },
  }
  const fallMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: fallUniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      void main() {
        vec2 uv = vUv;
        float flow = noise(vec2(uv.x * 4.0, uv.y * 6.0 - uTime * 0.8));
        float streaks = noise(vec2(uv.x * 18.0, uv.y * 2.0 - uTime * 1.6));
        float curtain = smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x);
        float fadeY = smoothstep(0.0, 0.12, uv.y) * smoothstep(1.0, 0.55, uv.y);
        float a = (0.35 + flow * 0.45 + streaks * 0.25) * curtain * fadeY;
        vec3 col = mix(uColorB, uColorA, streaks);
        gl_FragColor = vec4(col, a * 0.85);
      }
    `,
  })
  const fall = new THREE.Mesh(new THREE.PlaneGeometry(10, 28, 1, 1), fallMat)
  fall.position.y = 2
  waterfallGroup.add(fall)

  // 云瀑两侧柔边
  for (const side of [-1, 1]) {
    const edge = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 26),
      new THREE.MeshBasicMaterial({
        map: softDiscTex,
        color: 0xeef4fb,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    edge.position.set(side * 5.5, 2, 0.2)
    waterfallGroup.add(edge)
  }

  // —— 浮空仙阙（十二楼五城意象） ——
  const palace = buildPalace()
  palace.position.set(14, 22, -20)
  palace.scale.setScalar(1.15)
  scene.add(palace)

  // 仙阙下方承云
  for (let i = 0; i < 6; i++) {
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(6 + i * 1.5, 3 + i),
      new THREE.MeshBasicMaterial({
        map: softDiscTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.4 - i * 0.04,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    base.position.set(14 + (i % 2) * 1.5, 20.5 - i * 0.4, -20 + i * 0.3)
    base.rotation.x = -0.5
    scene.add(base)
  }

  // —— 悬崖 ——
  const cliff = buildCliff()
  cliff.position.set(-10, 0, 4)
  scene.add(cliff)

  // —— 古树 ——
  const tree = buildTree()
  tree.position.set(-12.5, 4.2, 2.5)
  scene.add(tree)

  // —— 白衣人 ——
  const figure = buildFigure()
  figure.position.set(-7.2, 5.55, 5.8)
  figure.rotation.y = Math.PI * 0.15
  scene.add(figure)

  // 仙鹤（树上两点白）
  const craneGeo = new THREE.SphereGeometry(0.12, 8, 8)
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xf8f8ff, metalness: 0.2, roughness: 0.5 })
  for (const [x, y, z] of [
    [-11.2, 9.8, 1.8],
    [-10.4, 10.6, 2.4],
  ] as const) {
    const c = new THREE.Mesh(craneGeo, craneMat)
    c.position.set(x, y, z)
    c.scale.set(1, 0.7, 1.4)
    scene.add(c)
  }

  // —— 金尘粒子 ——
  const dustCount = 120
  const dustPos = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.3) * 50
    dustPos[i * 3 + 1] = Math.random() * 30
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: 0xffe8c0,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      map: softDiscTex,
      sizeAttenuation: true,
    }),
  )
  scene.add(dust)

  const resize = () => {
    const w = host.clientWidth
    const h = host.clientHeight
    camera.aspect = w / Math.max(h, 1)
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }
  resize()
  window.addEventListener('resize', resize)

  const clock = new THREE.Clock()
  let frameId = 0
  const animate = () => {
    frameId = requestAnimationFrame(animate)
    const t = clock.getElapsedTime()
    fallUniforms.uTime.value = t

    for (let i = 0; i < cloudLayers.length; i++) {
      cloudLayers[i].rotation.z = Math.sin(t * 0.05 + i) * 0.02
      cloudLayers[i].position.x = Math.sin(t * 0.03 + i * 0.7) * 1.5
    }
    for (let i = 0; i < floatClouds.length; i++) {
      const m = floatClouds[i]
      m.position.x += Math.sin(t * 0.1 + i) * 0.002
      m.lookAt(camera.position.x, m.position.y, camera.position.z)
    }
    dust.rotation.y = t * 0.02
    palace.position.y = 22 + Math.sin(t * 0.35) * 0.15
    controls.update()
    renderer.render(scene, camera)
  }
  animate()

  const dispose = () => {
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', resize)
    controls.dispose()
    renderer.dispose()
    renderer.domElement.remove()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose()
        const mat = obj.material
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose())
        else mat?.dispose()
      }
    })
    cloudTex.dispose()
    softDiscTex.dispose()
  }

  return { scene, camera, renderer, controls, dispose }
}

// ——— 构建件 ———

function buildPalace(): THREE.Group {
  const g = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({
    color: 0x2a221c,
    roughness: 0.85,
    metalness: 0.05,
  })
  const roof = new THREE.MeshStandardMaterial({
    color: 0x1a1512,
    roughness: 0.7,
    metalness: 0.1,
  })
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc9a45c,
    roughness: 0.45,
    metalness: 0.55,
    emissive: 0x3a2a10,
    emissiveIntensity: 0.25,
  })

  const addTier = (y: number, w: number, d: number, h: number, roofW: number) => {
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood)
    body.position.y = y
    body.castShadow = true
    body.receiveShadow = true
    g.add(body)

    // 飞檐屋顶：扁锥
    const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(roofW * 0.72, h * 0.55, 4), roof)
    roofMesh.position.y = y + h * 0.55
    roofMesh.rotation.y = Math.PI / 4
    roofMesh.castShadow = true
    g.add(roofMesh)

    // 屋脊金边
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(roofW * 0.15, 0.08, roofW * 0.15), gold)
    ridge.position.y = y + h * 0.85
    g.add(ridge)

    // 柱廊暗示
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, h * 0.9, 6), wood)
        col.position.set(i * w * 0.42, y - h * 0.05, j * d * 0.42)
        g.add(col)
      }
    }
  }

  // 主阙三层
  addTier(0, 5.5, 4.2, 2.2, 7.2)
  addTier(2.6, 4.2, 3.2, 1.9, 5.8)
  addTier(4.8, 3.0, 2.4, 1.6, 4.4)

  // 「十二楼」两侧配楼
  const towers = [
    [-5.5, -0.5, 2.8, 2.2, 1.8, 3.6],
    [5.5, -0.3, 2.6, 2.0, 1.7, 3.4],
    [-3.2, 1.2, 2.0, 1.6, 2.4, 2.8],
    [3.5, 1.0, 1.9, 1.5, 2.2, 2.6],
    [0, 6.2, 1.6, 1.4, 1.5, 2.2],
  ] as const
  for (const [x, y, w, d, h, rw] of towers) {
    const sub = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood)
    body.position.y = y + h / 2
    body.castShadow = true
    sub.add(body)
    const r = new THREE.Mesh(new THREE.ConeGeometry(rw * 0.55, h * 0.5, 4), roof)
    r.position.y = y + h + h * 0.2
    r.rotation.y = Math.PI / 4
    sub.add(r)
    sub.position.x = x
    g.add(sub)
  }

  // 台基
  const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.6, 6), wood)
  base.position.y = -1.4
  g.add(base)
  const steps = new THREE.Mesh(new THREE.BoxGeometry(3, 0.35, 2), wood)
  steps.position.set(0, -1.7, 3.2)
  g.add(steps)

  return g
}

function buildCliff(): THREE.Group {
  const g = new THREE.Group()
  const rock = new THREE.MeshStandardMaterial({
    color: 0xd8d2c6,
    roughness: 0.95,
    metalness: 0.02,
  })
  const darkRock = new THREE.MeshStandardMaterial({
    color: 0x9a9488,
    roughness: 0.98,
  })

  const main = new THREE.Mesh(new THREE.ConeGeometry(7, 12, 6), rock)
  main.position.y = 2
  main.rotation.y = 0.4
  main.scale.set(1.2, 1, 0.85)
  main.castShadow = true
  main.receiveShadow = true
  g.add(main)

  const ledge = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.7, 3.2), rock)
  ledge.position.set(3.2, 5.2, 2.2)
  ledge.rotation.z = -0.12
  ledge.rotation.y = -0.2
  ledge.castShadow = true
  ledge.receiveShadow = true
  g.add(ledge)

  const tip = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 5), rock)
  tip.position.set(4.8, 5.6, 3.5)
  tip.rotation.z = Math.PI
  tip.rotation.x = 0.3
  tip.castShadow = true
  g.add(tip)

  for (let i = 0; i < 5; i++) {
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8 + Math.random() * 1.2, 0),
      i % 2 ? darkRock : rock,
    )
    boulder.position.set(-2 + Math.random() * 5, 1 + Math.random() * 3, -1 + Math.random() * 3)
    boulder.rotation.set(Math.random(), Math.random(), Math.random())
    boulder.castShadow = true
    g.add(boulder)
  }

  return g
}

function buildTree(): THREE.Group {
  const g = new THREE.Group()
  const bark = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 })
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0xc45a1a,
    roughness: 0.8,
    emissive: 0x3a1808,
    emissiveIntensity: 0.15,
  })
  const leafMat2 = new THREE.MeshStandardMaterial({
    color: 0x8a3a12,
    roughness: 0.85,
  })

  // 扭曲主干：多段圆柱
  let px = 0
  let py = 0
  let pz = 0
  for (let i = 0; i < 8; i++) {
    const h = 0.9
    const r = 0.45 - i * 0.035
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, h, 7), bark)
    px += Math.sin(i * 0.55) * 0.25
    pz += Math.cos(i * 0.4) * 0.15
    py += h * 0.92
    seg.position.set(px, py, pz)
    seg.rotation.z = Math.sin(i * 0.7) * 0.25
    seg.rotation.x = Math.cos(i * 0.5) * 0.12
    seg.castShadow = true
    g.add(seg)
  }

  // 枝干
  const branches: [number, number, number, number, number, number][] = [
    [0.8, 5.5, 0.2, 0.6, 0.35, -0.5],
    [-0.6, 6.2, 0.4, -0.5, 0.4, 0.3],
    [0.3, 7.0, -0.3, 0.4, 0.5, -0.2],
    [1.2, 6.5, 0.5, 0.7, 0.2, 0.4],
  ]
  for (const [x, y, z, dx, dy, dz] of branches) {
    const len = Math.hypot(dx, dy, dz)
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, len, 5), bark)
    br.position.set(x + dx / 2, y + dy / 2, z + dz / 2)
    br.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(dx, dy, dz).normalize(),
    )
    br.castShadow = true
    g.add(br)
  }

  // 秋叶团
  for (let i = 0; i < 28; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.35 + Math.random() * 0.45, 6, 6),
      Math.random() > 0.5 ? leafMat : leafMat2,
    )
    leaf.position.set(
      (Math.random() - 0.3) * 3.5,
      5.5 + Math.random() * 3.5,
      (Math.random() - 0.5) * 2.5,
    )
    leaf.scale.set(1, 0.55, 1)
    leaf.castShadow = true
    g.add(leaf)
  }

  return g
}

function buildFigure(): THREE.Group {
  const g = new THREE.Group()
  const robe = new THREE.MeshStandardMaterial({
    color: 0xf4f2ec,
    roughness: 0.7,
    metalness: 0.05,
  })
  const hair = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 8), robe)
  body.position.y = 0.55
  body.castShadow = true
  g.add(body)

  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.7, 8), robe)
  skirt.position.y = 0.15
  skirt.castShadow = true
  g.add(skirt)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), robe)
  head.position.y = 1.25
  g.add(head)

  const topknot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), hair)
  topknot.position.y = 1.42
  g.add(topknot)

  const sleeveL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.45, 4, 8), robe)
  sleeveL.position.set(-0.32, 0.7, 0.05)
  sleeveL.rotation.z = 0.5
  g.add(sleeveL)
  const sleeveR = sleeveL.clone()
  sleeveR.position.set(0.32, 0.7, 0.05)
  sleeveR.rotation.z = -0.5
  g.add(sleeveR)

  return g
}

function makeCloudTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 20 + Math.random() * 60
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,255,255,0.55)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function makeSoftDiscTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.65)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export { createBaiyuJingScene }
