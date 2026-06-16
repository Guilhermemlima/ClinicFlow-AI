import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  const resend = getResend()

  if (!resend) {
    // Sem RESEND_API_KEY configurada (dev local) — loga o link em vez de
    // falhar, para o fluxo continuar testável sem credenciais reais.
    console.log(`[email MOCK] Reset de senha para ${to}: ${resetUrl}`)
    return true
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@zencli.com.br',
      to,
      subject: 'Redefinir sua senha — ZenCli',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Redefinir senha</h2>
          <p style="color: #475569;">Recebemos um pedido para redefinir a senha da sua conta no ZenCli.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Redefinir senha
            </a>
          </p>
          <p style="color: #94a3b8; font-size: 13px;">
            Esse link expira em 1 hora. Se você não pediu essa redefinição, pode ignorar este email.
          </p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('Failed to send password reset email:', err)
    return false
  }
}
