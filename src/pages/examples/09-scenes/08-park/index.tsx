import '../lab-shared/observatory.css'
import './styles.css'
import './scene'
import { ObservatoryScreen } from '../lab-shared/ObservatoryScreen'
import { parkConfig } from './config'

export default function ParkScreen() {
  return <ObservatoryScreen config={parkConfig} screenClass="ob-screen-park" />
}