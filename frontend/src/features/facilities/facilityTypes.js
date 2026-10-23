export function facilityTypeLabel(type, t) {
  const key = `facilityType.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}
