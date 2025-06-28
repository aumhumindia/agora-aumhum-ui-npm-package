import AgoraRTC, { ICameraVideoTrack } from 'agora-rtc-react'

let currentCameraDeviceId: string | null = null

// Initialize from localStorage
if (typeof window !== 'undefined') {
  currentCameraDeviceId = localStorage.getItem('selectedCamera')
}

export const setGlobalCameraDevice = (deviceId: string) => {
  currentCameraDeviceId = deviceId
}

export const getGlobalCameraDevice = () => {
  return currentCameraDeviceId
}

export const applyCameraDevice = async (track: ICameraVideoTrack) => {
  if (currentCameraDeviceId) {
    try {
      await track.setDevice(currentCameraDeviceId)
      console.log(`Applied camera device: ${currentCameraDeviceId}`)
    } catch (error) {
      console.log('Failed to set camera device:', error)
    }
  }
}

// Check if current camera device is still available
export const isCurrentCameraAvailable = async (): Promise<boolean> => {
  if (!currentCameraDeviceId) return true

  try {
    const availableDevices = await AgoraRTC.getCameras()
    return availableDevices.some(
      (device) => device.deviceId === currentCameraDeviceId
    )
  } catch (error) {
    console.log('Failed to check camera availability:', error)
    return false
  }
}

// Get the device info for current camera
export const getCurrentCameraInfo = async (): Promise<MediaDeviceInfo | null> => {
  if (!currentCameraDeviceId) return null

  try {
    const availableDevices = await AgoraRTC.getCameras()
    return (
      availableDevices.find(
        (device) => device.deviceId === currentCameraDeviceId
      ) || null
    )
  } catch (error) {
    console.log('Failed to get camera info:', error)
    return null
  }
}

// Switch to first available camera
export const switchToAvailableCamera = async (): Promise<string | null> => {
  try {
    const availableDevices = await AgoraRTC.getCameras()

    if (availableDevices.length > 0) {
      const newDeviceId = availableDevices[0].deviceId
      setGlobalCameraDevice(newDeviceId)
      localStorage.setItem('selectedCamera', newDeviceId)

      // Dispatch event to notify components
      window.dispatchEvent(
        new CustomEvent('cameraDeviceChanged', {
          detail: {
            deviceId: newDeviceId,
            automatic: true,
            reason: 'device_disconnected'
          }
        })
      )

      console.log(
        `Automatically switched to camera: ${
          availableDevices[0].label || newDeviceId
        }`
      )
      return newDeviceId
    }
  } catch (error) {
    console.log('Failed to switch to available camera:', error)
  }

  return null
}

// Check if a specific device exists in available devices
export const findCameraByLabel = async (
  label: string
): Promise<MediaDeviceInfo | null> => {
  try {
    const availableDevices = await AgoraRTC.getCameras()
    return availableDevices.find((device) => device.label === label) || null
  } catch (error) {
    console.log('Failed to find camera by label:', error)
    return null
  }
}

// Listen for camera device changes
if (typeof window !== 'undefined') {
  window.addEventListener('cameraDeviceChanged', (event: any) => {
    if (!event.detail.automatic) {
      setGlobalCameraDevice(event.detail.deviceId)
    }
  })
} 