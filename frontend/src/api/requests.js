import http from './client'

const base = '/requests'

export const requestsApi = {
  list:       (params = {}) => http.get(base, { params }).then(r => r.data),
  get:        (id)          => http.get(`${base}/${id}`).then(r => r.data),
  create:     (d)           => http.post(base, d).then(r => r.data),
  approve:    (id, notes)   => http.put(`${base}/${id}/approve`, { notes }).then(r => r.data),
  reject:     (id, notes)   => http.put(`${base}/${id}/reject`,  { notes }).then(r => r.data),
  liquidate:  (id)          => http.put(`${base}/${id}/liquidate`).then(r => r.data),
}
