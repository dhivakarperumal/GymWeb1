const { AsyncLocalStorage } = require('async_hooks');

const requestStorage = new AsyncLocalStorage();

function runWithRequestContext(req, fn) {
  return requestStorage.run({ req }, fn);
}

function getRequestContext() {
  return requestStorage.getStore() || {};
}

function getCurrentAuditUser() {
  return getRequestContext().req?.auditUser || null;
}

module.exports = {
  runWithRequestContext,
  getRequestContext,
  getCurrentAuditUser,
};
