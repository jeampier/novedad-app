const { query } = require('../../../db/client')

async function loadNovelties(ctx) {
  // Load active dynamic concepts from payroll_concepts + payroll_rules
  const [conceptsRes, rulesRes] = await Promise.all([
    query(`SELECT * FROM payroll_concepts WHERE active = true ORDER BY type, category, code`),
    query(`SELECT * FROM payroll_rules   WHERE active = true ORDER BY priority ASC`),
  ])

  const rulesByConceptId = {}
  for (const rule of rulesRes.rows) {
    if (!rulesByConceptId[rule.concept_id]) rulesByConceptId[rule.concept_id] = []
    rulesByConceptId[rule.concept_id].push(rule)
  }

  ctx.dynamicConcepts = conceptsRes.rows.map(c => ({
    ...c,
    rules: rulesByConceptId[c.id] || [],
  }))

  ctx.log(
    'loadNovelties',
    `${ctx.dynamicConcepts.length} conceptos dinámicos · ${rulesRes.rows.length} reglas`,
    { codes: ctx.dynamicConcepts.map(c => c.code) }
  )

  return ctx
}

module.exports = loadNovelties
