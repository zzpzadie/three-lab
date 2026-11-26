// 目录数据：唯一菜单数据源

// // 目录项类型
// export type CatalogItem = {
//   id: string
//   group: string          // 侧栏分类
//   title: string
//   desc: string
//   path: string           // 路由，不是端口
//   thumb?: string         // /thumbs/01-basics.jpg，可先空
// }

// // 分类组
// export const groups = [
//   '01 基础',
//   '02 相机',
//   '03 几何材质',
//   '04 光照阴影',
//   '05 模型动画',
//   '06 交互',
//   '07 性能',
//   '08 Shader',
//   'Final',
// ]

// // 目录项
// export const catalog: CatalogItem[] = [
//   {
//     id: '01-basics',
//     group: '01 基础',
//     title: '旋转立方体',
//     desc: 'Scene / Camera / Renderer',
//     path: '/examples/01-basics',
//     thumb: '/thumbs/01-basics.jpg',
//   },
//   {
//     id: '02-camera',
//     group: '02 相机',
//     title: 'OrbitControls',
//     desc: '透视相机 + 阻尼 + 预设机位',
//     path: '/examples/02-camera',
//   },
//   {
//     id: '03-geometry-material',
//     group: '03 几何材质',
//     title: '几何材质',
//     desc: '几何材质',
//     path: '/examples/03-geometry-material',
//   },
//   {
//     id: '04-light-shadow',
//     group: '04 光照阴影',
//     title: '光照阴影',
//     desc: '光照阴影',
//     path: '/examples/04-light-shadow',
//   },
//   // 其余阶段同样加一条；一阶段暂时一卡即可
// ]

// src/data/catalog.ts
export type ExampleItem = {
  id: string
  title: string
  desc: string
  path: string          // 全屏示例路由，如 /examples/three/01-basics
  thumb?: string
}

export type SubGroup = {
  id: string            // 如 '1.1'
  title: string         // 如 '1.1、入门'
  examples: ExampleItem[]
}

export type SideGroup = {
  id: string            // 如 '1'
  title: string         // 如 '1、入门'
  children: SubGroup[]
}

export type MajorCategory = {
  id: string            // 'three' | 'cesium' | ...
  title: string         // 'Three Examples'
  path: string          // '/three'
  groups: SideGroup[]
}

