import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const createBasicsScene = (host: HTMLDivElement) => {
    
    const scene = new THREE.Scene()
    // 创建立方体（长宽高）
    const geometry = new THREE.BoxGeometry(4, 2, 1)
    // 材质
    const vertexShader = `
    void main() {
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    }
    `
    const fragmentShader = `
    uniform vec2 u_resolution;
    uniform float iTime;
    vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
    {
        return a + b*cos( 6.283185*(c*t+d) );
    }
    void main() {
          vec3 finalcol = vec3(0.0);
        vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy) / u_resolution.y;
        vec2 uv0 = uv;
        for (float i = 0.0; i < 3.0; i++) {
           
            uv = fract(uv*5.5)-0.5;
            vec3 col = palette(length(uv0)+iTime,vec3(0.768, 0.648, 1.0), vec3(-0.252, -0.082, 0.0), vec3(0.5, 0.5, 0.0), vec3(0.5, 0.0, 0.0));
            
            float d = length(uv) * exp(-length(uv0));
    
            d = sin(d*8. + iTime)/8.;
            d = abs(d);
    
            d = pow(0.01 / d, 1.2);
            
            finalcol += col * d;
        }
        gl_FragColor = vec4(finalcol, 1.0);
    }
    `
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    const material = new THREE.ShaderMaterial({
        uniforms: {
            u_resolution: { value: new THREE.Vector2(host.clientWidth, host.clientHeight) },
            iTime: { value: 0 }
        },
        vertexShader,
        fragmentShader
    });
    const cube = new THREE.Mesh(geometry, material)
    // cube.position.set(0, 20, 0); //立方体模型位置
    scene.add(cube)
    // 子物体：周围四个小立方体
    const childGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const childMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.6 })
    for (let i = 0; i < 4; i++) {
        const child = new THREE.Mesh(childGeo, childMat);
        const angle = (i / 4) * Math.PI * 2;
        child.position.set(Math.cos(angle) * 2, 0, Math.sin(angle) * 2);//子物体位置:球坐标系,角度,半径
        cube.add(child);   // 关键：加到父物体上，而不是 scene
    }
    // 创建坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
    // // 创建网格地面
    // const gridHelper = new THREE.GridHelper(10, 10)
    // scene.add(gridHelper)

    
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

    // 动画循环
    const timer = new THREE.Timer();
    timer.connect(document); // 切走标签页时避免 delta 突然很大
    let frameId = 0;
    function AnimationLoop(timestamp?: number) {
        timer.update(timestamp);
    
        const spt = timer.getDelta() * 1000;//毫秒,速度跟帧率绑定
        console.log('两帧渲染时间间隔(毫秒)', spt);
        console.log('帧率FPS', 1000 / spt);

        renderer.render(scene, camera); //执行渲染操作
        cube.rotateY(0.01);//每次绕y轴旋转0.01弧度
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

    return { scene, camera, renderer, cube, controls, dispose }
}

export { createBasicsScene }