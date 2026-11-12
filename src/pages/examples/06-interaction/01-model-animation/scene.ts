import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
const createBasicsScene = (host: HTMLDivElement) => {
  type State = 'IdleOutside' | 'DoorOpening' | 'Crossing' | 'Play' // ...
  let state: State = 'IdleOutside'
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 0.1, 100000)
  camera.position.set(0, 10, 20)
  
  //辅助轴
  const axesHelper = new THREE.AxesHelper(5)
  scene.add(axesHelper)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(host.clientWidth, host.clientHeight)
  renderer.shadowMap.enabled = true
  host.appendChild(renderer.domElement)
  
  const controls = new OrbitControls(camera, renderer.domElement)

  // 场景设置
  scene.background = new THREE.Color(0x87ceeb)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const light = new THREE.DirectionalLight(0xffffff, 2)
  light.position.set(10, 20, 5)
  light.castShadow = true
  scene.add(light)

  const ground = new THREE.Mesh( new THREE.PlaneGeometry(30, 30),new THREE.MeshLambertMaterial({ color: 0x228b22 ,side:THREE.DoubleSide}))
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // 花朵
  const flower = new THREE.Group()
  const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3),
      new THREE.MeshPhongMaterial({ color: 0x228b22 })
  )
  stem.position.y = 1.5
  stem.castShadow = true

  const petals = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 12),
      new THREE.MeshPhongMaterial({ color: 0xff69b4, shininess: 100 })
  )
  petals.position.y = 3
  petals.scale.set(1, 0.5, 1)
  petals.castShadow = true

  flower.add(stem, petals)
  scene.add(flower)

  // 蝴蝶
  const butterfly = new THREE.Group()
  const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1),
      new THREE.MeshPhongMaterial({ color: 0x8b4513 })
  )
  const wing1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0xff6347, transparent: true, opacity: 0.8 })
  )
  wing1.scale.set(1.5, 0.1, 1)
  wing1.position.set(0.3, 0, 0)

  const wing2 = wing1.clone()
  wing2.position.set(-0.3, 0, 0)

  butterfly.add(body, wing1, wing2)
  butterfly.position.set(5, 4, 0)
  scene.add(butterfly)

  // 简洁花园动画
  const tl = gsap.timeline({ repeat: -1, yoyo: true }) // repeat: -1 无限循环, yoyo: true 往返动画

  tl.from(flower.scale, { x: 0, y: 0, z: 0, duration: 2, ease: "back.out(1.7)" })
    .to(petals.material.color, { r: 1, g: 0.8, b: 0.2, duration: 1 }, "-=0.5") // -=0.5 表示与前一个动画同时开始
    .to(butterfly.position, { x: 0, y: 5, z: 2, duration: 3, ease: "power1.inOut" })
    .to(butterfly.rotation, { z: Math.PI / 4, duration: 0.5 }, "-=1") // -=1 表示与前一个动画同时开始
    .to(petals.scale, { x: 1.3, y: 0.6, z: 1.3, duration: 1 })
    .to(butterfly.position, { x: -3, y: 3, z: -2, duration: 2 })

  let frameId = 0;
  function animate() {
    frameId = requestAnimationFrame(animate)
      
      // 蝴蝶翅膀扇动
      wing1.rotation.z = Math.sin(Date.now() * 0.02) * 0.3
      wing2.rotation.z = -Math.sin(Date.now() * 0.02) * 0.3
      
      // 花朵轻微摆动
      petals.rotation.y += 0.005
      
      renderer.render(scene, camera)
  }

  //墙体，在平台边缘打开，三块拼接成一个整体

  const WALL_WIDTH = 7
  const WALL_HEIGHT = 3
  const WALL_THICK = 0.15
  const WALL_X = -0.66
  const WALL_Y = 0
  const WALL_Z = 12
  const wall = new THREE.Group()
  
  wall.position.set(WALL_X, WALL_Y, WALL_Z)
  // 左墙体：贴在门框左边
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(WALL_WIDTH, WALL_HEIGHT, 0.15),
    new THREE.MeshPhongMaterial({ color: 0xdeb887 })
  )
  leftWall.position.set(-WALL_WIDTH/2, WALL_HEIGHT/2, 0)
  // 右墙体：贴在门框右边
  const rightWall = leftWall.clone()
  rightWall.position.set(1.44+WALL_WIDTH/2, WALL_HEIGHT/2, 0)
  // 上墙体：横搭在两墙体顶上
  const topWall = new THREE.Mesh(
    new THREE.BoxGeometry(1.44+WALL_WIDTH*2, WALL_THICK, WALL_HEIGHT),
    new THREE.MeshPhongMaterial({ color: 0xdeb887 })
  )
  topWall.position.set(1.44/2, WALL_HEIGHT, 0)
  wall.add(leftWall, rightWall, topWall)
  scene.add(wall)
  // const door = new THREE.Mesh(
  //   new THREE.BoxGeometry(15, 6, 0.1),
  //   new THREE.MeshPhongMaterial({ color: 0x8b4513 })
  // )
  // door.position.set(-12, 3, 12)
  // scene.add(door)
  // const doorAnimation = gsap.to(door.position, {
  //   x: 1,
  //   duration: 1,
  //   ease: "power1.inOut"
  // })
  // doorAnimation.play()
  //门框，不是门，固定位置，框内是门，推门时，门框不跟着门一起动
  const DOOR_W = 1.2
  const DOOR_H = 3
  const THICK = 0.12       // 框条截面厚度
  const DEPTH = 0.15       // 框前后厚度
  const holeX = 0.06
  const holeY = DOOR_H / 2
  const holeZ = 12
  const mat = new THREE.MeshPhongMaterial({ color: 0xdeb887 })
  const doorFrame = new THREE.Group()
  doorFrame.position.set(holeX, holeY, holeZ)
  // 左立柱：贴在门洞左边
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(THICK, DOOR_H + THICK, DEPTH),
    mat
  )
  left.position.set(-(DOOR_W / 2 + THICK / 2), 0, 0)
  // 右立柱
  const right = left.clone()
  right.position.set(DOOR_W / 2 + THICK / 2, 0, 0)
  // 上楣：横搭在两柱顶上
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W + THICK * 2, THICK, DEPTH),
    mat
  )
  top.position.set(0, DOOR_H / 2 + THICK / 2, 0)
  doorFrame.add(left, right, top)
  scene.add(doorFrame)
  
  
  // 2) 铰链 Group：放在门洞左缘（朝 +X 开门时）
  const hinge = new THREE.Group()
  hinge.position.set(holeX - DOOR_W / 2, holeY, holeZ) // 左铰链
  scene.add(hinge)
  
  // 3) 门扇：相对铰链偏半宽，左缘贴在 hinge 原点
  const singleDoor = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.08),
    new THREE.MeshPhongMaterial({ color: 0xffd700 })
  )
  singleDoor.position.set(DOOR_W / 2, 0, 0) // 只设本地坐标
  singleDoor.name = 'men'
  hinge.add(singleDoor) // 不要 scene.add(singleDoor)
  
  // 4) 推门：转铰链，不要改 position
  function setState(next: State) {
    if (state === next) return
    state = next
    // 按需在这里挂/卸监听、播 GSAP
    if (next === 'DoorOpening') {
      gsap.to(hinge.rotation, { y: -Math.PI / 2, duration: 1, ease: 'power1.inOut' })
    }
  }
  const handleClick = (event: MouseEvent) => {
    const px = event.offsetX;
    const py = event.offsetY;
    //屏幕坐标px、py转标准设备坐标x、y
    //width、height表示canvas画布宽高度
    const x = (px / host.clientWidth) * 2 - 1;
    const y = -(py / host.clientHeight) * 2 + 1;
    const mouse = new THREE.Vector2(x, y)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    console.log('intersects', intersects)
    if (intersects.length > 0) {
      const object = intersects[0].object
      console.log('object', object)
      if (object.name === 'men') {
        setState('DoorOpening')
        
      }
    }
  }
  animate()
  // 窗口自适应,监听 resize 事件, 更新相机和渲染器
  const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix(); // 改了 aspect 后必须调用，否则投影矩阵不更新
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
  resize(); // 初始化时先同步一次尺寸
  window.addEventListener('resize', resize);
  const dispose = () => {
      // 停止动画循环
      cancelAnimationFrame(frameId)
      tl.kill()//停止时间线
      controls.dispose()//停止控制器
      renderer.dispose()//停止渲染器
      renderer.domElement.remove()//移除渲染器dom元素
      window.removeEventListener('resize', resize)//移除窗口resize事件
  };
  return {dispose, handleClick}
}

export { createBasicsScene }