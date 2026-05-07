import axiosClient from './axiosClient'

// GET ALL DEVICES
export const getDevices = () => {
  return axiosClient.get('/api/devices')
}

// UPDATE STATUS
export const updateDeviceStatus = (id, data) => {
  return axiosClient.put(`/api/devices/${id}`, data)
}
