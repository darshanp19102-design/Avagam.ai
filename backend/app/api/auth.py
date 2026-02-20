from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.mongo import collection
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse

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
    token = create_access_token(user_id)
    return {
        'access_token': token,
        'user': {
            'id': user_id,
            'company_name': doc['company_name'],
            'email': doc['email'],
            'email_verified': doc['email_verified'],
            'created_at': doc['created_at'],
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


@router.get('/me')
async def me(current_user=Depends(get_current_user)):
    return current_user
