import { IRemoteAudioTrack, ILocalAudioTrack } from 'agora-rtc-react'

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

// Listen for playback device changes
if (typeof window !== 'undefined') {
  window.addEventListener('playbackDeviceChanged', (event: any) => {
    setGlobalPlaybackDevice(event.detail.deviceId)
  })
} 