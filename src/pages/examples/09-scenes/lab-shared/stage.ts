/** Scale a fixed design-size stage to fit the viewport (from VizLabRuntime.mountStage). */
export function mountStage(
  element: HTMLElement,
  width: number,
  height: number,
  onResize?: (scale: number) => void,
) {
  const fit = () => {
    const scale = Math.min(window.innerWidth / width, window.innerHeight / height)
    element.style.transform = `translate(-50%, -50%) scale(${scale})`
    onResize?.(scale)
  }
  window.addEventListener('resize', fit, { passive: true })
  fit()
  return () => window.removeEventListener('resize', fit)
}

export function assetUrl(rel: string) {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${rel.replace(/^\//, '')}`
}
