# 目标/实现/踩坑/题
## 目标
学什么：AnimationMixer、GSAP/Tween、状态管理、事件、碰撞检测、简单物理。
实战：小游戏或交互展厅：点击移动、碰撞、开关门、动画过渡。
验收：

能写状态机管理交互。

能做动画过渡和事件解绑。GSAP/Tween

能接入 Rapier/Cannon 做简单物理。碰撞检测

## 实现

## 踩坑
### BoxGeometry 记住这一点
new THREE.BoxGeometry(宽X, 高Y, 厚Z)，默认中心在本地原点。所以要把底边贴地，本地 y 通常要设成 高度/2。
### group 父子位置
child.position
相对父级 Group 原点
group.position
整个小组在上一级（常是 scene）里的位置，不用考虑子物体宽高位置
两者都设：叠加

### 模型动画与时间线动画结合使用无法同时合理过渡
- 骨骼没在每帧更新：animate 里没有 mixer.update，动作不会往前播
- 过渡被每帧重复触发：onUpdate 一秒会进几十次，等于不断 crossFadeTo，动画会被反复打断、重置。应该使用onStart、onComplete
- 镜头不是第三人称跟随：第三人称：相机位置在人物身后偏上，动画中每帧更新，并 lookAt 人
- 动画timeline衔接：doorTl.add(lightChangeAnimation(), '<')  "<"之前动画的开端**
在时间线末尾（或使用参数的其他地方）添加回调，去除效果 lit.call(() => { scene.fog = null })


控制权：谁在改 camera / controls.target / 角色，谁就在占用控制权。同一时刻只能有一个主人。

## 题：
### 如何做动画混合？
通过AnimationMixer播放器，创建动画clipAction对象，将各个关键帧动画对象混合进行播放
### 交互事件如何解绑？

第 3 幕：秘境气氛
要会：

realmRoot = new Group()，蘑菇/昆虫都挂上去，只转 root
昆虫：正弦/gsap 循环位移（不做 AI）
可选：进幕时换 background / fog color
在哪学：

Group/父子：你仓库 01-basics
循环漂浮：同上 gsapCollection（repeat:-1, yoyo:true，你 scene 里已在用）
几何摆场景：你仓库 03-geometry-material


玩法环：点蘑菇跳
要会：

Play 态下 Raycaster 点蘑菇
跳跃：先学 GSAP 抛物线（同时 tween x/z + y 的 ease），落地再考虑物理
跳中禁用点击（状态 Jumping）
可选物理：落地冲量 / 软弹
在哪学：

点击：还是 02-camera
弧线移动：GSAP 多属性 to；或自己用 sin 插值 y
物理观摩：physicsMesh
正式接入： cannon-es 或 @react-three/rapier 文档里的概念（你这是原生 three，优先 cannon-es / @dimforge/rapier3d-compat 示例）
