from collections import Counter, defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.db.mongo import collection

router = APIRouter(prefix='/api/dashboard', tags=['dashboard'])


def score_from_item(item: dict) -> float | None:
    content = item.get('parsed_content')
    if isinstance(content, dict):
        value = content.get('automation_feasibility_score')
        if isinstance(value, (int, float)):
            return float(value)
    return None


def fitment_from_item(item: dict) -> str:
    content = item.get('parsed_content')
    if isinstance(content, dict):
        fitment = content.get('fitment')
        if isinstance(fitment, str) and fitment.strip():
            return fitment.strip()
    return 'Unknown'


@router.get('')
async def dashboard(current_user=Depends(get_current_user)):
    cursor = collection('evaluations').find({'user_id': current_user['id']})

    total = 0
    scores = []
    trend_counts = defaultdict(int)
    fitment_counter = Counter()

    async for item in cursor:
        total += 1
        score = score_from_item(item)
        if score is not None:
            scores.append(score)

        created_at = item.get('created_at')
        if isinstance(created_at, datetime):
            key = created_at.strftime('%Y-%m-%d')
            trend_counts[key] += 1

        fitment_counter[fitment_from_item(item)] += 1

    avg = round(sum(scores) / len(scores), 2) if scores else 0
    trend = [{'date': k, 'count': trend_counts[k]} for k in sorted(trend_counts.keys())]
    distribution = [{'technology': k, 'count': v} for k, v in fitment_counter.items()]

    return {
        'total_evaluations': total,
        'average_automation_score': avg,
        'charts': {
            'evaluation_trend': trend,
            'technology_distribution': distribution,
        },
    }
