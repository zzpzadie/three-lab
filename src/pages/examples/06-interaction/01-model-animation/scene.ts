import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon-es';
const createBasicsScene = (host: HTMLDivElement) => {
  // 花园相关对象
  let wing1: THREE.Mesh, wing2: THREE.Mesh, petals: THREE.Mesh, butterfly: THREE.Group, body: THREE.Mesh;
  let flower: THREE.Group, stem: THREE.Mesh;
  let ground: THREE.Mesh;
  type State = 'IdleOutside' | 'DoorOpening' | 'Crossing' | 'Play' // ...
  let state: State = 'IdleOutside'
  let target : THREE.Vector3;
  // 场景相关对象
  let scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera;
  let followCamera = false // 是否跟随相机
  let hemiLight: THREE.HemisphereLight, dirLight: THREE.DirectionalLight;
  let world: CANNON.World;
  //轨道控制器
  let controls: OrbitControls;
  //相机目标点
  let cameraTarget = new THREE.Vector3();
  let dracoLoader: DRACOLoader;
  let disposed = false
  
  // 模型相关对象
  let model: THREE.Object3D, skeleton: THREE.SkeletonHelper, mixer: THREE.AnimationMixer, Timer: THREE.Timer;
  let idleAction: THREE.AnimationAction, walkAction: THREE.AnimationAction, runAction: THREE.AnimationAction;
  // let idleWeight: number, walkWeight: number, runWeight: number;
  let actions: THREE.AnimationAction[];


  // 门相关对象
  let wall: THREE.Group, leftWall: THREE.Mesh, rightWall: THREE.Mesh, topWall: THREE.Mesh;
  let hinge: THREE.Group, singleDoor: THREE.Mesh;
  let tl: GSAPTimeline;

  //物理世界相关
  let playerBody: CANNON.Body
  const PLAYER_H = 1.8
  const PLAYER_R = 0.35
  function init() {
    initScene();
    initPerson();
    initGarden();
    initDoor();
    renderer.setAnimationLoop(animate);

  }
  //初始化场景
  function initScene() {
    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    const doorFocus = new THREE.Vector3(0, 1.5, 12) // 门洞中心
    camera.position.set(0, 3, 20)   // 站在门外一定距离

    Timer = new THREE.Timer();

    scene = new THREE.Scene();
    
    // 场景设置
    scene.background = new THREE.Color(0x87ceeb)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    // 地面
    ground = new THREE.Mesh( new THREE.PlaneGeometry(30, 30),new THREE.MeshLambertMaterial({ color: 0x228b22 ,side:THREE.DoubleSide}))
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    scene.add(ground)
    scene.fog = new THREE.Fog(0xa0a0a0, 2, 20);

    //创建半球光源
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    //创建平行光源
    dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add(dirLight);

    // 相机辅助器
    // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    //辅助轴
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
   
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);//设置渲染器像素比
    renderer.setSize(window.innerWidth, window.innerHeight);//设置渲染器尺寸
    renderer.shadowMap.enabled = true;//启用阴影贴图
    host?.appendChild(renderer.domElement);//挂载渲染器

    window.addEventListener("resize", resize);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;//启用阻尼
    controls.dampingFactor = 0.05;//阻尼系数
    controls.rotateSpeed = 1.2 
    controls.screenSpacePanning = true;//启用屏幕空间平移
    controls.maxPolarAngle = Math.PI / 2;//最大极角
    
    controls.target.copy(doorFocus) // 关键：绕门转
    controls.minDistance = 3
    controls.maxDistance = 40       // 门外观察可适当加大
    controls.update()     
  }
  //初始化人物
  function initPerson() {
    // 1. 配置 Draco 解码器
    dracoLoader = new DRACOLoader();
    // 指向 Three.js 自带的解码器文件（需确保你的项目能访问到这些文件）
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/libs/draco/');
    // 2. 创建 GLTFLoader 并挂载 Draco 解码器
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(
      `https://z2586300277.github.io/3d-file-server/` + 'files/model/Soldier.glb',
      function (gltf) {
        // console.log('控制台查看gltf对象结构', gltf);
        // console.log('动画数据', gltf.animations);
        if (disposed) return
        model = gltf.scene;
        scene.add(model);

        //人物位置与门洞中心一致
        model.position.set(0, 0, 14)
        //遍历模型所有子对象，设置阴影
        model.traverse(function (object) {
          if (object instanceof THREE.Mesh) object.castShadow = true;
        });
        // console.log(model, "模型");
        //

        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);


        //动画节点树结构

        const animations = gltf.animations;

        //创建动画混合器
        mixer = new THREE.AnimationMixer(model);

        //返回一个AnimationAction对象，用于控制动画的播放
        idleAction = mixer.clipAction(animations[0]);//待机动画
        walkAction = mixer.clipAction(animations[3]);//行走动画
        runAction = mixer.clipAction(animations[1]);//跑步动画

        actions = [idleAction, walkAction, runAction];//所有动画

        activateAllActions();

      }
    );

    
    
    // // 加载物理世界
    // world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) })
    // //   world.PhysicsRender = (deltaTime) => {

    // //     world.step(1 / 60, deltaTime, 3)
    
    // //     world.bodies.forEach(body => body.render?.())
    
    // // }
    // const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1))
    // const boxBody = new CANNON.Body({ mass: 1 })
    // boxBody.addShape(boxShape)
    // world.addBody(boxBody)
    // createPhysicsBody(world, ground, 0)
  }
  //初始化花园
  function initGarden() {
        
    // 花朵
    flower = new THREE.Group()
    stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 3),
        new THREE.MeshPhongMaterial({ color: 0x228b22 })
    )
    stem.position.y = 1.5
    stem.castShadow = true

    petals = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 12, 12),
        new THREE.MeshPhongMaterial({ color: 0xff69b4, shininess: 100 })
    )
    petals.position.y = 3
    petals.scale.set(1, 0.5, 1)
    petals.castShadow = true

    flower.add(stem, petals)
    petals.name = 'flower'
    scene.add(flower)

    // 蝴蝶
    butterfly = new THREE.Group()
    body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1),
        new THREE.MeshPhongMaterial({ color: 0x8b4513 })
    )
    wing1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshPhongMaterial({ color: 0xff6347, transparent: true, opacity: 0.8 })
    )
    wing1.scale.set(1.5, 0.1, 1)
    wing1.position.set(0.3, 0, 0)

    wing2 = wing1.clone()
    wing2.position.set(-0.3, 0, 0)

    butterfly.add(body, wing1, wing2)
    butterfly.position.set(5, 4, 0)
    scene.add(butterfly)

    // 简洁花园动画
    tl = gsap.timeline({ repeat: -1, yoyo: true }) // repeat: -1 无限循环, yoyo: true 往返动画

    tl.from(flower.scale, { x: 0, y: 0, z: 0, duration: 2, ease: "back.out(1.7)" })
      .to((petals.material as THREE.MeshPhongMaterial).color, { r: 1, g: 0.8, b: 0.2, duration: 1 }, "-=0.5") // -=0.5 表示与前一个动画同时开始
      .to(butterfly.position, { x: 0, y: 5, z: 2, duration: 3, ease: "power1.inOut" })
      .to(butterfly.rotation, { z: Math.PI / 4, duration: 0.5 }, "-=1") // -=1 表示与前一个动画同时开始
      .to(petals.scale, { x: 1.3, y: 0.6, z: 1.3, duration: 1 })
      .to(butterfly.position, { x: -3, y: 3, z: -2, duration: 2 })
  }
  //初始化门
  function initDoor() {
    const OPEN_W = 1.2
    const OPEN_H = 3
    const SIDE_W = 14          // 左右墙宽
    const DEPTH = 3
    const Z = 12 // 门洞中心距离相机Z轴距离

    // 门洞中心（整面墙的“锚点”）
    const cx = 0
    const cy = OPEN_H / 2

    const gap = OPEN_W   // 左右墙之间的净空（含框）
    // 墙：一个 Group，原点放在门洞中心地面投影也可，这里放洞心同高更直观
    wall = new THREE.Group()
    wall.position.set(cx, 0.01, Z)
    // 左墙体：贴在门左边
    leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(SIDE_W, OPEN_H, 0.15),
      new THREE.MeshPhongMaterial({ color: 0xdeb887 })
    )
    leftWall.position.set(-(gap / 2 + SIDE_W / 2), OPEN_H / 2, 0)
    // 右墙体：贴在门右边
    rightWall = leftWall.clone()
    rightWall.position.set( (gap / 2 + SIDE_W / 2), OPEN_H / 2, 0)
    // 上门楣墙：盖住门洞上方一条即可（不要再用 1.44 魔法数）
    topWall = new THREE.Mesh(
      new THREE.BoxGeometry(gap + SIDE_W * 2, 0.3, DEPTH),
      new THREE.MeshPhongMaterial({ color: 0xdeb887 })
    )
    topWall.position.set(0, OPEN_H + 0.15, 0)
    wall.add(leftWall, rightWall, topWall)
    scene.add(wall)

    // 2) 铰链 Group：放在门洞左缘（朝 +X 开门时）
    hinge = new THREE.Group()
    hinge.position.set(cx - OPEN_W / 2, cy, Z)
    // 3) 门扇：相对铰链偏半宽，左缘贴在 hinge 原点
    singleDoor = new THREE.Mesh(
      new THREE.BoxGeometry(OPEN_W, OPEN_H, 0.08),
      new THREE.MeshPhongMaterial({ color: 0xffd700 })
    )
    singleDoor.position.set(OPEN_W / 2, 0, 0) // 只设本地坐标
    singleDoor.name = 'men'
    hinge.add(singleDoor) // 不要 scene.add(singleDoor)
    scene.add(hinge)
  }
  //激活所有动画
  function activateAllActions() {
    setWeight(idleAction, 1);
    setWeight(walkAction, 0);
    setWeight(runAction, 0);

    actions.forEach(function (action) {
      action.play();
    });
  }

  //执行过渡：从一个动画过渡到另一个动画
  function executeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
    console.log('executeCrossFade', startAction, endAction, duration)
    // 在开始过渡之前，确保结束动作的权重为1
    setWeight(endAction, 1);
    endAction.time = 0;
  
    // 使用渐变过渡淡入、淡出 - 第三个参数设为false可以尝试无扭曲过渡
    startAction.crossFadeTo(endAction, duration, true);
  }
  // 此函数是必需的，因为animationAction.crossFadeTo()会禁用其起始动作
  // 并将起始动作的时间缩放设置为((起始动画持续时间)/(结束动画持续时间))
  function setWeight(action: THREE.AnimationAction, weight: number) {
    action.enabled = true;//启用动画
    action.setEffectiveTimeScale(1);//设置动画时间缩放
    action.setEffectiveWeight(weight);//设置动画权重
  }

  let frameId = 0;
  function animate() {
    frameId = requestAnimationFrame(animate)
    const delta = Timer.getDelta() // 或自己算 delta
    Timer.update()
    mixer?.update(delta)          // 必须有
    cameraPositionAdjustment()
    controls.update()

    // 蝴蝶翅膀扇动
    wing1.rotation.z = Math.sin(Date.now() * 0.02) * 0.3
    wing2.rotation.z = -Math.sin(Date.now() * 0.02) * 0.3
    
    // 花朵轻微摆动
    petals.rotation.y += 0.005
    renderer.render(scene, camera)
  }
  // 4) 状态机，根据状态执行不同的动画
  function setState(next: State) {
    if (state === next && next === 'DoorOpening') return
    state = next
    // 按需在这里挂/卸监听、播 GSAP
    if (next === 'DoorOpening') {
      openDoor();
    }
    if (next === 'Play') {
      playJump();
    }
  }
  
  //第 1 幕：门外点门
  const handleClick = (event: MouseEvent) => {
    console.log('handleClick', event)
    const px = event.offsetX;
    const py = event.offsetY;
    //屏幕坐标px、py转标准设备坐标x、y
    //width、height表示canvas画布宽高度
    const x = (px / host.clientWidth) * 2 - 1;
    const y = -(py / host.clientHeight) * 2 + 1;
    const mouse = new THREE.Vector2(x, y)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse, camera)
    const intersectssingleDoor = raycaster.intersectObject(singleDoor, false)
    const intersectsflower = raycaster.intersectObject(flower, true)
    const intersects = raycaster.intersectObject(ground, false)
    console.log('intersectssingleDoor', intersectssingleDoor)
    console.log('intersectsflower', intersectsflower)
    console.log('intersects', intersects)
    if (intersectssingleDoor.length > 0) {
      setState('DoorOpening')
    }else if(intersectsflower.length > 0 || intersects.length > 0) {
      target = intersectsflower.length > 0 ? intersectsflower[0].point.clone() : intersects[0].point.clone()
      console.log('target', target)
      playJump()
    }
  }
  /**
   * 第 2 幕：过门演出
   * 推门：转铰链，不要改 position
   * 相机推进 → 人 walk → 关门 → 雾/光变化
   */
  function openDoor() {
    followCamera = true
    controls.enabled = false
    let doorTl = gsap.timeline();
    doorTl.to(hinge.rotation, { y: -Math.PI / 2, duration: 1, ease: 'power1.inOut' })
    doorTl.to(model.position, {
      z: 10,
      duration: 1.2,
      ease: 'power1.inOut',
      onStart: () => {
        // 当前是 idle，切到 walk（不是 run→walk）
        executeCrossFade(idleAction, walkAction, 0.3)
      },
    })
    doorTl.to(model.position, {
      z: 3,
      duration: 1.5,
      ease: 'power1.inOut',
      onComplete: () => {
        executeCrossFade(walkAction, idleAction, 0.4)
        followCamera = false 
        controls.enabled = true
        controls.update()
        state = 'Play'
      },
    })
    doorTl.add(lightChangeAnimation(), '<') // 与「走到 z=3」同时
  
  }
  let modelface = false // true面部朝向Z轴正面，false面部朝向Z轴背面
  //玩耍
  //点蘑菇阶梯跳跃
  //点击目标 + 抛物线/冲量
  function playJump() {
    followCamera = true
    controls.enabled = false
    console.log('playJump',modelface)
    if (!model || !target) return
    //点击目标 + 抛物线/冲量人物跳跃到目标位置
    const jumpTl = gsap.timeline();
    const start = model.position.clone()
    const end = target.clone()
    /**  转向：如果目标在人物背面，则将模型面部转向目标 */
    if(end.z<start.z && modelface === true) {
      modelface = false
      jumpTl.to(model.rotation, { y: -Math.PI, duration: 0.3, ease: 'power1.inOut' })
      console.log('转向背面')
    }else if(end.z>start.z && modelface === false){
      modelface = true
      jumpTl.to(model.rotation, { y: Math.PI, duration: 0.3, ease: 'power1.inOut' })
      console.log('转向正面')
    }
    // end.y = 0 // 落到地面高度，不要用花心 y=3 除非站花上

    jumpTl.to(model.position, { x: end.x, z: end.z, duration: 0.8, ease: 'none', onStart: () => {
        // 当前是 idle，切到 walk（不是 run→walk）
        executeCrossFade(idleAction, walkAction, 0.3)
      }
    }, 0)
    jumpTl.to(model.position, { y: start.y + 2, duration: 0.4, ease: 'power2.out', yoyo: true, repeat: 1 ,
      onComplete: () => {
        executeCrossFade(walkAction, idleAction, 0.4)
        followCamera = false 
        controls.enabled = true
        controls.update()
      }}, 0)
 
  }
  /**
   * 关门动画
   */
  function closeDoor() {
    gsap.to(hinge.rotation, { y: Math.PI / 2, duration: 1, ease: 'power1.inOut' })
  }
  /**
   * 人walk动画
   */
  function personWalkAnimation() {
    //人开启跑步动画，同时人物位置跟随移动
    gsap.to(model.position, { z: 10, duration: 1, ease: 'power1.inOut', onUpdate: () => {
      runAction.play()
      cameraPositionAdjustment()
    } })
  } 

  // 相机跟随位置
  const follow = {
    height: 2.2,   // 抬高
    back: 5,       // 身后距离
    lookAtY: 1.2,  // 看向胸口/头
  }
  // 相机视角调整，聚焦人物，跟随移动
  function cameraPositionAdjustment() {
    if (!model || !followCamera) return;
    // 人朝 -Z 进门：身后是 +Z
    // if(modelface) {
    //   camera.position.set(
    //     model.position.x,
    //     model.position.y + follow.height,
    //     model.position.z - follow.back
    //   )
    // }else {
    //   camera.position.set(
    //     model.position.x,
    //     model.position.y + follow.height,
    //     model.position.z + follow.back
    //   )
    // }
 if(state === 'DoorOpening') {
        camera.position.set(
        model.position.x,
        model.position.y + follow.height,
        model.position.z + follow.back
      )
      controls.target.set(
        model.position.x,
        model.position.y + follow.lookAtY,
        model.position.z
      )
 }
    // if(camera.position.z - model.position.z >10) {
    //   camera.position.set(
    //     model.position.x,
    //     model.position.y + follow.height,
    //     camera.position.z-1
    //   )
    // }else if(camera.position.z < model.position.z ) {
    //   camera.position.set(
    //     model.position.x,
    //     model.position.y + follow.height,
    //     model.position.z+10
    //   )
    // }else {
    //   return
    // }
      
  }
  //光照变化动画,灯光雾
  function lightChangeAnimation() {
    // 目标色先转成 0~1
    const sky = new THREE.Color(0x87ceeb) // 或秘境色
    const lit = gsap.timeline()
    // 雾色跟天空，避免灰带
    lit.to(scene.fog!.color, { r: sky.r, g: sky.g, b: sky.b, duration: 1.2 }, 0)
    lit.to(scene.background as THREE.Color, { r: sky.r, g: sky.g, b: sky.b, duration: 1.2 }, 0)
    // 消退：near 略增、far 拉远 → 雾从身边退去
    lit.to(scene.fog!, { near: 15, far: 80, duration: 1.5, ease: 'power2.out' }, 0)
    // 可选：播完彻底去掉雾
    lit.call(() => { scene.fog = null })
    // 灯稍微提亮，场景更清楚
    lit.to(hemiLight, { intensity: 1.2, duration: 1.2 }, 0)
    lit.to(dirLight, { intensity: 2.5, duration: 1.2 }, 0)
    return lit
  }
  
  // 窗口自适应,监听 resize 事件, 更新相机和渲染器
  function resize() {
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix(); // 改了 aspect 后必须调用，否则投影矩阵不更新
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  init();
  function createPhysicsBody(PhysicsWorld: CANNON.World, model: THREE.Mesh, mass: number) {

    const box = new THREE.Box3().setFromObject(model);

    const { max, min } = box

    const center = new THREE.Vector3();

    box.getCenter(center);

    const body = new CANNON.Body({

        mass: mass,

        shape: new CANNON.Box(new CANNON.Vec3((max.x - min.x) / 2, (max.y - min.y) / 2, (max.z - min.z) / 2)),

        position: new CANNON.Vec3(center.x, center.y, center.z),

    })

    body.position.copy(new CANNON.Vec3(model.position.x, model.position.y, model.position.z))

    PhysicsWorld!.addBody(body)

    body.addEventListener('update', () => {
      model.position.copy(new THREE.Vector3(body.position.x, body.position.y, body.position.z))
      model.quaternion.copy(new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w))
    })

    return body
  }
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