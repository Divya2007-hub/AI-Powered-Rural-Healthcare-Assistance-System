# API Contract

Base path: `/api/v1`

## Implemented

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Reports that the backend is running |
| POST | `/auth/register` | Creates an account and returns a session token |
| POST | `/auth/login` | Returns a session token for valid credentials |
| POST | `/auth/logout` | Invalidates the current session token |
| GET | `/auth/me` | Returns the signed-in user |
| PATCH | `/users/me` | Updates the signed-in user's name and language |
| POST | `/triage/symptoms` | Returns urgency guidance for reported symptoms |
| GET | `/history/triage` | Lists the signed-in user's saved triage results |
| DELETE | `/history/triage/{id}` | Deletes one saved triage result |
| GET | `/facilities/nearby` | Lists nearby healthcare facilities from the database |
| GET | `/medicines/availability` | Searches medicine stock across facilities |
| GET | `/pharmacist/stock` | Lists the signed-in pharmacist's facility stock |
| POST | `/pharmacist/stock` | Adds a medicine stock entry for the pharmacist's facility |
| PATCH | `/pharmacist/stock/{id}` | Updates one of the pharmacist's stock entries |
| DELETE | `/pharmacist/stock/{id}` | Removes one of the pharmacist's stock entries |
| POST | `/sms/inbound` | Accepts an inbound SMS, runs triage, and sends a reply |
| GET | `/sms/outbox` | Lists messages sent by the mock SMS provider (development only) |

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
| `language` | string | Optional. One of `en`, `hi`, `kn`, `ta`, `te`, `mr`. Defaults to `en`; unsupported codes fall back to English. |

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
| `urgency` | Human-readable label in the requested language. For `en` it is one of `Low Urgency`, `Medical Consultation Recommended`, `Urgent Care Required`. |
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
distance (closest first, unknown distances last). When `lat` and `lng` are
provided, distances are computed from the user's coordinates with the haversine
formula; otherwise the stored demo distance is returned.

### Query parameters

| Parameter | Type | Rules |
|---|---|---|
| `city` | string | Optional. Case-insensitive partial match. Max 100 characters. |
| `type` | string | Optional. Case-insensitive partial match, e.g. `PHC`, `CHC`, `Hospital`, `Pharmacy`. Max 50 characters. |
| `emergency_only` | boolean | Optional. Defaults to `false`. Keeps facilities with emergency services or 24x7 hours. |
| `limit` | integer | Optional. Defaults to 20. Range 1-50. |
| `lat` | float | Optional. Must be sent with `lng`. Range -90 to 90. |
| `lng` | float | Optional. Must be sent with `lat`. Range -180 to 180. |
| `radius_km` | float | Optional. Requires `lat` and `lng`. Range >0 to 500. Excludes facilities farther than this. |

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

- `422 Unprocessable Entity` when a query parameter fails validation, when only
  one of `lat`/`lng` is sent, or when `radius_km` is sent without coordinates.

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

## Authentication

Register or log in to receive a session token. Send it on protected requests:

```
Authorization: Bearer <token>
```

Tokens expire after 7 days. Passwords are stored as salted PBKDF2-SHA256 hashes,
and only a hash of each session token is stored in the database.

### POST /auth/register

```json
{
  "name": "Asha Devi",
  "email": "asha@example.com",
  "password": "at-least-8-characters",
  "language": "en"
}
```

Returns `201 Created` with `{ "token": "...", "user": { ... } }`. Returns `409`
when the email is already registered.

### POST /auth/login

```json
{ "email": "asha@example.com", "password": "at-least-8-characters" }
```

Returns `200 OK` with `{ "token": "...", "user": { ... } }`, or `401` for invalid
credentials.

### POST /auth/logout

Requires the bearer token. Returns `204 No Content` and invalidates that session.

### GET /auth/me

Requires the bearer token. Returns the user:

```json
{
  "id": 1,
  "name": "Asha Devi",
  "email": "asha@example.com",
  "language": "en",
  "role": "patient",
  "created_at": "2026-10-23T10:00:00"
}
```

### PATCH /users/me

Requires the bearer token. Accepts optional `name` and `language` fields and
returns the updated user.

## GET /history/triage

