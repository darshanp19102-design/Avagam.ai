from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.mongo import collection
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse
from app.services.emailer import send_verification_email

router = APIRouter(prefix='/api/auth', tags=['auth'])


@router.post('/signup', response_model=TokenResponse)
async def signup(payload: SignupRequest):
    users = collection('users')
    exists = await users.find_one({'email': payload.email.lower()})
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Email already registered')

    doc = {
        'company_name': payload.company_name,
        'email': payload.email.lower(),
        'password_hash': hash_password(payload.password),
        'email_verified': False,
        'created_at': datetime.now(timezone.utc),
    }
    result = await users.insert_one(doc)
    user_id = str(result.inserted_id)
    verify_token = create_email_verification_token(user_id)
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={verify_token}"

    email_sent = False
    try:
        email_sent = send_verification_email(doc['email'], verify_link)
    except Exception:
        email_sent = False

    await collection('email_logs').insert_one(
        {
            'user_id': user_id,
            'email': doc['email'],
            'verify_link': verify_link,
            'email_sent': email_sent,
            'created_at': datetime.now(timezone.utc),
        }
    )

    token = create_access_token(user_id)
    return {
        'access_token': token,
        'user': {
            'id': user_id,
            'company_name': doc['company_name'],
            'email': doc['email'],
            'email_verified': doc['email_verified'],
            'created_at': doc['created_at'],
            'verification_email_sent': email_sent,
        },
    }


@router.post('/login', response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await collection('users').find_one({'email': payload.email.lower()})
    if not user or not verify_password(payload.password, user['password_hash']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    user_id = str(user['_id'])
    return {
        'access_token': create_access_token(user_id),
        'user': {
            'id': user_id,
            'company_name': user['company_name'],
            'email': user['email'],
            'email_verified': user.get('email_verified', False),
            'created_at': user['created_at'],
        },
    }


@router.get('/verify-email')
async def verify_email(token: str = Query(...)):
    payload = decode_token(token)
    if not payload or payload.get('type') != 'verify_email' or 'sub' not in payload:
        raise HTTPException(status_code=400, detail='Invalid verification token')

    result = await collection('users').find_one({'_id': ObjectId(payload['sub'])})
    if not result:
        raise HTTPException(status_code=404, detail='User not found')

    await collection('users').update_one({'_id': result['_id']}, {'$set': {'email_verified': True}})
    return {'message': 'Email verified successfully'}


@router.get('/verification-preview')
async def verification_preview(current_user=Depends(get_current_user)):
    cursor = collection('email_logs').find({'user_id': current_user['id']}).sort('created_at', -1)
    async for item in cursor:
        item['id'] = str(item.pop('_id'))
        return item
    raise HTTPException(status_code=404, detail='No verification email log found')


@router.get('/me')
async def me(current_user=Depends(get_current_user)):
    return current_user
