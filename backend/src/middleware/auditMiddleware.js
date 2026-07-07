const jwt = require('jsonwebtoken');
const { runWithRequestContext } = require('../config/requestContext');

const AUDIT_FIELDS = ['created_by', 'created_by_name', 'updated_by', 'updated_by_name', 'created_at', 'updated_at'];

function sanitizeAuditPayload(req) {
  if (!req || !req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return;
  }

  for (const field of AUDIT_FIELDS) {
    delete req.body[field];
  }
}

function attachAuditContext(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  let auditUser = null;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      auditUser = {
        user_id: decoded.user_id || decoded.userId || decoded.user?.user_id || decoded.user?.userId || null,
        userId: decoded.userId || decoded.user_id || null,
        username: decoded.username || decoded.user?.username || null,
        role: decoded.role || decoded.user?.role || null,
        email: decoded.email || decoded.user?.email || null,
      };
    } catch (err) {
      auditUser = null;
    }
  }

  req.auditUser = auditUser;
  req.user = auditUser;
  sanitizeAuditPayload(req);

  runWithRequestContext(req, () => next());
}

module.exports = { attachAuditContext };
