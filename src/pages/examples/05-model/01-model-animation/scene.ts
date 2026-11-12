import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
// 给原来的gltf加载器设置解压功能
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
const createBasicsScene = (host: HTMLDivElement) => {
  let scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, stats: Stats;
  let model: THREE.Object3D, skeleton: THREE.SkeletonHelper, mixer: THREE.AnimationMixer, Timer: THREE.Timer;

  const crossFadeControls: GUI[] = [];

  let idleAction: THREE.AnimationAction, walkAction: THREE.AnimationAction, runAction: THREE.AnimationAction;
  let idleWeight: number, walkWeight: number, runWeight: number;
  let actions: THREE.AnimationAction[], settings: any;

  //单步执行模式
  let singleStepMode = false;
  //单步执行步长
  let sizeOfNextStep = 0;

  //轨道控制器
  let controls: OrbitControls;
  //相机目标点
  let cameraTarget = new THREE.Vector3();
  let panel: GUI;
  let dracoLoader: DRACOLoader;
  let disposed = false
  init();

  function init() {

    camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    camera.position.set(1, 2, -3);
    camera.lookAt(0, 1, 0);

    Timer = new THREE.Timer();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

    //创建半球光源
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    //创建平行光源
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
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

    // 地面
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);
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
        console.log('控制台查看gltf对象结构', gltf);
        console.log('动画数据', gltf.animations);
        if (disposed) return
        model = gltf.scene;
        scene.add(model);

        //遍历模型所有子对象，设置阴影
        model.traverse(function (object) {
          if (object instanceof THREE.Mesh) object.castShadow = true;
        });
        console.log(model, "模型");
        //

        skeleton = new THREE.SkeletonHelper(model);
        skeleton.visible = false;
        scene.add(skeleton);

        //

        createPanel();

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

        renderer.setAnimationLoop(animate);
      }
    );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);//设置渲染器像素比
    renderer.setSize(window.innerWidth, window.innerHeight);//设置渲染器尺寸
    renderer.shadowMap.enabled = true;//启用阴影贴图
    host?.appendChild(renderer.domElement);//挂载渲染器

    stats = new Stats();
    host?.appendChild(stats.dom);//挂载渲染帧率(FPS)

    stats.dom.style.position = 'absolute';
    stats.dom.style.left = '30px';
    stats.dom.style.top = 'auto';
    stats.dom.style.bottom = '0px';

    window.addEventListener("resize", onWindowResize);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;//启用阻尼
    controls.dampingFactor = 0.05;//阻尼系数
    controls.screenSpacePanning = true;//启用屏幕空间平移
    controls.minDistance = 3;//最小距离
    controls.maxDistance = 20;//最大距离
    controls.maxPolarAngle = Math.PI / 2;//最大极角

    
    // // 创建网格地面
    const gridHelper = new THREE.GridHelper(10, 10)
    scene.add(gridHelper)
  }

  //创建控制面板
  function createPanel() {
    panel = new GUI({ width: 310 });

    const folder1 = panel.addFolder("可见性控制");
    const folder2 = panel.addFolder("动画激活/停用");
    const folder3 = panel.addFolder("暂停/步进");
    const folder4 = panel.addFolder("动画过渡");
    const folder5 = panel.addFolder("混合权重");
    const folder6 = panel.addFolder("全局速度");

    //设置控制面板的初始值
    settings = {
      "show model": true,
      "show skeleton": false,
      "deactivate all": deactivateAllActions,
      "activate all": activateAllActions,
      "pause/continue": pauseContinue,
      "make single step": toSingleStepMode,
      "modify step size": 0.05,
      "from walk to idle": function () {
        prepareCrossFade(walkAction, idleAction, 1.0);
      },
      "from idle to walk": function () {
        prepareCrossFade(idleAction, walkAction, 0.5);
      },
      "from walk to run": function () {
        prepareCrossFade(walkAction, runAction, 2.5);
      },
      "from run to walk": function () {
        prepareCrossFade(runAction, walkAction, 5.0);
      },
      "use default duration": true,
      "set custom duration": 3.5,
      "modify idle weight": 0.0,
      "modify walk weight": 1.0,
      "modify run weight": 0.0,
      "modify time scale": 1.0,
    };

    folder1.add(settings, "show model").name("显示模型").onChange(showModel);
    folder1
      .add(settings, "show skeleton")
      .name("显示骨骼")
      .onChange(showSkeleton);
    folder2.add(settings, "deactivate all").name("停用所有");
    folder2.add(settings, "activate all").name("激活所有");
    folder3.add(settings, "pause/continue").name("暂停/继续");
    folder3.add(settings, "make single step").name("单步执行");
    folder3.add(settings, "modify step size", 0.01, 0.1, 0.001).name("步长修改");
    crossFadeControls.push(
      folder4.add(settings, "from walk to idle").name("从行走到待机") as any
    );
    crossFadeControls.push(
      folder4.add(settings, "from idle to walk").name("从待机到行走") as any
    );
    crossFadeControls.push(
      folder4.add(settings, "from walk to run").name("从行走到跑步") as any
    );
    crossFadeControls.push(
      folder4.add(settings, "from run to walk").name("从跑步到行走") as any
    );
    folder4.add(settings, "use default duration").name("使用默认时长");
    folder4.add(settings, "set custom duration", 0, 10, 0.01).name("自定义时长");
    folder5
      .add(settings, "modify idle weight", 0.0, 1.0, 0.01)
      .name("待机权重")
      .listen()
      .onChange(function (weight) {
        setWeight(idleAction, weight);
      });
    folder5
      .add(settings, "modify walk weight", 0.0, 1.0, 0.01)
      .name("行走权重")
      .listen()
      .onChange(function (weight) {
        setWeight(walkAction, weight);
      });
    folder5
      .add(settings, "modify run weight", 0.0, 1.0, 0.01)
      .name("跑步权重")
      .listen()
      .onChange(function (weight) {
        setWeight(runAction, weight);
      });
    folder6
      .add(settings, "modify time scale", 0.0, 1.5, 0.01)
      .name("时间缩放")
      .onChange(modifyTimeScale);

    folder1.open();
    folder2.open();
    folder3.open();
    folder4.open();
    folder5.open();
    folder6.open();
  }

  //显示模型
  function showModel(visibility: boolean) {
    model.visible = visibility;
  }

  //显示骨骼
  function showSkeleton(visibility: boolean) {
    skeleton.visible = visibility;
  }

  //修改时间缩放
  function modifyTimeScale(speed: number) {
    mixer.timeScale = speed;
  }

  //停用所有动画
  function deactivateAllActions() {
    actions.forEach(function (action) {
      action.stop();
    });
  }

  //激活所有动画
  function activateAllActions() {
    setWeight(idleAction, settings["modify idle weight"]);
    setWeight(walkAction, settings["modify walk weight"]);
    setWeight(runAction, settings["modify run weight"]);

    actions.forEach(function (action) {
      action.play();
    });
  }

  //暂停/继续所有动画
  function pauseContinue() {
    if (singleStepMode) {
      singleStepMode = false;
      unPauseAllActions();
    } else {
      if (idleAction.paused) {
        unPauseAllActions();
      } else {
        pauseAllActions();
      }
    }
  }
  //暂停所有动画
  function pauseAllActions() {
      actions.forEach(function (action) {
        action.paused = true;
      });
    }
  //继续所有动画
  function unPauseAllActions() {
      actions.forEach(function (action) {
          action.paused = false;
      });
  }

  //单步执行模式
  function toSingleStepMode() {
      unPauseAllActions();

      singleStepMode = true;
      sizeOfNextStep = settings["modify step size"];
  }

  //准备过渡：从一个动画过渡到另一个动画
  function prepareCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, defaultDuration: number) {
    // 根据用户选择切换默认/自定义过渡持续时间
    const duration = setCrossFadeDuration(defaultDuration);
  
    // 确保不在单步模式下，且所有动作都未暂停
    singleStepMode = false;
    unPauseAllActions();
  
    // 如果当前动作是'待机'（持续4秒），立即执行过渡
    // 否则等待当前动作完成其当前循环
    if (startAction === idleAction) {
      executeCrossFade(startAction, endAction, duration);
    } else {
      synchronizeCrossFade(startAction, endAction, duration);
    }
  }
  
  //设置过渡持续时间
  function setCrossFadeDuration(defaultDuration: number) {
    // 根据用户选择切换默认/自定义过渡持续时间
    if (settings["use default duration"]) {
      return defaultDuration;
    } else {
      return settings["set custom duration"];
    }
  }
  
  //同步过渡：等待当前动作完成其当前循环
  function synchronizeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
    mixer.addEventListener("loop", onLoopFinished);
  
    function onLoopFinished(event: any) {
      if (event.action === startAction) {
        mixer.removeEventListener("loop", onLoopFinished);
  
        executeCrossFade(startAction, endAction, duration);
      }
    }
  }
  
  //执行过渡：从一个动画过渡到另一个动画
  function executeCrossFade(startAction: THREE.AnimationAction, endAction: THREE.AnimationAction, duration: number) {
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
  
  // 由渲染循环调用
  function updateWeightSliders(): void {
    settings["modify idle weight"] = idleWeight;
    settings["modify walk weight"] = walkWeight;
    settings["modify run weight"] = runWeight;
  }
  
  // 由渲染循环调用
  function updateCrossFadeControls(): void {
    if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
      (crossFadeControls[0] as any).disable(); // 禁用从行走到待机
      (crossFadeControls[1] as any).enable(); // 启用从待机到行走
      (crossFadeControls[2] as any).disable(); // 禁用从行走到跑步
      (crossFadeControls[3] as any).disable(); // 禁用从跑步到行走
    }
  }
  
  function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  //动画循环
  function animate(timestamp?: number) {
    Timer.update(timestamp);

    idleWeight = idleAction.getEffectiveWeight();
    walkWeight = walkAction.getEffectiveWeight();
    runWeight = runAction.getEffectiveWeight();
  
    // 如果权重从"外部"修改（通过过渡效果），更新面板值
    updateWeightSliders();
  
    // 根据当前权重值启用/禁用过渡控制
    updateCrossFadeControls();
  
    // 获取上一帧到当前帧的时间差，用于混合器更新（非单步模式下）
    let mixerUpdateDelta = Timer.getDelta();
  
    // 如果在单步模式下，执行一步然后停止（直到用户再次点击）
    if (singleStepMode) {
      mixerUpdateDelta = sizeOfNextStep;
      sizeOfNextStep = 0;
    }
  
    // 更新动画混合器、状态面板，并渲染此帧
    mixer.update(mixerUpdateDelta);
  
    if (model) {
      // 更新相机目标点
      cameraTarget.copy(model.position);
      cameraTarget.y += 1;
      
      // 更新轨道控制器的目标点
      controls.target.copy(cameraTarget);
    }
  
    // 更新控制器 - 这会处理缩放和旋转
    controls.update();
  
    renderer.render(scene, camera);
  
    stats.update();
  }

    // 释放模型资源
    function disposeModel(gltf: THREE.Object3D) {
        gltf.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose()
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose())
                } else {
                    child.material.dispose()
                }
            }
        })
    }
    const dispose = () => {
        disposed = true   
        // 停动画循环
        renderer.setAnimationLoop(null)
        Timer.disconnect();
        // 停 mixer
        mixer?.stopAllAction();
        // 停 GUI
        panel?.destroy()
        panel = undefined as any 
        // skeleton?.dispose();
        skeleton?.geometry.dispose();
        if (Array.isArray(skeleton?.material)) {
            skeleton?.material.forEach(m => m.dispose());
        } else {
            skeleton?.material.dispose();
        }
        dracoLoader.dispose()
        // 停 controls
        controls.dispose();
        // 停 renderer
        renderer.dispose();
        renderer.domElement.remove();
        window.removeEventListener('resize', onWindowResize);

        if (model) disposeModel(model)
    };
    return {dispose}
}

export { createBasicsScene }