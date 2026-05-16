import axios from 'axios'
const http = axios.create({ baseURL: import.meta.env.VITE_API_URL })
http.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = 'Bearer ' + token
  return cfg
})
http.interceptors.response.use(
  res => res,
  err => {
    console.error('[API Error]', err.config?.method?.toUpperCase(), err.config?.url, '→', err.response?.status, err.response?.data)
    return Promise.reject(err)
  }
)
export async function dispatch(command, payload) {
  const { data } = await http.post('/commands', { command, payload })
  return data
}
export default http
