import AgoraRTC, { IRemoteAudioTrack, ILocalAudioTrack } from 'agora-rtc-react'

let currentPlaybackDeviceId: string | null = null

// Initialize from localStorage
if (typeof window !== 'undefined') {
  currentPlaybackDeviceId = localStorage.getItem('selectedPlayback')
}

export const setGlobalPlaybackDevice = (deviceId: string) => {
  currentPlaybackDeviceId = deviceId
}

export const getGlobalPlaybackDevice = () => {
  return currentPlaybackDeviceId
}

export const applyPlaybackDevice = async (
  track: IRemoteAudioTrack | ILocalAudioTrack
) => {
  if (currentPlaybackDeviceId && 'setPlaybackDevice' in track) {
    try {
      await (track as any).setPlaybackDevice(currentPlaybackDeviceId)
    } catch (error) {
      console.log('Failed to set playback device:', error)
    }
  }
}

// Check if current device is still available
export const isCurrentDeviceAvailable = async (): Promise<boolean> => {
  if (!currentPlaybackDeviceId) return true
  
  try {
    const availableDevices = await AgoraRTC.getPlaybackDevices()
    return availableDevices.some(device => device.deviceId === currentPlaybackDeviceId)
  } catch (error) {
    console.log('Failed to check device availability:', error)
    return false
  }
}

// Switch to first available device
export const switchToAvailableDevice = async (): Promise<string | null> => {
  try {
    const availableDevices = await AgoraRTC.getPlaybackDevices()
    
    if (availableDevices.length > 0) {
      const newDeviceId = availableDevices[0].deviceId
      setGlobalPlaybackDevice(newDeviceId)
      localStorage.setItem('selectedPlayback', newDeviceId)
      
      // Dispatch event to notify components
      window.dispatchEvent(
        new CustomEvent('playbackDeviceChanged', {
          detail: { 
            deviceId: newDeviceId,
            automatic: true // Flag to indicate this was automatic
          }
        })
      )
      
      console.log(`Automatically switched to device: ${availableDevices[0].label || newDeviceId}`)
      return newDeviceId
    }
  } catch (error) {
    console.log('Failed to switch to available device:', error)
  }
  
  return null
}

// Listen for playback device changes
if (typeof window !== 'undefined') {
  window.addEventListener('playbackDeviceChanged', (event: any) => {
    if (!event.detail.automatic) {
      setGlobalPlaybackDevice(event.detail.deviceId)
    }
  })
} 