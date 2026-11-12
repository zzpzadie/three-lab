import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
const createBasicsScene = async (host: HTMLDivElement) => {
  //创建场景
  const scene = new THREE.Scene();
    // 创建坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    
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
// 文件地址
const urls = [0, 1, 2, 3, 4, 5].map(k => (`https://z2586300277.github.io/3d-file-server/` + 'files/sky/skyBox0/' + (k + 1) + '.png'));

const textureCube = new THREE.CubeTextureLoader().load(urls);

scene.background = textureCube;


const video = document.createElement('video')

video.crossOrigin = 'anonymous' // 跨域

video.src = 'https://z2586300277.github.io/3d-file-server/video/test.mp4'

video.loop = true // 循环播放

video.muted = true // 静音

video.play()

const texture = await new Promise(r => video.onloadeddata = () => r(new THREE.VideoTexture(video))) // 创建视频纹理

new GLTFLoader().load(`/models/quit.glb`, (gltf) => {

  gltf.scene.traverse((child) => {

    if (child instanceof THREE.Mesh) {

      child.material.map = texture

      child.material.envMap = textureCube

    }

  })

  scene.add(gltf.scene)

})
    // 动画循环
    const timer = new THREE.Timer();
    timer.connect(document); // 切走标签页时避免 delta 突然很大
    let frameId = 0;
    function AnimationLoop(timestamp?: number) {
        timer.update(timestamp);
    

        renderer.render(scene, camera); //执行渲染操作
        frameId = requestAnimationFrame(AnimationLoop);//请求再次执行渲染函数AnimationLoop，渲染下一帧
    }
    AnimationLoop();

    // 创建轨道控制器,可以拖动鼠标旋转相机
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;//启用阻尼
    controls.dampingFactor = 0.25;//阻尼系数
    controls.enableZoom = true;//启用缩放
    controls.enablePan = true;//启用平移
    controls.enableRotate = true;//启用旋转
    const dispose = () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        controls.dispose();
    };
    return {dispose}
}

export { createBasicsScene }