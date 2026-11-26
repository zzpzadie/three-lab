/** three-lab-assets GitHub Pages 直链（不走镜像） */
export const FILE_HOST = 'https://zzpzadie.github.io/three-lab-assets/'

/** 本仓库 public/ 下的模型（开发/部署最稳，不依赖外网 CDN） */
export const LOCAL_MODEL = (name: string) =>
  `${import.meta.env.BASE_URL}models/${name}`
