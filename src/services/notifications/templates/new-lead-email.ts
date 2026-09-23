export interface NewLeadEmailTemplateData {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  leadMessage?: string;
  source?: string;
  propertyName?: string;
  receivedAt?: string;
  crmUrl: string;
  publicPropertyUrl?: string;
}

export function generateNewLeadEmailHtml(data: NewLeadLeadEmailTemplateData): { subject: string; html: string } {
  const propertyTitle = data.propertyName || 'um imóvel do seu portfólio';
  const subject = `Novo lead recebido: ${data.leadName} (${propertyTitle})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Lead - OraOra</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 40px; text-align: left;">
              <span style="font-size: 20px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">OraOra</span>
              <div style="font-size: 14px; color: #amber-400; color: #fbbf24; margin-top: 6px; font-weight: 500;">Nova Oportunidade de Negócio</div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Você recebeu um novo lead</h1>
              <p style="font-size: 16px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;">
                Um cliente demonstrou interesse em <strong>${propertyTitle}</strong>.
              </p>

              <!-- Client Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">Dados do Cliente</div>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b; width: 100px;">Nome:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${data.leadName}</td>
                      </tr>
                      ${data.leadPhone ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b;">Telefone:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${data.leadPhone}</td>
                      </tr>
                      ` : ''}
                      ${data.leadEmail ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b;">E-mail:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${data.leadEmail}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Interest Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px;">Detalhes do Interesse</div>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b; width: 100px;">Imóvel:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${propertyTitle}</td>
                      </tr>
                      ${data.source ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b;">Origem:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; font-weight: 600; color: #0f172a;">${data.source}</td>
                      </tr>
                      ` : ''}
                      ${data.leadMessage ? `
                      <tr>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #64748b; vertical-align: top;">Mensagem:</td>
                        <td style="padding-bottom: 8px; font-size: 14px; color: #0f172a; line-height: 1.4;">${data.leadMessage}</td>
                      </tr>
                      ` : ''}
                      ${data.receivedAt ? `
                      <tr>
                        <td style="font-size: 14px; color: #64748b;">Recebido em:</td>
                        <td style="font-size: 14px; color: #0f172a;">${data.receivedAt}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTAs -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="${data.crmUrl}" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; font-weight: bold; text-align: center;">
                      Ver Lead no OraOra
                    </a>
                  </td>
                </tr>
                ${data.publicPropertyUrl ? `
                <tr>
                  <td align="center">
                    <a href="${data.publicPropertyUrl}" target="_blank" style="display: block; background-color: #f1f5f9; color: #0f172a; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; border: 1px solid #cbd5e1;">
                      Ver Imóvel / Empreendimento
                    </a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.4;">
                OraOra • Notificação automática sobre uma nova oportunidade recebida na sua operação.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </body>
</html>
  `;

  return { subject, html };
}
