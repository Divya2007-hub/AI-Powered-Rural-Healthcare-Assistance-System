export const LANGUAGES = [
  { code: 'en', native: 'English', name: 'English', locale: 'en-IN' },
  { code: 'kn', native: 'ಕನ್ನಡ', name: 'Kannada', locale: 'kn-IN' },
  { code: 'hi', native: 'हिंदी', name: 'Hindi', locale: 'hi-IN' },
  { code: 'ta', native: 'தமிழ்', name: 'Tamil', locale: 'ta-IN' },
  { code: 'te', native: 'తెలుగు', name: 'Telugu', locale: 'te-IN' },
  { code: 'mr', native: 'मराठी', name: 'Marathi', locale: 'mr-IN' },
]

export function localeFor(code) {
  return LANGUAGES.find((language) => language.code === code)?.locale || 'en-IN'
}
