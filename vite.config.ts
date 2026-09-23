import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import nodemailer from 'nodemailer'

function emailApiPlugin(env: Record<string, string>) {
  const handler = (req: any, res: any, next: any) => {
    const url = req.url ? req.url.split('?')[0] : ''
    if (url === '/api/mail/send' && req.method === 'POST') {
      let body = ''
      req.on('data', (chunk: any) => {
        body += chunk
      })
      req.on('end', async () => {
        try {
          const { to, subject, html } = JSON.parse(body || '{}')
          if (!to || !subject || !html) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Faltan campos requeridos: to, subject, html' }))
            return
          }

          const transporter = nodemailer.createTransport({
            host: env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(env.SMTP_PORT) || 587,
            secure: env.SMTP_SECURE === 'true' || env.SMTP_PORT === '465',
            auth: {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS
            }
          })

          const info = await transporter.sendMail({
            from: env.SMTP_FROM || env.SMTP_USER,
            to,
            subject,
            html
          })

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, messageId: info.messageId }))
        } catch (error: any) {
          console.error('[SMTP Error]', error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message || 'Error al enviar el correo' }))
        }
      })
      return
    }
    next()
  }

  return {
    name: 'email-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler)
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), emailApiPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      open: false
    }
  }
})

