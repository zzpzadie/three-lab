import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const createCameraScene = (host: HTMLDivElement) => {
    const scene = new THREE.Scene() 
    
    // // 创建立方体（长宽高）
    // const boxGeometry = new THREE.BoxGeometry(4, 2, 1)
    // const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    // 三个网格模型mesh1,mesh2,mesh3用于射线拾取测试
    const geometry = new THREE.SphereGeometry(1, 32, 16);
    const material = new THREE.MeshLambertMaterial({
        color: 0x009999,
    });
    const mesh1 = new THREE.Mesh(geometry, material);
    const mesh2 = mesh1.clone();
    mesh2.material = (mesh1.material as THREE.MeshLambertMaterial).clone()
    mesh2.position.y = 2;
    const mesh3 = mesh1.clone();
    mesh3.material = (mesh1.material as THREE.MeshLambertMaterial).clone()
    mesh3.position.x = 2;
    const model = new THREE.Group();
    model.add(mesh1, mesh2, mesh3);
    model.updateMatrixWorld(true);

    // const cube = new THREE.Mesh(boxGeometry, boxMaterial)
    // scene.add(cube)
    scene.add(model)
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    scene.add(new THREE.DirectionalLight(0xffffff, 1));
    // 创建坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
    // 创建射线对象Ray（起点，方向）
    // const ray = new THREE.Raycaster( new THREE.Vector3(-100, 0, 0), new THREE.Vector3(1, 0, 0))
    // const intersects = ray.intersectObjects([mesh1, mesh2, mesh3])//获取射线与场景中物体的交点
    // console.log('射线与场景中物体的交点',intersects)
    // if (intersects.length > 0) {
    //     console.log("交叉点坐标", intersects[0].point);
    //     console.log("交叉对象",intersects[0].object);
    //     console.log("射线原点和交叉点距离",intersects[0].distance);
    // }

   // 创建透视相机（宽高比用挂载容器，不要用整窗，页面上方还有返回链接）
   const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
   camera.position.set(5, 5, 5); //相机位置
   camera.lookAt(0, 0, 0);   //相机观察位置

   // 创建渲染器
   const renderer = new THREE.WebGLRenderer()
   host.appendChild(renderer.domElement)

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




    // 创建轨道控制器,可以拖动鼠标旋转相机
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;//启用阻尼
    controls.dampingFactor = 0.25;//阻尼系数
    controls.enableZoom = true;//启用缩放
    controls.enablePan = true;//启用平移
    controls.enableRotate = true;//启用旋转

    // 监听轨道控制器变化，重新渲染场景
    controls.addEventListener('change', () => {
        renderer.render(scene, camera);
      });

    // 初始化渲染场景
    renderer.render(scene, camera);
    const dispose = () => {
        window.removeEventListener('resize', resize);
        controls.dispose();
    };
    const NORMAL = 0x009999
    const HIGHLIGHT = 0xff0000
    const selected = new Set<THREE.Mesh>()
    const clearHighlight = () => {
        model.children.forEach((obj) => {
            if (obj instanceof THREE.Mesh) {
              (obj.material as THREE.MeshLambertMaterial).color.set(NORMAL)
            }
          })
      }
      const applyHighlight = (mesh: THREE.Mesh, on: boolean) => {
        const mat = mesh.material as THREE.MeshLambertMaterial
        mat.color.set(on ? HIGHLIGHT : NORMAL)
      }
      const setHighlight = (mesh: THREE.Mesh) => {
        if (selected.has(mesh)) {
            selected.delete(mesh)
            applyHighlight(mesh, false)
          } else {
            selected.add(mesh)
            applyHighlight(mesh, true)
          }
      }
    //双击聚焦
    const focusObject = (object: THREE.Mesh) => {
        camera.position.copy(object.position.clone().add(new THREE.Vector3(0, 0, 3)));
        camera.lookAt(object.position.clone());
        controls.target.copy(object.position.clone());
    }
    // 取消聚焦
    const unfocusObject = (object: THREE.Mesh) => {
        console.log('取消聚焦物体',object.material);

        camera.position.copy(new THREE.Vector3(5, 5, 5));
        camera.lookAt(0, 0, 0);   //相机观察位置
        controls.target.copy(new THREE.Vector3(0, 0, 0));
    }


    // 点击高亮事件
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
        if (intersects.length > 0) {
            // 再点同一个 → 取消；点别的 → 切换到它
            setHighlight(intersects[0].object as THREE.Mesh)
        }else{
            clearHighlight()// 点空白清空
        }
        renderer.render(scene, camera)
      }

    // 双击聚焦事件
    const handleDoubleClick = (event: MouseEvent) => {
        console.log('双击聚焦事件');
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
        if (intersects.length > 0) {
            focusObject(intersects[0].object as THREE.Mesh)
        }else{
            unfocusObject(mesh1 as THREE.Mesh)
        }
    }
    //相机平滑移动
    const smoothMoveCamera = (target: THREE.Vector3, thenHome = true) => {
        const start = camera.position.clone();
        const end = target.clone();
        const duration = 1000;
        const startTime = performance.now();//开始时间毫秒
         controls.enabled = false;//禁用轨道控制器
        const move = () => {
            // const time = performance.now();//当前时间毫秒
            // const progress = (time - startTime) / duration;
            // const t = Math.min(progress, 1)
            // camera.position.copy(start).lerp(end, t);//返回一个基于给定区间的两个已知点线性插值的值
            // renderer.render(scene, camera);
            const t = Math.min((performance.now() - startTime) / duration, 1)
            camera.position.copy(start).lerp(end, t)//Vector3.lerp(目标, t)（两个参数）返回一个基于给定区间的两个已知点线性插值的值
            camera.lookAt(0, 0, 0)
            controls.target.set(0, 0, 0)
            controls.update() // 有 damping 时尤其重要
            renderer.render(scene, camera)
            if (t < 1) {
                requestAnimationFrame(move);
            }
            else if (thenHome) {
                // 第二次调用：thenHome=false，不会再递归
                smoothMoveCamera(new THREE.Vector3(5, 5, 5), false)
              } else {
                controls.enabled = true
              }
        }
        move();
    }
    return { scene, camera, renderer, controls, dispose,handleClick, handleDoubleClick, smoothMoveCamera }
}

export { createCameraScene }
