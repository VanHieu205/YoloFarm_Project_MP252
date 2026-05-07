import axiosClient from './axiosClient'

// GET ALL
export const getAutomations = async () => {
  const response = await axiosClient.get(
    '/api/automation'
  )

  return response.data
}

// UPDATE STATUS
export const updateAutomationStatus = async (
  id,
  status
) => {
  const response = await axiosClient.put(
    `/api/automation/${id}`,
    {
      status,
    }
  )

  return response.data
}

// DELETE
export const deleteAutomation = async (id) => {
  const response = await axiosClient.delete(
    `/api/automation/${id}`
  )

  return response.data
}
