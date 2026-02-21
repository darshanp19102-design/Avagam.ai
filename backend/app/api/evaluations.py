import json
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.mongo import collection
from app.schemas.evaluation import EvaluationCreate
from app.services.mistral import call_agent

router = APIRouter(prefix='/api/evaluations', tags=['evaluations'])


def extract_content(agent_json: dict):
    try:
        content = agent_json['choices'][0]['message']['content']
        if isinstance(content, str):
            text = content.strip()
            if text.startswith('```'):
                text = text.split('\n', 1)[1] if '\n' in text else text
                if text.endswith('```'):
                    text = text[:-3]
                text = text.strip()
            try:
                parsed = json.loads(text)
                if isinstance(parsed, dict):
                    if 'process_characteristics' not in parsed and isinstance(parsed.get('dimensions'), dict):
                        parsed['process_characteristics'] = parsed['dimensions']
                    return parsed
                return {'raw_text': content}
            except json.JSONDecodeError:
                return {'raw_text': content}
        return content
    except Exception:
        return None


@router.post('')
async def submit_evaluation(payload: EvaluationCreate, current_user=Depends(get_current_user)):
    formatted = (
        f"{payload.process_name}\n"
        f"{payload.description}\n"
        f"process_volume: {payload.volume}\n"
        f"process_frequency: {payload.frequency}\n"
        f"exception_rate: {payload.exception_rate}%\n"
        f"process_complexity: {payload.complexity}\n"
        f"risk_tolerance: {payload.risk_tolerance}\n"
        f"compliance_sensitivity: {payload.compliance_sensitivity}\n"
        f"decision_points: {payload.decision_points}"
    )

    agent_response = None
    content = None
    status_text = 'Completed'
    agent_error = None
    try:
        agent_response = await call_agent(settings.PROCESS_AGENT_ID, formatted)
        content = extract_content(agent_response)
    except HTTPException as exc:
        status_text = 'Failed'
        agent_error = {'status_code': exc.status_code, 'detail': exc.detail}

    doc = {
        'user_id': current_user['id'],
        'process_name': payload.process_name,
        'submitted_payload': payload.model_dump(),
        'formatted_message': formatted,
        'agent_response': agent_response,
        'parsed_content': content,
        'agent_error': agent_error,
        'status': status_text,
        'created_at': datetime.now(timezone.utc),
    }
    result = await collection('evaluations').insert_one(doc)
    doc['id'] = str(result.inserted_id)
    return doc


@router.get('')
async def my_evaluations(current_user=Depends(get_current_user)):
    cursor = collection('evaluations').find({'user_id': current_user['id']}).sort('created_at', -1)
    rows = []
    async for item in cursor:
        content = item.get('parsed_content') if isinstance(item.get('parsed_content'), dict) else {}
        rows.append(
            {
                'id': str(item['_id']),
                'process_name': item.get('process_name'),
                'created_at': item.get('created_at'),
                'automation_score': content.get('automation_feasibility_score'),
                'feasibility_score': content.get('business_benefit_score'),
                'fitment': content.get('fitment'),
                'status': item.get('status', 'Completed'),
            }
        )
    return rows


@router.get('/{evaluation_id}')
async def get_evaluation(evaluation_id: str, current_user=Depends(get_current_user)):
    try:
        oid = ObjectId(evaluation_id)
    except InvalidId as exc:
        raise HTTPException(status_code=400, detail='Invalid evaluation id') from exc

    item = await collection('evaluations').find_one({'_id': oid, 'user_id': current_user['id']})
    if not item:
        raise HTTPException(status_code=404, detail='Evaluation not found')
    item['id'] = str(item.pop('_id'))
    return item
