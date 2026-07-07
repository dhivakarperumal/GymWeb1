const { getCurrentAuditUser } = require('../config/requestContext');

function getAuditFields({ forCreate = false } = {}) {
  const auditUser = getCurrentAuditUser();

  if (!auditUser) {
    return {};
  }

  const base = {
    updated_by: auditUser.user_id || auditUser.userId || null,
    updated_by_name: auditUser.username || null,
  };

  if (forCreate) {
    return {
      created_by: auditUser.user_id || auditUser.userId || null,
      created_by_name: auditUser.username || null,
      ...base,
    };
  }

  return base;
}

function injectAuditIntoSql(sql, values = []) {
  const trimmedSql = (sql || '').trim();
  if (!trimmedSql) {
    return { sql, values };
  }

  const normalizedSql = trimmedSql.replace(/\s+/g, ' ');
  const insertMatch = normalizedSql.match(/^INSERT\s+INTO\s+`?([A-Za-z0-9_]+)`?\s*\(([^)]*)\)\s*VALUES\s*\((.*)\)$/i);
  const updateMatch = normalizedSql.match(/^UPDATE\s+`?([A-Za-z0-9_]+)`?\s+SET\s+(.+)$/i);

  if (insertMatch) {
    const auditFields = getAuditFields({ forCreate: true });
    if (!Object.keys(auditFields).length) {
      return { sql, values };
    }

    const [, tableName, columnsSection, valuesSection] = insertMatch;
    const columns = columnsSection.split(',').map((c) => c.trim()).filter(Boolean);
    const hasAuditColumns = columns.some((column) => ['created_by', 'created_by_name', 'updated_by', 'updated_by_name'].includes(column.replace(/`/g, '')));

    if (!hasAuditColumns) {
      const newColumns = [...columns, 'created_by', 'created_by_name', 'updated_by', 'updated_by_name'];
      const newValuesSection = `${valuesSection.trim()}, ?, ?, ?, ?`;
      return {
        sql: `INSERT INTO ${tableName} (${newColumns.join(', ')}) VALUES (${newValuesSection})`,
        values: [...values, auditFields.created_by, auditFields.created_by_name, auditFields.updated_by, auditFields.updated_by_name],
      };
    }
    return { sql, values };
  }

  if (updateMatch) {
    const auditFields = getAuditFields({ forCreate: false });
    if (!Object.keys(auditFields).length) {
      return { sql, values };
    }

    const [, tableName, setClause] = updateMatch;
    const whereIndex = setClause.toUpperCase().lastIndexOf(' WHERE ');
    const relevantSetClause = whereIndex >= 0 ? setClause.slice(0, whereIndex) : setClause;
    const hasUpdatedBy = relevantSetClause.includes('updated_by');
    const hasUpdatedByName = relevantSetClause.includes('updated_by_name');
    const hasUpdatedAt = relevantSetClause.includes('updated_at');

    if (!hasUpdatedBy || !hasUpdatedByName || !hasUpdatedAt) {
      const suffix = [
        !hasUpdatedBy ? 'updated_by = ?' : null,
        !hasUpdatedByName ? 'updated_by_name = ?' : null,
        !hasUpdatedAt ? 'updated_at = CURRENT_TIMESTAMP' : null,
      ].filter(Boolean).join(', ');

      if (suffix) {
        const newSetClause = `${relevantSetClause.trim()}, ${suffix}`;
        const whereClause = whereIndex >= 0 ? setClause.slice(whereIndex) : '';
        return {
          sql: `UPDATE ${tableName} SET ${newSetClause}${whereClause}`,
          values: [...values, ...( !hasUpdatedBy ? [auditFields.updated_by] : []), ...( !hasUpdatedByName ? [auditFields.updated_by_name] : [] )],
        };
      }
    }
  }

  return { sql, values };
}

module.exports = {
  getAuditFields,
  injectAuditIntoSql,
};
