const ISSUER_PREFIX = 'https://securetoken.google.com/';
const MAX_TOKEN_LENGTH = 8192;

const unauthorized = (res) => res.status(401).json({ error: 'Authentication required.' });

/**
 * Create an Express bearer-token identity guard.
 * verifyToken must cryptographically verify signature, issuer, audience and
 * token lifetime before returning decoded claims. This guard repeats the
 * security-relevant claim checks and derives identity only from decoded uid.
 */
export function createIdentityGuard({ projectId, verifyToken } = {}) {
  return async function identityGuard(req, res, next) {
    if (typeof projectId !== 'string' || !projectId.trim() || typeof verifyToken !== 'function') {
      return res.status(503).json({ error: 'Authentication unavailable.' });
    }

    const authorization = req.headers.authorization;
    if (typeof authorization !== 'string' || authorization.length > MAX_TOKEN_LENGTH + 7) {
      return unauthorized(res);
    }
    const match = /^Bearer ([A-Za-z0-9._~+\/-]+=*)$/.exec(authorization);
    if (!match || match[1].length < 1 || match[1].length > MAX_TOKEN_LENGTH) return unauthorized(res);

    try {
      const claims = await verifyToken(match[1]);
      if (!claims || typeof claims !== 'object') return unauthorized(res);
      const { uid, sub, aud, iss, exp, iat } = claims;
      const now = Math.floor(Date.now() / 1000);
      if (typeof uid !== 'string' || uid.length < 1 || uid.length > 128 || /[\u0000-\u001f\u007f]/.test(uid)) return unauthorized(res);
      if (typeof sub !== 'string' || sub !== uid) return unauthorized(res);
      if (aud !== projectId || iss !== `${ISSUER_PREFIX}${projectId}`) return unauthorized(res);
      if (!Number.isSafeInteger(exp) || exp <= now) return unauthorized(res);
      if (!Number.isSafeInteger(iat) || iat > now + 60 || iat < 0 || iat >= exp) return unauthorized(res);

      req.kairoIdentity = Object.freeze({ uid });
      return next();
    } catch {
      return unauthorized(res);
    }
  };
}
