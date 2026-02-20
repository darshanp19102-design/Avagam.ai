from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.mongo import collection
from app.services.mistral import call_agent

router = APIRouter(prefix='/api/use-cases', tags=['use-cases'])


class DomainRequest(BaseModel):
    domain: str
    user_role: str
    objective: str


class CompanyRequest(BaseModel):
    company_name: str


@router.post('/domain')
async def discover_domain(payload: DomainRequest, current_user=Depends(get_current_user)):
    message = f'domain: {payload.domain},user_role: {payload.user_role},objective: {payload.objective}'
    response = await call_agent(settings.USE_CASE_AGENT_ID, message)
    doc = {
        'user_id': current_user['id'],
        'input': payload.model_dump(),
        'formatted_message': message,
        'agent_response': response,
        'created_at': datetime.now(timezone.utc),
    }
    await collection('domain_use_cases').insert_one(doc)
    return doc


@router.post('/company')
async def discover_company(payload: CompanyRequest, current_user=Depends(get_current_user)):
    response = await call_agent(settings.COMPANY_USE_CASE_AGENT_ID, payload.company_name)
    doc = {
        'user_id': current_user['id'],
        'input': payload.model_dump(),
        'formatted_message': payload.company_name,
        'agent_response': response,
        'created_at': datetime.now(timezone.utc),
    }
    await collection('company_use_cases').insert_one(doc)
    return doc
