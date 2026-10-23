import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { facilityTypeLabel } from './facilityTypes.js'

const DEFAULT_CENTER = [26.8467, 80.9462]
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export default function FacilityMap({ facilities }) {
  const { t } = useI18n()
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const hasCoordinates = facilities.some(
    (facility) => facility.latitude != null && facility.longitude != null,
  )

  useEffect(() => {
    if (!containerRef.current) return undefined

    const map = L.map(containerRef.current, { scrollWheelZoom: false })
    map.setView(DEFAULT_CENTER, 9)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map

    const handleResize = () => map.invalidateSize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [hasCoordinates])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined

    if (layerRef.current) layerRef.current.remove()
    const layer = L.layerGroup().addTo(map)
    layerRef.current = layer

    const located = facilities.filter(
      (facility) => facility.latitude != null && facility.longitude != null,
    )

    located.forEach((facility) => {
      const marker = L.circleMarker([facility.latitude, facility.longitude], {
        radius: 8,
        color: '#136f54',
        weight: 2,
        fillColor: '#d7ece0',
        fillOpacity: 1,
      }).addTo(layer)

      const popup = document.createElement('div')
      const name = document.createElement('strong')
      name.textContent = facility.name
      const type = document.createElement('div')
      type.textContent = facilityTypeLabel(facility.type, t)
      const place = document.createElement('div')
      place.textContent = facility.city
      popup.append(name, type, place)
      marker.bindPopup(popup)
    })

    if (located.length === 1) {
      map.setView([located[0].latitude, located[0].longitude], 13)
    } else if (located.length > 1) {
      map.fitBounds(
        L.latLngBounds(located.map((facility) => [facility.latitude, facility.longitude])),
        { padding: [30, 30], maxZoom: 13 },
      )
    }

    return undefined
  }, [facilities, t])

  return (
    <section className="facility-map-panel" aria-labelledby="facility-map-title">
      <h2 id="facility-map-title">{t('nearby.mapTitle')}</h2>
      {hasCoordinates ? (
        <div
          ref={containerRef}
          className="facility-map-canvas"
          role="region"
          aria-label={t('nearby.mapLabel')}
        />
      ) : (
        <p className="facility-map-empty">{t('nearby.mapEmpty')}</p>
      )}
    </section>
  )
}
