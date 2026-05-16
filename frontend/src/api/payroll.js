import http from './client'

export const dashboard = {
  summary: () => http.get('/dashboard/summary').then(r => r.data.data),
}

export const shiftTypes = {
  list:   ()       => http.get('/payroll/shift-types').then(r => r.data.data),
  create: (d)      => http.post('/payroll/shift-types', d).then(r => r.data.data),
  update: (id, d)  => http.put(`/payroll/shift-types/${id}`, d).then(r => r.data.data),
  remove: (id)     => http.delete(`/payroll/shift-types/${id}`),
}

export const schedule = {
  list:       (year, month) => http.get('/payroll/schedule', { params: { year, month } }).then(r => r.data.data),
  upsert:     (d)           => http.post('/payroll/schedule', d).then(r => r.data.data),
  upsertBulk: (entries)     => http.post('/payroll/schedule/bulk', { entries }).then(r => r.data.data),
  remove:     (id)          => http.delete(`/payroll/schedule/${id}`),
}

export const holidays = {
  list:   (year) => http.get('/payroll/holidays', { params: { year } }).then(r => r.data.data),
  create: (d)    => http.post('/payroll/holidays', d).then(r => r.data.data),
  remove: (id)   => http.delete(`/payroll/holidays/${id}`),
}

export const periods = {
  list:           ()        => http.get('/payroll/periods').then(r => r.data.data),
  get:            (id)      => http.get(`/payroll/periods/${id}`).then(r => r.data.data),
  create:         (d)       => http.post('/payroll/periods', d).then(r => r.data.data),
  close:          (id)      => http.patch(`/payroll/periods/${id}/close`).then(r => r.data.data),
  reopen:         (id)      => http.patch(`/payroll/periods/${id}/reopen`).then(r => r.data.data),
  importSchedule: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return http.post(`/payroll/periods/${id}/import-schedule`, form).then(r => r.data.data)
  },
  scheduleGrid: (id) => http.get(`/payroll/periods/${id}/schedule-grid`).then(r => r.data.data),
}

export const payroll = {
  calculate: (periodId) => http.post('/payroll/calculate', { periodId }).then(r => r.data),
  records:   (periodId) => http.get('/payroll/records', { params: { period_id: periodId } }).then(r => r.data.data),
  record:    (id)       => http.get(`/payroll/records/${id}`).then(r => r.data.data),
  async export(periodId, format) {
    const ext = format === 'xlsx'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv'
    const res = await http.get('/payroll/export', {
      params: { period_id: periodId, format },
      responseType: 'blob',
    })
    const url  = URL.createObjectURL(new Blob([res.data], { type: ext }))
    const link = document.createElement('a')
    link.href  = url
    link.download = `nomina_${periodId}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  },
}

export const payrollSettings = {
  list:   ()         => http.get('/payroll/settings').then(r => r.data.data),
  update: (key, val) => http.put(`/payroll/settings/${key}`, { value: val }).then(r => r.data.data),
}

export const absenceTypes = {
  list:   ()        => http.get('/payroll/absence-types').then(r => r.data.data),
  create: (d)       => http.post('/payroll/absence-types', d).then(r => r.data.data),
  update: (id, d)   => http.put(`/payroll/absence-types/${id}`, d).then(r => r.data.data),
  remove: (id)      => http.delete(`/payroll/absence-types/${id}`),
}

export const absenceCodeCatalog = {
  list:   ()   => http.get('/payroll/absence-code-catalog').then(r => r.data.data),
  create: (d)  => http.post('/payroll/absence-code-catalog', d).then(r => r.data.data),
  remove: (id) => http.delete(`/payroll/absence-code-catalog/${id}`),
}

export const employees = {
  list:      ()         => http.get('/employees').then(r => r.data.data),
  get:       (id)       => http.get(`/employees/${id}`).then(r => r.data.data),
  create:    (d)        => http.post('/employees', d).then(r => r.data.data),
  update:    (id, d)    => http.put(`/employees/${id}`, d).then(r => r.data.data),
  setStatus: (id, status) => http.patch(`/employees/${id}/status`, { status }).then(r => r.data.data),
}
