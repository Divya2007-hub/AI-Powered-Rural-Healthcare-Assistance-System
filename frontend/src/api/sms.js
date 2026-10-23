import { apiFetch } from './client.js'

export function sendDemoSms({ body, language, sender = '+91-90000-00000' }) {
  return apiFetch('/sms/inbound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: sender, body, language }),
  })
}
