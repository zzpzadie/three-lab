import '../lab-shared/observatory.css'
import './styles.css'
import './scene'
import { ObservatoryScreen } from '../lab-shared/ObservatoryScreen'
import { industryConfig } from './config'

export default function IndustryScreen() {
  return <ObservatoryScreen config={industryConfig} screenClass="ob-screen-industry" />
}
