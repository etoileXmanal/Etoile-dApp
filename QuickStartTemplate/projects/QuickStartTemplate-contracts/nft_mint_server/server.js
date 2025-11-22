// server.js — Local backend entry point

import app from './app.js'

// أضف Route بسيط للـ health check إذا كان app Express
if (typeof app?.get === 'function') {
  app.get('/health', (req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
    })
  })
}

const port = process.env.PORT || 3001

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Backend listening at http://localhost:${port}`)
})
