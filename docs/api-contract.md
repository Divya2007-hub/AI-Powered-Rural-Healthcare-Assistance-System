# API Contract

Base path: `/api/v1`

## Implemented

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Reports that the backend is running |
| POST | `/triage/symptoms` | Returns urgency guidance for reported symptoms |
| GET | `/facilities/nearby` | Lists nearby healthcare facilities from the database |
| GET | `/medicines/availability` | Searches medicine stock across facilities |

Further endpoints will be defined here before they are implemented.

## POST /triage/symptoms

Accepts symptoms and returns first-level urgency guidance. It never diagnoses
and never recommends medicine.

### Request

```json
{
  "symptoms": ["fever", "cough"],
  "duration_days": 2,
  "age_years": 34,
  "language": "en"
}
```

| Field | Type | Rules |
|---|---|---|
| `symptoms` | array of strings | Required. 1-20 non-empty items, each up to 200 characters. |
| `duration_days` | integer or null | Optional. 0-365. |
| `age_years` | integer or null | Optional. 0-120. |
| `language` | string | Optional. Defaults to `en`. |

### Response `200 OK`

```json
{
  "urgency": "Medical Consultation Recommended",
  "urgency_code": "consult",
  "emergency": false,
  "red_flags": [],
  "summary": "Based on the symptoms you shared, a medical consultation is recommended. This is guidance, not a diagnosis.",
  "advice": [
    "Contact a doctor or visit a nearby clinic for a check-up.",
    "Note when the symptoms started and whether they are getting worse.",
    "Seek care sooner if symptoms become severe or new symptoms appear."
  ],
  "disclaimer": "SevaCare gives general health information only. It does not diagnose illness or prescribe medicine. In an emergency, contact a doctor or your local emergency number.",
  "engine": "rule-based-v1"
}
```

| Field | Meaning |
|---|---|
| `urgency` | One of `Low Urgency`, `Medical Consultation Recommended`, `Urgent Care Required`. |
| `urgency_code` | Machine-friendly value: `low`, `consult`, or `urgent`. |
| `emergency` | `true` when an emergency warning sign was detected. |
| `red_flags` | Emergency warning signs found in the input. |
| `summary` | Short, non-diagnostic explanation. |
| `advice` | Safe next steps for the given urgency. |
| `disclaimer` | Safety disclaimer, always present. |
| `engine` | Name of the triage provider that produced the result. |

### Errors

- `422 Unprocessable Entity` when the request body fails validation.

### Safety rules

- Emergency warning signs always take priority and force `Urgent Care Required`.
- Unknown symptoms and engine failures default to `Medical Consultation Recommended`,
  never to `Low Urgency`.
- Responses never name a disease or recommend a medicine or dosage.

## GET /facilities/nearby

Returns healthcare facilities stored in the local SQLite database, sorted by
distance (closest first, unknown distances last).

### Query parameters

| Parameter | Type | Rules |
|---|---|---|
| `city` | string | Optional. Case-insensitive partial match. Max 100 characters. |
| `type` | string | Optional. Case-insensitive partial match, e.g. `PHC`, `CHC`, `Hospital`, `Pharmacy`. Max 50 characters. |
| `emergency_only` | boolean | Optional. Defaults to `false`. Keeps facilities with emergency services or 24x7 hours. |
| `limit` | integer | Optional. Defaults to 20. Range 1-50. |

### Response `200 OK`

```json
{
  "facilities": [
    {
      "id": 4,
      "name": "Seva Pharmacy",
      "type": "Pharmacy",
      "address": "Market Street, Rampur Village",
      "city": "Rampur",
      "state": "Uttar Pradesh",
      "phone": "+91-98765-43212",
      "latitude": 26.848,
      "longitude": 80.947,
      "open_24x7": false,
      "emergency_services": false,
      "distance_km": 1.6
    }
  ],
  "count": 1
}
```

### Errors

- `422 Unprocessable Entity` when a query parameter fails validation.

## GET /medicines/availability

Searches medicine stock across facilities, sorted by facility distance (closest
first). Availability and prices are informational; the API never recommends a
medicine or a dosage.

### Query parameters

| Parameter | Type | Rules |
|---|---|---|
| `medicine` | string | Optional. Case-insensitive partial match on the medicine name. Max 120 characters. |
| `city` | string | Optional. Case-insensitive partial match on the facility city. Max 100 characters. |
| `in_stock` | boolean | Optional. `true` keeps only in-stock rows, `false` only out-of-stock rows. |
| `limit` | integer | Optional. Defaults to 50. Range 1-100. |

### Response `200 OK`

```json
{
  "medicines": [
    {
      "id": 1,
      "medicine_name": "Paracetamol 500mg",
      "category": "Pain and fever",
      "in_stock": true,
      "quantity": 120,
      "unit": "strips",
      "price": 20.0,
      "facility_id": 4,
      "facility_name": "Seva Pharmacy",
      "facility_type": "Pharmacy",
      "city": "Rampur",
      "state": "Uttar Pradesh",
      "phone": "+91-98765-43212",
      "distance_km": 1.6,
      "updated_at": "2026-10-23T10:00:00"
    }
  ],
  "count": 1
}
```

### Errors

- `422 Unprocessable Entity` when a query parameter fails validation.
