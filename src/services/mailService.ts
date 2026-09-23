import axios from 'axios'

export interface SendMailPayload {
  to: string
  subject: string
  html: string
}

export const mailService = {
  /**
   * Envía un correo electrónico a través de la API interna SMTP de REPOJ
   */
  async sendEmail(payload: SendMailPayload): Promise<{ success: boolean; messageId: string }> {
    const response = await axios.post('/api/mail/send', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },

  /**
   * Envía el correo con el enlace y botón para restablecer la contraseña (expiración: 1 hora)
   */
  async sendPasswordResetEmail(
    email: string,
    fullname: string,
    resetLink: string
  ): Promise<void> {
    const subject = 'Solicitud de Restablecimiento de Contraseña — REPOJ'

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecimiento de Contraseña</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 0;
            color: #333333;
          }
          .email-container {
            max-width: 600px;
            margin: 24px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            border-top: 5px solid #39A900;
          }
          .email-header {
            background-color: #ffffff;
            padding: 24px 32px 16px 32px;
            text-align: center;
            border-bottom: 1px solid #edf2f7;
          }
          .email-header h1 {
            color: #39A900;
            margin: 8px 0 0 0;
            font-size: 22px;
            font-weight: 800;
          }
          .email-body {
            padding: 32px;
            line-height: 1.6;
          }
          .email-body p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #4a5568;
          }
          .greeting {
            font-size: 17px;
            font-weight: 700;
            color: #2d3748;
          }
          .btn-container {
            text-align: center;
            margin: 28px 0;
          }
          .btn-reset {
            display: inline-block;
            background-color: #39A900;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            padding: 13px 32px;
            border-radius: 6px;
            box-shadow: 0 3px 6px rgba(57, 169, 0, 0.25);
          }
          .alert-box {
            background-color: #fff9db;
            border-left: 4px solid #f59f00;
            padding: 12px 16px;
            border-radius: 4px;
            font-size: 13.5px;
            color: #664d03;
            margin: 20px 0;
          }
          .link-fallback {
            font-size: 12.5px;
            color: #718096;
            word-break: break-all;
            background-color: #f7fafc;
            padding: 10px 14px;
            border-radius: 4px;
            border: 1px dashed #cbd5e0;
          }
          .email-footer {
            background-color: #f8fafc;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>REPOJ — SENA</h1>
            <div style="font-size: 12px; color: #718096; margin-top: 2px;">Sistema de Análisis y Seguimiento de Juicios Evaluativos</div>
          </div>
          <div class="email-body">
            <p class="greeting">Hola, ${fullname}:</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de su cuenta asociada al correo <strong>${email}</strong> en el sistema REPOJ.</p>
            <p>Para crear una nueva contraseña, por favor haga clic en el siguiente botón:</p>
            
            <div class="btn-container">
              <a href="${resetLink}" class="btn-reset" target="_blank" rel="noopener noreferrer">
                Restablecer Mi Contraseña
              </a>
            </div>

            <div class="alert-box">
              ⏱ <strong>Validez del enlace:</strong> Este enlace es de <strong>un solo uso</strong> y expirará automáticamente después de <strong>1 hora</strong> desde su generación.
            </div>

            <p style="font-size: 13px; color: #718096; margin-bottom: 6px;">
              Si el botón no funciona, copie y pegue el siguiente enlace en su navegador:
            </p>
            <div class="link-fallback">
              <a href="${resetLink}" style="color: #39A900; text-decoration: underline;">${resetLink}</a>
            </div>

            <p style="margin-top: 24px; font-size: 13px; color: #a0aec0;">
              Si usted no solicitó este cambio de contraseña, puede ignorar este mensaje de manera segura. Su contraseña actual no será modificada.
            </p>
          </div>
          <div class="email-footer">
            Servicio Nacional de Aprendizaje SENA — CLEM | REPOJ<br>
            Este es un correo automático, por favor no responda a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `

    await mailService.sendEmail({
      to: email,
      subject,
      html
    })
  },

  /**
   * Envía el correo de confirmación informando que la contraseña ha sido cambiada exitosamente
   */
  async sendPasswordChangedConfirmation(
    email: string,
    fullname: string
  ): Promise<void> {
    const subject = 'Su contraseña ha sido modificada — REPOJ'

    const nowFormatted = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date())

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contraseña Modificada</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 0;
            color: #333333;
          }
          .email-container {
            max-width: 600px;
            margin: 24px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            border-top: 5px solid #39A900;
          }
          .email-header {
            background-color: #ffffff;
            padding: 24px 32px 16px 32px;
            text-align: center;
            border-bottom: 1px solid #edf2f7;
          }
          .email-header h1 {
            color: #39A900;
            margin: 8px 0 0 0;
            font-size: 22px;
            font-weight: 800;
          }
          .email-body {
            padding: 32px;
            line-height: 1.6;
          }
          .email-body p {
            margin: 0 0 16px 0;
            font-size: 15px;
            color: #4a5568;
          }
          .greeting {
            font-size: 17px;
            font-weight: 700;
            color: #2d3748;
          }
          .success-box {
            background-color: #e6f9e6;
            border-left: 4px solid #39A900;
            padding: 14px 18px;
            border-radius: 4px;
            color: #1b5e20;
            margin: 20px 0;
            font-size: 14px;
          }
          .email-footer {
            background-color: #f8fafc;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #a0aec0;
            border-top: 1px solid #edf2f7;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>REPOJ — SENA</h1>
            <div style="font-size: 12px; color: #718096; margin-top: 2px;">Sistema de Análisis y Seguimiento de Juicios Evaluativos</div>
          </div>
          <div class="email-body">
            <p class="greeting">Hola, ${fullname}:</p>
            <div class="success-box">
              ✔ <strong>Notificación de Seguridad:</strong> La contraseña de su cuenta (<strong>${email}</strong>) ha sido cambiada exitosamente el <strong>${nowFormatted}</strong>.
            </div>
            <p>Ya puede ingresar a la plataforma REPOJ utilizando su nueva contraseña.</p>
            <p style="font-size: 13.5px; color: #c0392b; margin-top: 24px;">
              ⚠ <strong>¿No realizó esta acción?</strong> Si usted no realizó este cambio, por favor comuníquese de inmediato con el Administrador del sistema o el Coordinador de su Centro de Formación.
            </p>
          </div>
          <div class="email-footer">
            Servicio Nacional de Aprendizaje SENA — CLEM | REPOJ<br>
            Este es un correo automático, por favor no responda a este mensaje.
          </div>
        </div>
      </body>
      </html>
    `

    await mailService.sendEmail({
      to: email,
      subject,
      html
    })
  }
}

export default mailService
