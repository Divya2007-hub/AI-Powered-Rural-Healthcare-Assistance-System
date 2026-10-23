function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechSupported() {
  return Boolean(getRecognitionConstructor())
}

export function createSpeechRecognizer({ language = 'en-IN', onTranscript, onError, onEnd }) {
  const Recognition = getRecognitionConstructor()
  if (!Recognition) return null

  const recognition = new Recognition()
  recognition.lang = language
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    let transcript = ''
    let isFinal = false
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript
      if (event.results[index].isFinal) isFinal = true
    }
    onTranscript?.(transcript.trim(), isFinal)
  }

  recognition.onerror = (event) => {
    onError?.(event.error)
  }

  recognition.onend = () => {
    onEnd?.()
  }

  return recognition
}
