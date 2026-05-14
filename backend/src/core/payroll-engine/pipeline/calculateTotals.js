// Deduction rates come from payroll_settings (loaded by loadSettings pipeline step)
// Fallbacks match Colombia legal minimums in case settings are missing
const FALLBACK = { health: 0.04, pension: 0.04, solidarity: 0.01, solidarityThreshold: 4, }

async function calculateTotals(ctx) {
  const s = ctx.settings || {}
  const healthRate      = Number(s.tasa_salud)         || FALLBACK.health
  const pensionRate     = Number(s.tasa_pension)        || FALLBACK.pension
  const solidarityRate  = Number(s.tasa_solidaridad)    || FALLBACK.solidarity
  const solidarityLimit = Number(s.limite_solidaridad)  || FALLBACK.solidarityThreshold

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
    // Extras, recargos and aux transporte excluded — same as Excel basicoQ
    const basicoPay = concepts['HORAS_ORD']?.value ?? 0

    // Check if dynamic deduction concepts were configured (they take full control)
    let dynamicDeductionTotal = 0
    for (const c of Object.values(concepts)) {
      if (c.type === 'deduction') dynamicDeductionTotal += c.value
    }

    let health = 0, pension = 0, solidarity = 0

    if (dynamicDeductionTotal > 0) {
      health  = dynamicDeductionTotal
      pension = 0
    } else {
      health  = Math.round(basicoPay * healthRate)
      pension = Math.round(basicoPay * pensionRate)

      const smmlv = Number(emp.smmlv) || 0
      if (smmlv > 0 && Number(emp.base_salary) > solidarityLimit * smmlv) {
        solidarity = Math.round(basicoPay * solidarityRate)
      }
    }

    const deductions = health + pension + solidarity
    const netPay     = grossPay - deductions

    result.grossPay   = Math.round(grossPay)
    result.deductions = deductions
    result.netPay     = Math.round(netPay)

    result.deductionDetail = {
      base:          basicoPay,
      health,        healthRate,
      pension,       pensionRate,
      solidarity,    solidarityRate,
    }

    totalGross += result.grossPay
    totalNet   += result.netPay
  }

  ctx.log(
    'calculateTotals',
    `Nómina total: bruto $${totalGross.toLocaleString('es-CO')} · neto $${totalNet.toLocaleString('es-CO')}`,
    { totalGross, totalNet, employees: ctx.employees.length, rates: { healthRate, pensionRate, solidarityRate } }
  )

  return ctx
}

module.exports = calculateTotals
