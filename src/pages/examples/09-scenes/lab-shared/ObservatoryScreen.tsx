import { useEffect, useRef } from 'react'
import {
  mountObservatory,
  observatoryHeaderArt,
  type ObservatoryConfig,
} from './observatoryDashboard'
import './observatoryStage.css'

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

export function ObservatoryScreen({
  config,
  screenClass,
}: {
  config: ObservatoryConfig
  screenClass: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const headerArt = observatoryHeaderArt(config.id)

  useEffect(() => {
    const host = hostRef.current
    const stage = stageRef.current
    if (!host || !stage) return

    const fit = () => {
      const scale = Math.min(host.clientWidth / DESIGN_WIDTH, host.clientHeight / DESIGN_HEIGHT)
      stage.style.transform = `translate(-50%, -50%) scale(${scale > 0 ? scale : 1})`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(host)
    const dispose = mountObservatory(config)
    return () => {
      dispose()
      observer.disconnect()
    }
  }, [config])

  return (
    <div ref={hostRef} className={`ob-design-host ${screenClass}`}>
      <div ref={stageRef} className="ob-design-stage">
        <div
          id="observatory"
          className="ob-app"
          data-case={config.id}
          data-header-art={headerArt}
        />
      </div>
    </div>
  )
}
