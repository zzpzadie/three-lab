import { useEffect, useRef } from 'react'
import { injectMarkup } from '../lab-shared/injectMarkup'
import markup from './markup.html?raw'
import { mountWind } from './mount'
import './styles.css'
import './wind-host.css'

export default function WindScreen() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    injectMarkup(host, markup)
    const dispose = mountWind(host)
    return () => {
      dispose()
      host.replaceChildren()
    }
  }, [])

  return <div ref={hostRef} className="example-page wind-host" />
}
