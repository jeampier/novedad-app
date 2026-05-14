// Statutory deduction rates — Colombia
// Deductions apply to basicoPay (IBC pro-rated), NOT to gross pay (which includes extras)
const HEALTH_RATE      = 0.04
const PENSION_RATE     = 0.04
const SOLIDARITY_RATE  = 0.01  // Only if base_salary > 4 × smmlv

async function calculateTotals(ctx) {
  let totalGross = 0, totalNet = 0

  for (const emp of ctx.employees) {
    const result   = ctx.employeeResults[emp.id]
    const concepts = result.concepts

    // Sum all earnings (builtin + dynamic)
    let grossPay = 0
    for (const c of Object.values(concepts)) {
      if (c.type === 'earning') grossPay += c.value
    }

    // Deduction base = ordinary salary only (IBC pro-rated by days worked)
    // Extras, recargos and aux transporte are excluded — same as Excel basicoQ
    const basicoPay = concepts['HORAS_ORD']?.value ?? 0

    // Check if dynamic deduction concepts were configured (they take full control)
    let dynamicDeductionTotal = 0
    for (const c of Object.values(concepts)) {
      if (c.type === 'deduction') dynamicDeductionTotal += c.value
    }

    let health = 0, pension = 0, solidarity = 0

    if (dynamicDeductionTotal > 0) {
      // Dynamic concepts defined — respect them entirely
      health  = dynamicDeductionTotal
      pension = 0
    } else {
      // Statutory: 4% salud + 4% pensión on basicoPay (not on grossPay)
      health  = Math.round(basicoPay * HEALTH_RATE)
      pension = Math.round(basicoPay * PENSION_RATE)

      // Fondo de solidaridad: +1% if base_salary > 4 × smmlv
      const smmlv = Number(emp.smmlv) || 0
      if (smmlv > 0 && Number(emp.base_salary) > 4 * smmlv) {
        solidarity = Math.round(basicoPay * SOLIDARITY_RATE)
      }
    }

    const deductions = health + pension + solidarity
    const netPay     = grossPay - deductions

    result.grossPay   = Math.round(grossPay)
    result.deductions = deductions
    result.netPay     = Math.round(netPay)

    result.deductionDetail = {
      base:       basicoPay,
      health,
      pension,
      solidarity,
    }

    totalGross += result.grossPay
    totalNet   += result.netPay
  }

  ctx.log(
    'calculateTotals',
    `Nómina total: bruto $${totalGross.toLocaleString('es-CO')} · neto $${totalNet.toLocaleString('es-CO')}`,
    { totalGross, totalNet, employees: ctx.employees.length }
  )

  return ctx
}

module.exports = calculateTotals
