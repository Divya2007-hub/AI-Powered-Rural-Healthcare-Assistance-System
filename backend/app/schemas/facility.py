from pydantic import BaseModel


class FacilityResponse(BaseModel):
    id: int
    name: str
    type: str
    address: str
    city: str
    state: str
    phone: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    open_24x7: bool
    emergency_services: bool
    distance_km: float | None = None

    model_config = {"from_attributes": True}


class FacilitiesListResponse(BaseModel):
    facilities: list[FacilityResponse]
    count: int
