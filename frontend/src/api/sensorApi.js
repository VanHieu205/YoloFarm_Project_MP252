import axiosClient from './axiosClient'

const sensorApi = {
  getLatest: async () => {
    const response = await axiosClient.get('/api/sensors/latest')
    return response.data
  },

  getHistory: async (limit = 20) => {
    const response = await axiosClient.get(
      `/api/sensors/history?limit=${limit}`
    )
    return response.data
  },
}

export default sensorApi
