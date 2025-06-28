import AgoraRTC, { IMicrophoneAudioTrack } from 'agora-rtc-react'

let currentMicrophoneDeviceId: string | null = null

// Initialize from localStorage
if (typeof window !== 'undefined') {
  currentMicrophoneDeviceId = localStorage.getItem('selectedMicrophone')
}

export const setGlobalMicrophoneDevice = (deviceId: string) => {
  currentMicrophoneDeviceId = deviceId
}

export const getGlobalMicrophoneDevice = () => {
  return currentMicrophoneDeviceId
}

export const applyMicrophoneDevice = async (
  track: IMicrophoneAudioTrack
) => {
  if (currentMicrophoneDeviceId) {
    try {
      await track.setDevice(currentMicrophoneDeviceId)
      console.log(`Applied microphone device: ${currentMicrophoneDeviceId}`)
    } catch (error) {
      console.log('Failed to set microphone device:', error)
    }
  }
}

// Check if current microphone device is still available
export const isCurrentMicrophoneAvailable = async (): Promise<boolean> => {
  if (!currentMicrophoneDeviceId) return true

  try {
    const availableDevices = await AgoraRTC.getMicrophones()
    return availableDevices.some(
      (device) => device.deviceId === currentMicrophoneDeviceId
    )
  } catch (error) {
    console.log('Failed to check microphone availability:', error)
    return false
  }
}

// Get the device info for current microphone
export const getCurrentMicrophoneInfo = async (): Promise<MediaDeviceInfo | null> => {
  if (!currentMicrophoneDeviceId) return null

  try {
    const availableDevices = await AgoraRTC.getMicrophones()
    return availableDevices.find(
      (device) => device.deviceId === currentMicrophoneDeviceId
    ) || null
  } catch (error) {
    console.log('Failed to get microphone info:', error)
    return null
  }
}

// Switch to first available microphone
export const switchToAvailableMicrophone = async (): Promise<string | null> => {
  try {
    const availableDevices = await AgoraRTC.getMicrophones()

    if (availableDevices.length > 0) {
      const newDeviceId = availableDevices[0].deviceId
      setGlobalMicrophoneDevice(newDeviceId)
      localStorage.setItem('selectedMicrophone', newDeviceId)

      // Dispatch event to notify components
      window.dispatchEvent(
        new CustomEvent('microphoneDeviceChanged', {
          detail: {
            deviceId: newDeviceId,
            automatic: true,
            reason: 'device_disconnected'
          }
        })
      )

      console.log(
        `Automatically switched to microphone: ${
          availableDevices[0].label || newDeviceId
        }`
      )
      return newDeviceId
    }
  } catch (error) {
    console.log('Failed to switch to available microphone:', error)
  }

  return null
}

// Check if a specific device exists in available devices
export const findMicrophoneByLabel = async (label: string): Promise<MediaDeviceInfo | null> => {
  try {
    const availableDevices = await AgoraRTC.getMicrophones()
    return availableDevices.find(device => device.label === label) || null
  } catch (error) {
    console.log('Failed to find microphone by label:', error)
    return null
  }
}

// Listen for microphone device changes
if (typeof window !== 'undefined') {
  window.addEventListener('microphoneDeviceChanged', (event: any) => {
    if (!event.detail.automatic) {
      setGlobalMicrophoneDevice(event.detail.deviceId)
    }
  })
} 