Requires the bearer token. Returns the signed-in user's triage results, newest
first, limited by the optional `limit` query parameter (1-100, default 50).

```json
{
  "history": [
    {
      "id": 1,
      "symptoms": ["fever", "cough"],
      "duration_days": 2,
      "age_years": 34,
      "language": "en",
      "urgency": "Medical Consultation Recommended",
      "urgency_code": "consult",
      "emergency": false,
      "red_flags": [],
      "summary": "Based on the symptoms you shared, a medical consultation is recommended.",
      "advice": ["Contact a doctor or visit a nearby clinic for a check-up."],
      "disclaimer": "SevaCare gives general health information only.",
      "engine": "rule-based-v1",
      "created_at": "2026-10-23T10:00:00"
    }
  ],
  "count": 1
}
```

When a signed-in user calls `POST /triage/symptoms`, the result is saved to their
history automatically. Anonymous calls are not saved.

## DELETE /history/triage/{id}

Requires the bearer token. Deletes one of the user's own entries and returns
`204 No Content`. Returns `404` when the entry does not exist or belongs to
another user.

## Pharmacist portal

These endpoints require a bearer token belonging to a user with the `pharmacist`
role that is linked to a facility. Patients receive `403 Forbidden`; anonymous
requests receive `401 Unauthorized`. A pharmacist can only see and change stock
for their own facility.

In development, the app seeds a demo pharmacist:

```
email: pharmacist@sevacare.demo
password: Pharmacist123
facility: Seva Pharmacy
```

### GET /pharmacist/stock

Returns the pharmacist's facility and its medicine stock, sorted by medicine name.

```json
{
  "facility_id": 4,
  "facility_name": "Seva Pharmacy",
  "medicines": [
    {
      "id": 10,
      "medicine_name": "Paracetamol 500mg",
      "category": "Fever",
      "in_stock": true,
      "quantity": 120,
      "unit": "tablets",
      "price": 2.5,
      "updated_at": "2026-10-23T10:00:00"
    }
  ],
  "count": 1
}
```

### POST /pharmacist/stock

```json
{
  "medicine_name": "Cetirizine 10mg",
  "category": "Allergy",
  "in_stock": true,
  "quantity": 40,
  "unit": "strips",
  "price": 25.0
}
```

Returns `201 Created` with the created stock entry. `medicine_name` is required;
`category`, `quantity`, `unit`, and `price` are optional. Quantity and price must
not be negative.

### PATCH /pharmacist/stock/{id}

Accepts any subset of `category`, `in_stock`, `quantity`, `unit`, and `price`.
Returns `200 OK` with the updated entry, or `404` when the entry does not exist or
belongs to another facility.

### DELETE /pharmacist/stock/{id}

Returns `204 No Content`, or `404` when the entry does not exist or belongs to
another facility.

## SMS support

These endpoints are public because an SMS gateway calls them. The reply uses the
same triage engine and safety layer as `POST /triage/symptoms`, but it is
shortened for a text message (maximum 480 characters).

### POST /sms/inbound

```json
{
  "from": "+91-90000-00000",
  "body": "fever, cough",
  "language": "en"
}
```

`from` is required (3–40 characters). `body` is required (1–500 characters).
`language` is optional and defaults to `en`. Symptoms are separated by commas,
semicolons, or new lines.

A two-letter language prefix in the body overrides `language`, for example
`hi: fever, cough` replies in Hindi. Unsupported language codes fall back to
English.

Response `200 OK`:

```json
{
  "reply": "Medical Consultation Recommended: ... Warning signs: ... Next: ... This is general guidance, not a diagnosis...",
  "urgency_code": "consult",
  "emergency": false,
  "language": "en"
}
```

`urgency_code` is one of `low`, `consult`, or `urgent`. `emergency` is `true`
when the safety layer escalates the case. The reply is also handed to the
configured SMS provider.

Errors: `422` when the body is empty, contains no symptoms after the language
prefix, or when `from`/`body` fail validation.

### GET /sms/outbox

Development only; returns `404` outside the development environment. Lists the
messages captured by the mock provider:

```json
{
  "messages": [
    { "to": "+91-90000-00000", "body": "Medical Consultation Recommended: ..." }
  ],
  "count": 1
}
```
