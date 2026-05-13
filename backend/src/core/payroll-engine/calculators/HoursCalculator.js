// Pure functions — no DB access, no side effects.

const DEFAULTS = {
  extraMultiplier:         1.25,
  nightMultiplier:         1.35,
  surchargeMultiplier:     1.35,
  sundayHolidayMultiplier: 1.75,
}

function n(v) { return Number(v) || 0 }

function calculateDay(day) {
  return {
    ordinary:         n(day.ordinary_hours),
    extra:            n(day.extra_hours),
    night:            n(day.night_hours),
    surcharge:        n(day.surcharge_hours),
    sundayHoliday:    n(day.sunday_holiday_hours),
    extraMul:         n(day.extra_multiplier)         || DEFAULTS.extraMultiplier,
    nightMul:         n(day.night_multiplier)         || DEFAULTS.nightMultiplier,
    surchargeMul:     n(day.surcharge_multiplier)     || DEFAULTS.surchargeMultiplier,
    sundayHolidayMul: n(day.sunday_holiday_multiplier)|| DEFAULTS.sundayHolidayMultiplier,
  }
}

function dayPay(hours, hourlyRate) {
  return (
    hours.ordinary      * hourlyRate +
    hours.extra         * hourlyRate * hours.extraMul +
    hours.night         * hourlyRate * hours.nightMul +
    hours.surcharge     * hourlyRate * hours.surchargeMul +
    hours.sundayHoliday * hourlyRate * hours.sundayHolidayMul
  )
}

function isWorkedDay(day) {
  return !day.is_rest_day && !day.absence_type && !!day.shift_type_id
}

function isAbsenceType(day, type) {
  return day.absence_type === type
}

function aggregateEmployee(days, baseSalary) {
  const hourlyRate = n(baseSalary) / 240
  let daysWorked = 0, restDays = 0, absenceDays = 0, disabilityDays = 0, vacationDays = 0
  let ordinary = 0, extra = 0, night = 0, surcharge = 0, sundayHoliday = 0
  let grossPay = 0
  const breakdown = []

  for (const day of days) {
    if (day.is_rest_day) { restDays++; continue }
    if (isAbsenceType(day, 'incapacidad')) { disabilityDays++; continue }
    if (isAbsenceType(day, 'vacaciones'))  { vacationDays++;   continue }
    if (day.absence_type)                   { absenceDays++;    continue }
    if (!day.shift_type_id)                 { continue }

    daysWorked++
    const h   = calculateDay(day)
    const pay = dayPay(h, hourlyRate)
    ordinary      += h.ordinary
    extra         += h.extra
    night         += h.night
    surcharge     += h.surcharge
    sundayHoliday += h.sundayHoliday
    grossPay      += pay

    breakdown.push({
      date:         day.schedule_date,
      shiftCode:    day.shift_code || null,
      ordinary:     h.ordinary,
      extra:        h.extra,
      night:        h.night,
      surcharge:    h.surcharge,
      sundayHoliday:h.sundayHoliday,
      pay:          Math.round(pay),
    })
  }

  return {
    hourlyRate,
    daysWorked, restDays, absenceDays, disabilityDays, vacationDays,
    ordinary, extra, night, surcharge, sundayHoliday,
    grossPay: Math.round(grossPay),
    breakdown,
  }
}

module.exports = { calculateDay, dayPay, aggregateEmployee, isWorkedDay }
