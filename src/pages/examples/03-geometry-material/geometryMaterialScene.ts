import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { FILE_HOST } from '@/config/assets'

const createGeometryMaterialScene = (host: HTMLDivElement) => {
    const scene = new THREE.Scene() 
    // scene.background = new THREE.Color(0x160016);

    // 创建立方体
    // const cubeGeometry = new THREE.BoxGeometry(4, 2, 1)
    // const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
    // scene.add(cube)
    // 创建坐标轴辅助器
    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)
    // 添加一个辅助网格地面
    // const gridHelper = new THREE.GridHelper(300, 25, 0x004444, 0x004444);
    // scene.add(gridHelper)
    // 创建透视相机（宽高比用挂载容器，不要用整窗，页面上方还有返回链接）
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 35, 60); //相机位置
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
    const geometry = new THREE.BufferGeometry();
    // 创建一个简单的正方形形状。我们重复顶点因为每个顶点需要出现在每个三角形中。
    const vertices = new Float32Array([
      // 前 z=1
      -1,-1, 1,  1,-1, 1,  1, 1, 1, -1, 1, 1,
      // 后 z=-1（注意绕序，否则朝向反）
      1,-1,-1, -1,-1,-1, -1, 1,-1,  1, 1,-1,
      // 右 x=1
      1,-1, 1,  1,-1,-1,  1, 1,-1,  1, 1, 1,
      // 左 x=-1
      -1,-1,-1, -1,-1, 1, -1, 1, 1, -1, 1,-1,
      // 上 y=1
      -1, 1, 1,  1, 1, 1,  1, 1,-1, -1, 1,-1,
      // 下 y=-1
      -1,-1,-1,  1,-1,-1,  1,-1, 1, -1,-1, 1,
    ]) // 24 个点
    // Uint16Array类型数组创建顶点索引数据
    const indexes = new Uint16Array([
      // 下面索引值对应顶点位置数据中的顶点坐标
      0, 1, 2,  0, 2, 3,       // 前
      4, 5, 6,  4, 6, 7,       // 后
      8, 9, 10, 8, 10, 11,     // 右
      12, 13, 14, 12, 14, 15,  // 左
      16, 17, 18, 16, 18, 19,  // 上
      20, 21, 22, 20, 22, 23,  // 下
    ])

    // itemSize = 3 因为每个顶点有3个值（组件）
    geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    // 3. 把索引数据装进去
    geometry.index = new THREE.BufferAttribute(indexes, 1);
    const uvs = new Float32Array([
      // 对应顶点 0~3（前面）
      0, 0,  1, 0,  1, 1,  0, 1,
      // 对应顶点 4~7（后面）——数量要对齐，具体值可再调
      0, 0,  1, 0,  1, 1,  0, 1,
      // 对应顶点 8~11（底部）
      0, 0,  1, 0,  1, 1,  0, 1,
      // 对应顶点 12~15（顶部）
      0, 0,  1, 0,  1, 1,  0, 1,
      // 对应顶点 8~11（底部）
      0, 0,  1, 0,  1, 1,  0, 1,
      // 对应顶点 12~15（顶部）
      0, 0,  1, 0,  1, 1,  0, 1,

    ]);
    // 设置几何体attributes属性的位置uv属性
    geometry.attributes.uv = new THREE.BufferAttribute(uvs, 2); //2个为一组,表示一个顶点的纹理坐标
    
    // 矩形平面，无索引，两个三角形，6个顶点
    // 每个顶点的法线数据和顶点位置数据一一对应
    // const normals = new Float32Array([
    //    // 1. 前面 (z=1) - 法线朝向正 Z 轴 (0, 0, 1)
    //  0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
    
    //  // 2. 后面 (z=-1) - 法线朝向负 Z 轴 (0, 0, -1)
    //   0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,
     
    //  // 3. 右面 (x=1) - 法线朝向正 X 轴 (1, 0, 0)
    //   1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
     
    //  // 4. 左面 (x=-1) - 法线朝向负 X 轴 (-1, 0, 0)
    //  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
     
    //  // 5. 上面 (y=1) - 法线朝向正 Y 轴 (0, 1, 0)
    //   0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
     
    //  // 6. 下面 (y=-1) - 法线朝向负 Y 轴 (0, -1, 0)
    //   0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
    // ]);
    // // 设置几何体的顶点法线属性.attributes.normal
    // geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.computeVertexNormals(); 

    const alpha_url = FILE_HOST + "images/four/photo-1510942752400-ebce99a8a2c0.avif";
    const texture = new THREE.TextureLoader().load(alpha_url);
    texture.colorSpace = THREE.SRGBColorSpace;//设置纹理颜色空间为sRGB，确保颜色正确显示

    const urls = [1, 2, 3, 4, 5, 6].map(
      (n) => FILE_HOST + `files/sky/skyBox0/${n}.png`
    )
    new THREE.CubeTextureLoader().load(urls,   (envMap) => {
      envMap.colorSpace = THREE.SRGBColorSpace // 颜色贴图类 cubemap 建议设 sRGB
      scene.background = envMap
      scene.environment = envMap
      // 若材质需要 envMap，且 load 时还没挂上，可在这里补：
      material.envMap = envMap
      material.needsUpdate = true
    },
    undefined, // onProgress，可选
    (err) => {
      console.error('天空盒加载失败', err)
    })
    const material = new THREE.MeshStandardMaterial( {
       map: texture, 
       side: THREE.DoubleSide, 
       transparent: true,
       metalness: 0,
       roughness: 1,
       blending: THREE.NormalBlending, // 默认，可省略 AdditiveBlending
depthTest: false,
       } );
    const mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);
      
    scene.add(new THREE.AmbientLight(0xffffff, 1));
    scene.add(new THREE.DirectionalLight(0xffffff, 1));

    // 创建粒子系统
    let gu = { time: { value: 0 }, };

    let sizes = [];
    let shift: number[] = [];
    let pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
        Math.random() * 0.9 + 0.1
      );
    };
    let pts: THREE.Vector3[] = new Array(50000).fill(null).map(() => {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
      return new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(Math.random() * 0.5 + 9.5);
    });
    for (let i = 0; i < 100000; i++) {
      let r = 10,
        R = 40;
      let rand = Math.pow(Math.random(), 1.5);
      let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      pts.push(
        new THREE.Vector3().setFromCylindricalCoords(
          radius,
          Math.random() * 2 * Math.PI,
          (Math.random() - 0.5) * 2
        )
      );
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
    }

    let g: THREE.BufferGeometry = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
    let m: THREE.PointsMaterial = new THREE.PointsMaterial({
      size: 0.125,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending
    });

    m.onBeforeCompile = (shader) => {
      shader.uniforms.time = gu.time
    
      shader.vertexShader = `
        uniform float time;
        attribute float sizes;
        attribute vec4 shift;
        varying vec3 vColor;
        ${shader.vertexShader}
      `
        .replace(`gl_PointSize = size;`, `gl_PointSize = size * sizes;`)
        .replace(
          `#include <color_vertex>`,
          `#include <color_vertex>
            float d = length(abs(position) / vec3(40., 10., 40));
            d = clamp(d, 0., 1.);
            vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
          `
        )
        .replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>
            float t = time;
            float moveT = mod(shift.x + shift.z * t, PI2);
            float moveS = mod(shift.y + shift.z * t, PI2);
            transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
          `
        )
    
      shader.fragmentShader = `
        varying vec3 vColor;
        ${shader.fragmentShader}
      `
        .replace(
          `vec4 diffuseColor = vec4( diffuse, opacity );`,
          `float d = length(gl_PointCoord.xy - 0.5);      
          vec4 diffuseColor = vec4( vColor, 1.0 - smoothstep(0.5, 0.1, d) );`
        )
    }
    let p = new THREE.Points(g, m);
    p.rotation.order = "ZYX";
    p.rotation.z = 0.2;
    scene.add(p);

    const timer = new THREE.Timer()
    timer.connect(document)

    // 渲染场景动画
    renderer.setAnimationLoop((timestamp) => {
      timer.update(timestamp) // 没有这行，getElapsed() 一直是 0
      controls.update()
      const t = timer.getElapsed() * 0.5
      gu.time.value = t * Math.PI
      p.rotation.y = t * 0.05

      // 设置.wrapS也就是U方向，纹理映射模式(包裹模式)
      texture.wrapS = THREE.RepeatWrapping;//对应offste.x偏移
      texture.offset.x +=0.001;//设置纹理动画：偏移量根据纹理和动画需要，设置合适的值
      renderer.render(scene, camera)
    })

    const dispose = () => {
        renderer.setAnimationLoop(null)
        timer.disconnect()
        window.removeEventListener('resize', resize);
        controls.dispose();
    };
    return { scene, camera, renderer, controls, dispose }
}

export { createGeometryMaterialScene }
