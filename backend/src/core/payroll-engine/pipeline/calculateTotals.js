// Statutory deduction rates (Colombia: salud 4% + pensión 4%)
const HEALTH_RATE   = 0.04
const PENSION_RATE  = 0.04
const DEDUCTION_RATE = HEALTH_RATE + PENSION_RATE

async function calculateTotals(ctx) {
  let totalGross = 0, totalNet = 0

  for (const emp of ctx.employees) {
    const result = ctx.employeeResults[emp.id]
    const concepts = result.concepts

    let grossPay   = 0
    let deductions = 0

    // Sum earnings (builtin + dynamic)
    for (const [code, c] of Object.entries(concepts)) {
      if (c.type === 'earning') {
        grossPay += c.value
      }
    }

    // Dynamic deduction concepts override the flat 8% for their portion
    let dynamicDeductionTotal = 0
    for (const [code, c] of Object.entries(concepts)) {
      if (c.type === 'deduction') {
        dynamicDeductionTotal += c.value
      }
    }

    // If no dynamic deduction concepts exist, apply statutory 8%
    if (dynamicDeductionTotal === 0) {
      deductions = Math.round(grossPay * DEDUCTION_RATE)
    } else {
      deductions = Math.round(dynamicDeductionTotal)
    }

    const netPay = grossPay - deductions

    result.grossPay   = Math.round(grossPay)
    result.deductions = deductions
    result.netPay     = Math.round(netPay)

    // Attach deduction detail
    result.deductionDetail = {
      rate:    DEDUCTION_RATE,
      health:  Math.round(grossPay * HEALTH_RATE),
      pension: Math.round(grossPay * PENSION_RATE),
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
