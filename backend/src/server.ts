import { createApp } from './app'
import { config } from './config'

createApp().listen(config.port, () => {
  console.log(`API sur http://localhost:${config.port} (docs: /docs)`)
})
