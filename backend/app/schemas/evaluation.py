from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SopMetadata(BaseModel):
    filename: str
    content_type: str
    size: int


class EvaluationCreate(BaseModel):
    process_name: str
    description: str
    volume: str
    frequency: str
    exception_rate: int
    complexity: int
    risk_tolerance: str
    compliance_sensitivity: str
    decision_points: str
    sop_metadata: SopMetadata | None = None


class EvaluationListItem(BaseModel):
    id: str
    process_name: str
    created_at: datetime
    automation_score: Any = None
    feasibility_score: Any = None
    fitment: Any = None
    status: str
