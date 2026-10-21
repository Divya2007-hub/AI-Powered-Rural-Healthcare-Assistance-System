# Architecture

## Layers

- **Frontend (React):** one folder per feature; all backend calls go through `src/api/`.
- **Backend (FastAPI):** Route (HTTP only) -> Service (business logic) -> Repository (database) or Integration (external API) or AI engine.
- **AI engine (Python package):** a swappable triage provider behind one interface, with a deterministic safety layer around it.

## Key rules

- The frontend depends only on the API contract in `api-contract.md`, never on how an answer is produced.
- External services (speech, maps, SMS) sit behind interfaces, with a mock first.
- Safety rules sit outside the model and override it.

## Build order (UI first)

1. Project setup
2. UI design system
3. Dashboard
4. Symptom triage UI
5. Triage result UI
6. Healthcare facilities UI
7. Pharmacy and medicine availability UI
8. Pharmacist portal UI
9. Profile and history UI
10. Backend API integration
11. Database
12. AI/ML engine
13. Voice and regional-language features
14. Maps/location integration
15. SMS and low-connectivity support
16. Testing and research evaluation