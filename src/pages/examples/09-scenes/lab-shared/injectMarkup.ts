import { assetUrl } from './stage'

/** Inject dashboard markup and rewrite absolute asset paths for Vite BASE_URL. */
export function injectMarkup(host: HTMLElement, markup: string) {
  const html = markup
    .replaceAll('"/screen-assets/', `"${assetUrl('screen-assets/')}`)
    .replaceAll("'/screen-assets/", `'${assetUrl('screen-assets/')}`)
    .replaceAll('=/screen-assets/', `=${assetUrl('screen-assets/')}`)
  host.innerHTML = html
  return host
}
