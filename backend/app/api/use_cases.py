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


def fallback_domain_use_cases(payload: DomainRequest):
    domain = payload.domain.strip() or 'General'
    objective = payload.objective.strip() or 'Improve operations'
    return {
        'use_cases': [
            {
                'title': f'Automated {domain} Fraud Detection and Prevention',
                'rating': 10,
                'description': f'AI can analyze transaction patterns in real-time for {domain}, flag anomalies, and support {objective.lower()} across teams.',
            },
            {'title': 'Intelligent Customer Support Chatbots', 'rating': 9, 'description': 'Conversational AI for routine support workflows.'},
            {'title': 'Automated Compliance and Regulatory Reporting', 'rating': 8, 'description': 'Automates extraction and reporting for compliance requirements.'},
            {'title': 'Predictive Analytics for Risk Management', 'rating': 8, 'description': 'Forecast risk events and trigger proactive interventions.'},
            {'title': 'Automated Loan Processing and Underwriting', 'rating': 7, 'description': 'Streamline intake and underwriting decisions.'},
        ]
    }


def fallback_company_use_cases(payload: CompanyRequest):
    company = payload.company_name.strip() or 'the company'
    return {
        'use_cases': [
            {
                'title': 'Automated Document Processing for Compliance',
                'domain': 'Finance',
                'rating': 9,
                'description': f'Agentic AI can automate compliance document workflows for {company}.',
            },
            {'title': 'Intelligent Customer Support Chatbots', 'domain': 'Customer Service', 'rating': 8, 'description': 'Resolve L1 support with AI assistants.'},
            {'title': 'Fraud Detection and Prevention', 'domain': 'Finance', 'rating': 9, 'description': 'Monitor suspicious patterns across channels.'},
            {'title': 'Automated Risk Assessment', 'domain': 'Finance', 'rating': 8, 'description': 'Risk scoring automation for faster reviews.'},
            {'title': 'Personalized Marketing Campaigns', 'domain': 'Marketing', 'rating': 7, 'description': 'AI-driven campaign targeting and personalization.'},
        ]
    }


@router.post('/domain')
async def discover_domain(payload: DomainRequest, current_user=Depends(get_current_user)):
    message = f'domain: {payload.domain},user_role: {payload.user_role},objective: {payload.objective}'
    status_text = 'Completed'
    error = None
    try:
        response = await call_agent(settings.USE_CASE_AGENT_ID, message)
    except Exception as exc:
        status_text = 'Fallback'
        error = {'detail': str(exc)}
        response = fallback_domain_use_cases(payload)
    doc = {
        'user_id': current_user['id'],
        'input': payload.model_dump(),
        'formatted_message': message,
        'agent_response': response,
        'status': status_text,
        'agent_error': error,
        'created_at': datetime.now(timezone.utc),
    }
    await collection('domain_use_cases').insert_one(doc)
    return doc


@router.post('/company')
async def discover_company(payload: CompanyRequest, current_user=Depends(get_current_user)):
    status_text = 'Completed'
    error = None
    try:
        response = await call_agent(settings.COMPANY_USE_CASE_AGENT_ID, payload.company_name)
    except Exception as exc:
        status_text = 'Fallback'
        error = {'detail': str(exc)}
        response = fallback_company_use_cases(payload)
    doc = {
        'user_id': current_user['id'],
        'input': payload.model_dump(),
        'formatted_message': payload.company_name,
        'agent_response': response,
        'status': status_text,
        'agent_error': error,
        'created_at': datetime.now(timezone.utc),
    }
    await collection('company_use_cases').insert_one(doc)
    return doc
