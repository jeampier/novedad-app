import http from './client'

const base = '/payroll/concepts'

export const conceptsApi = {
  list:            ()          => http.get(base).then(r => r.data),
  variables:       ()          => http.get(`${base}/variables`).then(r => r.data),
  create:          (data)      => http.post(base, data).then(r => r.data),
  update:          (id, data)  => http.put(`${base}/${id}`, data).then(r => r.data),
  remove:          (id)        => http.delete(`${base}/${id}`).then(r => r.data),
  validateFormula: (formula)   => http.post(`${base}/validate-formula`, { formula }).then(r => r.data),
  simulate:        (data)      => http.post(`${base}/simulate`, data).then(r => r.data),
  rules: {
    list:      (cid)           => http.get(`${base}/${cid}/rules`).then(r => r.data),
    create:    (cid, data)     => http.post(`${base}/${cid}/rules`, data).then(r => r.data),
    update:    (cid, rid, data)=> http.put(`${base}/${cid}/rules/${rid}`, data).then(r => r.data),
    remove:    (cid, rid)      => http.delete(`${base}/${cid}/rules/${rid}`).then(r => r.data),
    snapshots: (cid, rid)      => http.get(`${base}/${cid}/rules/${rid}/snapshots`).then(r => r.data),
  },
}