export const majors: MajorCategory[] = [
  {
    id: 'three',
    title: 'Three Examples',
    path: '/three',
    groups: [
      {
        id: '1',
        title: '1、入门',
        children: [
          {
            id: '1.1',
            title: '1.1、入门',
            examples: [
              {
                id: '01-basics',
                title: '1.1.1、旋转父子立方体场景图',
                desc: 'Scene / Camera / Renderer',
                path: '/examples/three/01-basics',
                thumb: `${import.meta.env.BASE_URL}thumbs/01-basics.jpg`,
              },
              // ...
            ],
          },
          // {
          //   id: '1.2',
          //   title: '1.2、速度相关',
          //   examples: [/* ... */],
          // },
        ],
      },
      // 2、模型 
      // {
      //   id: '2',
      //   title: '2、模型',
      //   children: [
      //     {
      //       id: '2.1',
      //       title: '2.1、模型',
      //       examples: [
      //         {
      //           id: '02-model',
      //           title: '2.1.1、模型',
      //           desc: 'Model',
      //           path: '/examples/three/02-model',
      //           thumb: '/thumbs/02-model.jpg',
      //         },
      //       ],
      //     },
      //   ],  
      // },
      // 3、相机 
      {
        id: '2',
        title: '2、相机',
        children: [
          {
            id: '2.1',
            title: '2.1、相机',
            examples: [
              {
                id: '02-camera',
                title: '2.1.1、相机、射线拾取',
                desc: 'Camera',
                path: '/examples/three/02-camera',
                thumb: `${import.meta.env.BASE_URL}thumbs/02-camera-ray.jpg`,
              },
            ],
          },
        ],
      },
      // 3、几何材质
      {
        id: '3',
        title: '3、几何材质',
        children: [
          {
            id: '3.1',
            title: '3.1、几何材质',
            examples: [
              {
                id: '03-geometry-material',
                title: '3.1.1、几何材质',
                desc: 'Geometry Material',
                path: '/examples/three/03-geometry-material',
                thumb: `${import.meta.env.BASE_URL}thumbs/03-geometry-material.jpg`,
              },
            ],
          },
        ],
      },
      // 4、光照阴影
      {
        id: '4',
        title: '4、光照阴影',
        children: [
          {
            id: '4.1',
            title: '4.1、光照阴影',
            examples: [
              {
                id: '04-light-shadow',
                title: '4.1.1、光照阴影',
                desc: 'Light Shadow',
                path: '/examples/three/04-light-shadow',
                thumb: `${import.meta.env.BASE_URL}thumbs/04-light-shadow.jpg`,
              },
              {
                id: '04-light-shadow-hdr',
                title: '4.1.2、HDRI贴图',
                desc: 'HDRI环境反射',
                path: '/examples/three/04-light-shadow-hdr',
                thumb: `${import.meta.env.BASE_URL}thumbs/04-light-shadow-hdr.jpg`,
              },
            ],
          },
        ],
      },
      {
        id: '5',
        title: '5、模型',
        children: [
          {
            id: '5.1',
            title: '5.1、模型动画',
            examples: [
              {
                id: '05-model-animation',
                title: '5.1.1、模型动画',
                desc: 'Model Animation',
                path: '/examples/three/05-model-animation',
                thumb: `${import.meta.env.BASE_URL}thumbs/05-model-animation.jpg`,
              },
              {
                id: '05-model-video',
                title: '5.1.2、模型视频',
                desc: '模型添加动画视频、模型修改导出',
                path: '/examples/three/05-model-video',
                thumb: `${import.meta.env.BASE_URL}thumbs/05-model-video.jpg`,
              },
            ],
          },
        ],
      },
      {
        id: '6',
        title: '6、交互',
        children: [
          {
            id: '6.1',
            title: '6.1、交互动画',
            examples: [
              {
                id: '06-interaction',
                title: '6.1.1、交互动画',
                desc: '碰撞检测、鼠标拾取、动画控制',
                path: '/examples/three/06-interaction',
                thumb: `${import.meta.env.BASE_URL}thumbs/06-interaction.jpg`,
              },
            ],
          },
        ],
      },
      // 7、性能
      // 8、Shader
      {
        id: '9',
        title: '9、应用场景',
        children: [
          {
            id: '9.1',
            title: '9.1、仙侠场景',
            examples: [
              {
                id: '09-baiyu-jing',
                title: '9.1.1、白玉京',
                desc: '天上白玉京，十二楼五城 · 云海仙阙',
                path: '/examples/three/09-baiyu-jing',
                thumb: `${import.meta.env.BASE_URL}thumbs/09-cloud-palace.jpg`,
              },
            ],
          },
          {
            id: '9.2',
            title: '9.2、风电',
            examples: [
              {
                id: '09-wind',
                title: '9.2.1、智慧风电监管平台',
                desc: '透视机舱，探索从风能到电能的精密传动',
                path: '/examples/three/09-wind',
                thumb: `${import.meta.env.BASE_URL}thumbs/wind.webp`,
              },
            ],
          },
          {
            id: '9.3',
            title: '9.3、工厂',
            examples: [
              {
                id: '09-factory',
                title: '9.3.1、智慧工厂可视化大屏',
                desc: '漫游精细厂区，掌握生产、仓储与设备运行',
                path: '/examples/three/09-factory',
                thumb: `${import.meta.env.BASE_URL}thumbs/factory.webp`,
              },
            ],
          },
          {
            id: '9.4',
            title: '9.4、人口',
            examples: [
              {
                id: '09-population',
                title: '9.4.1、全国人口统计总览',
                desc: '环绕三维地球，感知人口分布与城市之间的流动',
                path: '/examples/three/09-population',
                thumb: `${import.meta.env.BASE_URL}thumbs/population.webp`,
              },
            ],
          },
          {
            id: '9.5',
            title: '9.5、巡检',
            examples: [
              {
                id: '09-inspection',
                title: '9.5.1、AI 智能巡检运营调度',
                desc: '连接地图、车辆与事件，让每一次调度清晰可见',
                path: '/examples/three/09-inspection',
                thumb: `${import.meta.env.BASE_URL}thumbs/inspection.webp`,
              },
            ],
          },
          {
            id: '9.6',
            title: '9.6、农业',
            examples: [
              {
                id: '09-agriculture',
                title: '9.6.1、禾境 · 智慧农业生态管理中心',
                desc: '生长有迹，在数字农场中探索作物、气候与精准灌溉',
                path: '/examples/three/09-agriculture',
                thumb: `${import.meta.env.BASE_URL}thumbs/agriculture.webp`,
              },
            ],
          },
          {
            id: '9.7',
            title: '9.7、工业',
            examples: [
              {
                id: '09-industry',
                title: '9.7.1、NEXUS · 智慧工业数字运营中心',
                desc: '深入自动化车间，联动生产、质量、设备与能源',
                path: '/examples/three/09-industry',
                thumb: `${import.meta.env.BASE_URL}thumbs/industry.webp`,
              },
            ],
          },
          {
            id: '9.8',
            title: '9.8、园区',
            examples: [
              {
                id: '09-park',
                title: '9.8.1、星屿 · 智慧园区运营中心',
                desc: '连接智慧楼宇、绿色能源与园区生活的每一个瞬间',
                path: '/examples/three/09-park',
                thumb: `${import.meta.env.BASE_URL}thumbs/park.webp`,
              },
            ],
          },
          {
            id: '9.9',
            title: '9.9、雨夜',
            examples: [
              {
                id: '09-rainy-night',
                title: '9.9.1、雨夜小城',
                desc: '巷子在下雨 · 雨丝撞瓦、湿路倒影与水面涟漪',
                path: '/examples/three/09-rainy-night',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'cesium',
    title: 'Cesium Examples',
    path: '/cesium',
    groups: [], // 先空，后续扩展
  },
]


export const getMajor = (id: string) => majors.find((m) => m.id === id)
export const getSubGroup = (majorId: string, subId: string) =>
  getMajor(majorId)?.groups
    .flatMap((g) => g.children)
    .find((s) => s.id === subId)
export function findSubIdByExample(majorId: string, exampleId: string) {
  const major = getMajor(majorId)
  if (!major) return undefined
  for (const g of major.groups) {
    for (const s of g.children) {
      if (s.examples.some((e) => e.id === exampleId)) return s.id
    }
  }
}