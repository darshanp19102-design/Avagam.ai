from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.mongo import collection

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])


@router.get('')
async def dashboard(current_user=Depends(get_current_user)):
    total = await collection('evaluations').count_documents({'user_id': current_user['id']})
    cursor = collection('evaluations').find({'user_id': current_user['id']})
    scores = []
    async for item in cursor:
        content = item.get('parsed_content')
        if isinstance(content, dict):
            val = content.get('automation_feasibility_score')
            if isinstance(val, (int, float)):
                scores.append(float(val))
    avg = round(sum(scores) / len(scores), 2) if scores else 0
    return {
        'total_evaluations': total,
        'average_automation_score': avg,
        'charts': {
            'evaluation_trend': [],
            'technology_distribution': [],
        },
    }
