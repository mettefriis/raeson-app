"""
Auth service — verifies Clerk JWTs on incoming API requests.

How it works:
1. Frontend (Clerk React SDK) gets a session token from Clerk after sign-in
2. Frontend sends token in Authorization: Bearer <token> header
3. Backend fetches Clerk's public keys (JWKS) and verifies the token
4. Verified token contains user ID (sub), email, etc.

Two FastAPI dependencies:
- get_optional_user: returns user info if token present, None if not
- get_current_user: requires valid token, raises 401 if missing/invalid
"""

import os
import httpx
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from functools import lru_cache

bearer_scheme = HTTPBearer(auto_error=False)

CLERK_ISSUER = os.getenv("CLERK_ISSUER")  # e.g. https://your-app.clerk.accounts.dev


@lru_cache(maxsize=1)
def _get_jwks() -> dict:
    """Fetch Clerk's public keys. Cached after first call."""
    if not CLERK_ISSUER:
        return {}
    url = f"{CLERK_ISSUER}/.well-known/jwks.json"
    response = httpx.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def _verify_token(token: str) -> dict:
    """Verify a Clerk JWT and return its claims."""
    jwks = _get_jwks()
    if not jwks:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured — set CLERK_ISSUER env var",
        )
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """
    Returns verified user claims if a valid token is present.
    Returns None if no token OR if verification fails.
    Never raises — safe for endpoints that work with or without auth.
    """
    if not credentials:
        return None
    try:
        return _verify_token(credentials.credentials)
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Requires a valid Clerk token. Raises 401 if missing or invalid.
    Use for endpoints that require a logged-in user.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return _verify_token(credentials.credentials)
