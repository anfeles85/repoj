import nodemailer from 'nodemailer'

interface SendMailBody {
  to?: string
  subject?: string
  html?: string
}

export const handler = async (event: any) => {
  // Manejo de CORS si fuera necesario
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido. Solo se acepta POST.' })
    }
  }

  try {
    const { to, subject, html }: SendMailBody = JSON.parse(event.body || '{}')

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan campos requeridos: to, subject, html' })
      }
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com'
    const port = Number(process.env.SMTP_PORT) || 587
    const secure = process.env.SMTP_SECURE === 'true' || port === 465
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    if (!user || !pass) {
      console.error('[Netlify Function SMTP Error] Variables SMTP_USER o SMTP_PASS no definidas en el panel de Netlify')
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Credenciales SMTP (SMTP_USER o SMTP_PASS) no configuradas en las variables de entorno de Netlify.'
        })
      }
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    })

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, messageId: info.messageId })
    }
  } catch (error: any) {
    console.error('[Netlify Function SMTP Error]', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Error al enviar el correo electrónico vía SMTP'
      })
    }
  }
}
