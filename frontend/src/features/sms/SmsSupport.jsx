import { useState } from 'react'
import { sendDemoSms } from '../../api/sms.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const DEMO_NUMBER = '+91-90000-00000'

export default function SmsSupport({ onBack }) {
  const { language, t } = useI18n()
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])

  const send = async (event) => {
    event.preventDefault()
    setError('')

    const text = body.trim()
    if (!text) {
      setError(t('sms.empty'))
      return
    }

    setStatus('sending')
    try {
      const result = await sendDemoSms({ body: text, language })
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-${current.length}`, text, reply: result.reply },
      ])
      setBody('')
      setStatus('idle')
    } catch (err) {
      setError(err.message || t('sms.error'))
      setStatus('idle')
    }
  }

  return (
    <section className="sms" aria-labelledby="sms-title">
      <div className="triage-intro">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          {t('common.backHome')}
        </button>
        <h1 id="sms-title">{t('sms.title')}</h1>
        <p className="triage-lead">{t('sms.lead')}</p>
      </div>

      <div className="sms-grid">
        <div className="sms-card">
          <h2>{t('sms.howTitle')}</h2>
          <p>{t('sms.howBody')}</p>
          <p className="sms-number">
            {t('sms.numberLabel')}: <strong>{DEMO_NUMBER}</strong>
          </p>
          <p className="sms-demo-note">{t('sms.demoNote')}</p>
          <p className="safety-note">{t('symptoms.safety')}</p>
        </div>

        <div className="sms-card">
          <h2>{t('sms.formTitle')}</h2>

          <div className="sms-thread" aria-live="polite">
            <h3>{t('sms.threadTitle')}</h3>
            {messages.length === 0 && <p className="sms-empty">{t('sms.threadEmpty')}</p>}
            {messages.map((message) => (
              <div key={message.id} className="sms-exchange">
                <p className="sms-bubble is-out">
                  <span className="sms-label">{t('sms.you')}</span>
                  {message.text}
                </p>
                <p className="sms-bubble is-in">
                  <span className="sms-label">{t('sms.replyFrom')}</span>
                  {message.reply}
                </p>
              </div>
            ))}
          </div>

          <form className="sms-form" onSubmit={send} noValidate>
            <div className="field">
              <label htmlFor="sms-body">{t('sms.messageLabel')}</label>
              <p className="field-hint" id="sms-body-hint">
                {t('sms.messageHint')}
              </p>
              <textarea
                id="sms-body"
                name="body"
                rows={4}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={t('sms.messagePlaceholder')}
                aria-describedby="sms-body-hint"
                maxLength={500}
              />
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
              {status === 'sending' ? t('sms.sending') : t('sms.send')}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
