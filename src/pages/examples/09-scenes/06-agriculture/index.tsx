import '../lab-shared/observatory.css'
import './styles.css'
import './scene'
import { ObservatoryScreen } from '../lab-shared/ObservatoryScreen'
import { agricultureConfig } from './config'

export default function AgricultureScreen() {
  return <ObservatoryScreen config={agricultureConfig} screenClass="ob-screen-agriculture" />
}
