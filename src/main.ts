import App from './App.svelte'
import { initApp } from './app-mode/app-init'
import { bootstrapApp } from '@src/app-bootstrap'

const app = bootstrapApp(App, 'app', initApp)

export default app
