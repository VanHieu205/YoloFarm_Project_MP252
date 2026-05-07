import axiosClient from './axiosClient'

const farmApi = {
  getCrops: async (userId) => {
    const response = await axiosClient.get(
      `/api/farm/crops?user_id=${userId}`
    )
    return response.data
  },

  createCrop: async (data) => {
    const response = await axiosClient.post(
      '/api/farm/crops',
      data
    )
    return response.data
  },

  updateCrop: async (cropId, data) => {
    const response = await axiosClient.put(
      `/api/farm/crops/${cropId}`,
      data
    )
    return response.data
  },

  deleteCrop: async (cropId) => {
    const response = await axiosClient.delete(
      `/api/farm/crops/${cropId}`
    )
    return response.data
  },
}

export default farmApi
