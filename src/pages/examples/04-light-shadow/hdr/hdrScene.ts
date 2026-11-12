import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
const createHDRScene = (host: HTMLDivElement) => {
    
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111);

    // 地面：一个圆形或方形的展台
    const groundGeometry = new THREE.PlaneGeometry(10, 10)

    const FILE_HOST = 'https://z2586300277.github.io/3d-file-server/'
    const urls = [1, 2, 3, 4, 5, 6].map(
      (n) => FILE_HOST + `files/sky/skyBox0/${n}.png`
    )
    new THREE.CubeTextureLoader().load(urls,   (envMap) => {
      envMap.colorSpace = THREE.SRGBColorSpace // 颜色贴图类 cubemap 建议设 sRGB
      // scene.background = envMap
      // scene.environment = envMap
      // 若材质需要 envMap，且 load 时还没挂上，可在这里补：
      // groundMaterial.envMap = envMap
      groundMaterial.needsUpdate = true
    },
    undefined, // onProgress，可选
    (err) => {
      console.error('天空盒加载失败', err)
    })
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff ,
        side:THREE.DoubleSide,
        metalness: 1, 
        roughness: 0
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)
    scene.add(new THREE.DirectionalLight(0x8080ff , 1));// 平行光

    
    // 阴影贴图
    


    
    const textureLoader = new THREE.TextureLoader();
    const perlinTexture = textureLoader.load(`https://z2586300277.github.io/3d-file-server/` + 'examples/coffeeMug/perlin.png');
    perlinTexture.wrapS = THREE.RepeatWrapping;
    perlinTexture.wrapT = THREE.RepeatWrapping;

    const smokeGeometry = new THREE.PlaneGeometry(1, 1, 16, 64);
    smokeGeometry.translate(0, 0.5, 0);
    smokeGeometry.scale(1.5, 6, 1.5);

    const smokeMaterial = new THREE.ShaderMaterial({
        // wireframe: true,
        vertexShader:`#define M_PI 3.1415926535897932384626433832795

        varying vec2 vUv;
        
        uniform float uTime;
        uniform sampler2D uPerlinTexture;
        
        vec2 rotate2D(vec2 value, float angle)
        {
        float s = sin(angle);
        float c = cos(angle);
        mat2 m = mat2(c, s, -s, c);
        return m * value;
        }

        
        void main()
        {
          vUv = uv;
        
          vec3 newPosition = position;
          float angle = texture(
            uPerlinTexture,
            vec2(0.5, uv.y * 0.3 + uTime * 0.02
          )).x * 7.;
          newPosition.xz = rotate2D(position.xz, angle);
        
          vec2 windOffset = vec2(
            texture(uPerlinTexture, vec2(0.2, uTime * 0.02)).x - 0.5,
            texture(uPerlinTexture, vec2(0.7, uTime * 0.02)).x - 0.5
          );
        
          newPosition.xz += windOffset * pow(uv.y, 2.) * 8.;
        
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
        }
        `,
        fragmentShader:`varying vec2 vUv;

        uniform float uTime;
        uniform sampler2D uPerlinTexture;
        
        void main()
        {
        
          vec2 uv = vec2(vUv.x * 0.5, vUv.y * 0.3 - uTime / 15.);
        
          float intensity = texture2D(uPerlinTexture, uv).x;
          intensity = smoothstep(0.4, 1.0, intensity);
          
          intensity *= smoothstep(0.0, 0.1, vUv.x);
          intensity *= smoothstep(1.0, 0.9, vUv.x);
        
          intensity *= smoothstep(0.0, 0.1, vUv.y);
          intensity *= smoothstep(1.0, 0.4, vUv.y);
        
        
          gl_FragColor = vec4(1.0, 0.8, 0.6, intensity);
          
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
        `,
        uniforms: {
            uTime: { value: 0 },
            uPerlinTexture: { value: perlinTexture },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
    });

    const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
    smoke.position.y = 1.83;
    // scene.add(smoke);
    
    // 创建透视相机（宽高比用挂载容器，不要用整窗，页面上方还有返回链接）
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(5, 5, 15); //相机位置
    camera.lookAt(0, 0, 0);   //相机观察位置
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer()
    host.appendChild(renderer.domElement)
    renderer.shadowMap.enabled = true
    ground.receiveShadow = true // 地面

    // // 用 HDRI 做环境光照
    const hdriLoader = new HDRLoader ();
    hdriLoader.load('/src/assets/HDR/grasslands_sunset_4k.hdr', (hdri: THREE.Texture) => {
      hdri.mapping = THREE.EquirectangularReflectionMapping
      scene.environment = hdri
      scene.background = hdri   // 缺这行就仍是黑底
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
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

        renderer.render(scene, camera); //执行渲染操作

        smokeMaterial.uniforms.uTime.value += spt / 1000;
        smokeMaterial.needsUpdate = true;
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

    return { scene, camera, renderer, controls, dispose }
}

export { createHDRScene }