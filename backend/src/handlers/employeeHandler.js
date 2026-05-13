const employeeRepo = require('../repositories/employeeRepo')
async function onboardEmployee(payload, context) {
  const { name, document, position, area, startDate, shift } = payload
  if (!name || !document || !position) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  return employeeRepo.create({ name, document, position, area, startDate, shift, createdBy: context.userId })
}
async function offboardEmployee(payload, context) {
  const { employeeId, endDate, reason } = payload
  if (!employeeId || !endDate) { const e = new Error('Faltan campos requeridos'); e.status=400; throw e }
  return employeeRepo.deactivate({ employeeId, endDate, reason, createdBy: context.userId })
}
module.exports = { onboardEmployee, offboardEmployee }
