# 目标/实现/踩坑/面试题
## 目标
不只会用现成几何体，而是能造几何、贴对图、打对光——后面做自定义模型、地形、粒子、PBR 展示、面试讲 BufferGeometry/PBR 时都用得上

学什么：BufferGeometry、顶点/索引/UV/法线、材质类型、纹理加载、颜色空间、PBR 基础。


实战：程序化地形、粒子星系、自定义 BufferGeometry 几何体。

验收：
- 能手写顶点和索引创建几何体
- 能解释 UV、法线、切线的作用
- 能处理纹理颜色空间和重复包裹
## 实现

### 手写顶点 / 索引
内置 BoxGeometry 不够用时：地形、自定义模型、线段、特效网格、从服务器下发的点数据，都要自己拼 BufferGeometry。粒子星系本质也是「一堆点属性」。数据在 TypedArray，适合整块上传 GPU，无旧 Geometry 那种对象数组开销。顶点三个为一组，因为是三维坐标，三组一个面， GPU 只画三角形，不画四边形，粒子数据太多时可以用索引允许顶点在多个三角形间重复使用。将顶点和索引数据都放入BufferAttribute即可
### 顶点UV坐标
顶点在贴图上的坐标，从纹理贴图上提取像素映射到网格模型Mesh的几何体表面上
顶点UV坐标可以在0~1.0之间任意取值，纹理贴图左下角对应的UV坐标是(0,0)，右上角对应的坐标(1,1)。2个为一组,表示一个顶点的纹理坐标
顶点UV坐标geometry.attributes.uv和顶点位置坐标geometry.attributes.position是一一对应的，同一个顶点下标 i，共用同一套属性，错了就会拉伸、翻转、接缝错位。如果用了index，uv和顶点位置坐标geometry.attributes.position要注意对齐
UV顶点坐标你可以根据需要在0~1之间任意设置，具体怎么设置，要看你想把图片的哪部分映射到Mesh的几何体表面上，uv 定「这个点从贴图哪取色」
任意形状的几何体设置纹理贴图会根据几何体自身的UV坐标对颜色纹理贴图.map进行提取，提取形状与几何体一致。

#### 贴图步骤
// itemSize = 3 因为每个顶点有3个值（组件）
geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
/**纹理坐标0~1之间随意定义*/
const uvs = new Float32Array([
    0, 0, //图片左下角
    1, 0, //图片右下角
    1, 1, //图片右上角
    0, 1, //图片左上角
]);
// 设置几何体attributes属性的位置uv属性
geometry.attributes.uv = new THREE.BufferAttribute(uvs, 2); //2个为一组,表示一个顶点的纹理坐标
//CircleGeometry的顶点UV坐标是按照圆形采样纹理贴图
const geometry = new THREE.CircleGeometry(60, 100);
//纹理贴图加载器TextureLoader
const texLoader = new THREE.TextureLoader();
const texture = texLoader.load('./texture.jpg');
const material = new THREE.MeshBasicMaterial({
    map: texture,//map表示材质的颜色贴图属性
    side:THREE.DoubleSide,
});
const mesh = new THREE.Mesh(geometry, material);
#### UV 动画
RepeatWrapping 允许了你使用 offset.x 或超出 1 的 UV 坐标，而不会导致画面出现丑陋的拉伸黑边或边缘拉伸，从而让纹理动画（滚动）能够完美循环
    // 设置.wrapS也就是U方向，纹理映射模式(包裹模式)
    texture.wrapS = THREE.RepeatWrapping;//对应offste.x偏移
    texture.offset.x +=0.001;//设置纹理动画：偏移量根据纹理和动画需要
### 法线
法线的定义：它是垂直于几何体表面的单位向量（长度为 1）。

作用：它告诉 GPU 当光线照过来时，这个面应该怎么反光。如果法线朝向光源，面就亮；法线背对光源，面就暗。没有正确法线，PBR/灯光会平、黑、或鼓包方向反了；法线贴图还依赖切线

关键点：法线数组必须和你之前定义的顶点位置（Position）数组严格一一对应，并且长度必须为 1。
自动计算：
geometry.computeVertexNormals();

### 切线
把法线贴图从切线空间转到世界/物体空间
computeTangents计算方法，计算并对该几何体添加切属性，仅支持索引几何体，并且在定义了位置、法线和 UV 属性的情况下

### 纹理加载
通过纹理贴图加载器TextureLoader的load()方法加载一张图片可以返回一个纹理对象Texture，纹理对象Texture可以作为模型材质颜色贴图.map属性的值。
材质的颜色贴图属性.map设置后，模型会从纹理贴图上采集像素值，这时候一般来说不需要再设置材质颜色.color。.map贴图之所以称之为颜色贴图就是因为网格模型会获得颜色贴图的颜色值RGB。

const geometry = new THREE.PlaneGeometry(200, 100); 
//纹理贴图加载器TextureLoader
const texLoader = new THREE.TextureLoader();
// .load()方法加载图像，返回一个纹理对象Texture
const texture = texLoader.load('./earth.jpg');
const material = new THREE.MeshLambertMaterial({
    // 设置纹理贴图：Texture对象作为材质map属性的属性值
    map: texture,//map表示材质的颜色贴图属性
});
立方体纹理加载器CubeTextureLoader的.load()方法是加载6张图片，返回一个立方体纹理对象CubeTexture

### 颜色空间
最新版本，webgl渲染器默认编码方式已经改变，为了避免色差，纹理对象编码方式要修改为THREE.SRGBColorSpace

texture.colorSpace  = THREE.SRGBColorSpace;//设置为SRGB颜色空间

### PBR
基于物理的渲染，更逼真的、更接近生活中的材质效果，当然也会占用更多的电脑硬件资源。
两个PBR材质相关的API MeshStandardMaterial和MeshPhysicalMaterial

metalness、roughness、map、normalMap、aoMap、metalnessMap、roughnessMap、

网格模型可以通过材质的.envMap属性设置环境贴图（材质算反射/环境光时用的那张图）不是背景，如果一个gltf模型中所有的Mesh都要设置环境贴图就需要递归遍历gltf模型，给里面每个Mesh的材质设置.envMap。/ 给整个场景所有物体添加环境贴图scene.environment
## 踩坑

### UV贴图加index注意对齐
如果用了index，uv和顶点位置坐标geometry.attributes.position要注意一一对齐不变，位置、数量一致
例如：在 3D 图形学中，想要让立方体的不同面拥有正确且不畸变的纹理，必须“把同一个位置的顶点复制多份”，并且使用 24 个顶点。UV要24个，所以顶点位置也要24个。如果你想让同一个空间位置的点，在不同的面上有不同的 UV，你就必须在数组里把这个点写多次。 因为顶点不仅仅是“位置”，它是“所有属性的集合”， GPU 无法让一个唯一的索引对应多个 UV

### 环境贴图区分
map = 按 UV 贴在面上的颜色；
envMap = 材质用来「映环境」的贴图，不是背景本身；
背景用 scene.background，全场景 PBR 环境用 scene.environment。名字都叫「环境」，职责不一样。
## 面试题
### BufferGeometry 为什么比旧 Geometry 快？
因为数据在 TypedArray，适合整块上传 GPU，无旧 Geometry 那种对象数组开销


PBR 材质参数？
