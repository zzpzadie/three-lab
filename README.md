# Three Lab

React + TypeScript + Zustand 空项目（Vite）。
项目架构参考：
源码：https://github.com/jiawanlong/Cesium-Examples/tree/main
体验：https://jiawanlong.github.io/Cesium-Examples/examples/threeEx/examples.html#plot
用于three-cesium-examples存储文件的服务器：https://z2586300277.github.io/3d-file-server/
## 启动

```powershell
cd e:\project\more\three-lab
npm i
npm run dev
```

浏览器打开 `http://localhost:2084`。



## 提交到远程

当前分支是 `master`，远程是 `origin`（https://github.com/zzpzadie/three-lab.git）。首次推送并设置上游：

```powershell
git add .
git commit -m "说明"
git push -u origin master
```

上游设置好之后：

```powershell
git add .
git commit -m "说明"
git push
```
## 打包

```powershell
npm run build
```

产物在 `dist`。本地预览打包结果：

```powershell
npm run preview
```

## 部署到 GitHub Pages

`npm run deploy` 会先执行打包，再把 `dist` 推到 `gh-pages` 分支。

```powershell
npm run deploy
```

页面地址：https://zzpzadie.github.io/three-lab

## 资源仓库部署（three-lab-assets）

大模型 / HDR / 天空盒等放在独立仓库 [`three-lab-assets`](https://github.com/zzpzadie/three-lab-assets)，通过 GitHub Pages 提供完整 URL，供本项目示例引用（参考 [3d-file-server](https://z2586300277.github.io/3d-file-server/)）。

本地路径：`E:\project\more\three-lab-assets`

上传并部署到 GitHub Pages：

```powershell
cd E:\project\more\three-lab-assets
git add .
git commit -m "说明"
git push
```

仓库 **Settings → Pages**：Source 选 Deploy from a branch，Branch 选 `master` / `/ (root)`。

资源基址（GitHub Pages 直链，写法同 `xxx.github.io/仓库名/`）：

`https://zzpzadie.github.io/three-lab-assets/`

在本项目示例中引用：

```ts
import { FILE_HOST, LOCAL_MODEL } from '@/config/assets'

// 角色等常用模型：优先本仓库 public/models（最稳）
loader.load(LOCAL_MODEL('Soldier.glb'), ...)

// 远程资源库（天空盒 / 视频 / HDR 等）
loader.load(FILE_HOST + 'models/quit.glb', ...)
hdriLoader.load(FILE_HOST + 'hdr/grasslands_sunset_4k.hdr', ...)
const urls = [1, 2, 3, 4, 5, 6].map(
  (n) => FILE_HOST + `files/sky/skyBox0/${n}.png`,
)
```

从本项目 `public/models` 上传模型到资源仓库：

```powershell
Copy-Item e:\project\more\three-lab\public\models\*.glb E:\project\more\three-lab-assets\models\ -Force
cd E:\project\more\three-lab-assets
git add models
git commit -m "add models"
git push
```

## 结构

- `src/main.tsx` — 入口
- `src/App.tsx` — 页面
- `src/store.ts` — Zustand store

## 技术
框架:react+zustand+TS
三维
npm i react-router-dom three zustand
npm i three
npm i -D @types/three

组件库
npm i antd

## 待接入
### 疫情可视化地球
体验：https://xiblogs.top/covid19-visualization/#/
源码：https://gitee.com/xi1213/covid19-visualization
### 各种大屏场景
https://mp.weixin.qq.com/s/08qVBQW9iTPDDTD326UEUA