import './style.css'
import { GameView } from './ui/game-view.ts'

const app = document.getElementById('app')!
new GameView(app)
