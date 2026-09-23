import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EmailService] RESEND_API_KEY não configurada.');
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  status: 'sent' | 'skipped' | 'failed';
  providerId?: string;
  reason?: string;
}

/**
    Serviço server-side responsável exclusivamente pela comunicação com o Resend.
    Camada de transporte pura sem conhecimento de Firestore ou Domínio de Negócio.
 */
export async function sendTransactionalEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const client = getResendClient();
    if (!client) {
      return {
        success: false,
        status: 'skipped',
        reason: 'resend_api_key_missing',
      };
    }

    if (!options.to || !options.to.includes('@')) {
      return {
        success: false,
        status: 'skipped',
        reason: 'invalid_recipient_email',
      };
    }

    const fromEmail = options.from || process.env.EMAIL_FROM || 'OraOra <leads@oraora.com.br>';

    const requestOptions: any = {};
    if (options.idempotencyKey) {
      requestOptions.idempotencyKey = options.idempotencyKey;
    }

    const response = await client.emails.send({
      from: fromEmail,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    }, requestOptions);

    if (response.error) {
      console.error('[EmailService] Erro retornado pelo Resend:', {
        message: response.error.message,
        name: response.error.name,
      });
      return {
        success: false,
        status: 'failed',
        reason: 'provider_error',
      };
    }

    return {
      success: true,
      status: 'sent',
      providerId: response.data?.id,
    };
  } catch (error: any) {
    console.error('[EmailService] Exceção ao enviar e-mail:', error?.message || error);
    return {
      success: false,
      status: 'failed',
      reason: 'exception_thrown',
    };
  }
}
