import { useEffect, useRef } from 'react'
import AgoraRTC from 'agora-rtc-react'

interface DeviceState {
  camera: {
    deviceId: string | null
    label: string | null
  }
  microphone: {
    deviceId: string | null
    label: string | null
  }
  playback: {
    deviceId: string | null
    label: string | null
  }
}

interface UseDeviceAutoSwitchProps {
  enabled?: boolean
  interval?: number
}

export const useDeviceAutoSwitch = ({
  enabled = true,
  interval = 2000
}: UseDeviceAutoSwitchProps = {}) => {
  const deviceStateRef = useRef<DeviceState>({
    camera: { deviceId: null, label: null },
    microphone: { deviceId: null, label: null },
    playback: { deviceId: null, label: null }
  })

  // Initialize device states from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCamera = localStorage.getItem('selectedCamera')
      const savedMicrophone = localStorage.getItem('selectedMicrophone')
      const savedPlayback = localStorage.getItem('selectedPlayback')

      deviceStateRef.current.camera.deviceId = savedCamera
      deviceStateRef.current.microphone.deviceId = savedMicrophone
      deviceStateRef.current.playback.deviceId = savedPlayback
    }
  }, [])

  // Monitor and auto-switch devices
  useEffect(() => {
    if (!enabled) return

    const monitorDevices = async () => {
      try {
        // Get all available devices
        const [cameras, microphones, playbackDevices] = await Promise.all([
          AgoraRTC.getCameras().catch(() => []),
          AgoraRTC.getMicrophones().catch(() => []),
          AgoraRTC.getPlaybackDevices().catch(() => [])
        ])

        // Check camera devices
        await checkAndSwitchDevice({
          deviceType: 'camera',
          currentDeviceId: deviceStateRef.current.camera.deviceId,
          currentLabel: deviceStateRef.current.camera.label,
          availableDevices: cameras,
          eventName: 'cameraDeviceChanged',
          storageKey: 'selectedCamera'
        })

        // Check microphone devices
        await checkAndSwitchDevice({
          deviceType: 'microphone',
          currentDeviceId: deviceStateRef.current.microphone.deviceId,
          currentLabel: deviceStateRef.current.microphone.label,
          availableDevices: microphones,
          eventName: 'microphoneDeviceChanged',
          storageKey: 'selectedMicrophone'
        })

        // Check playback devices
        await checkAndSwitchDevice({
          deviceType: 'playback',
          currentDeviceId: deviceStateRef.current.playback.deviceId,
          currentLabel: deviceStateRef.current.playback.label,
          availableDevices: playbackDevices,
          eventName: 'playbackDeviceChanged',
          storageKey: 'selectedPlayback'
        })
      } catch (error) {
        console.log('Error monitoring devices:', error)
      }
    }

    const checkAndSwitchDevice = async ({
      deviceType,
      currentDeviceId,
      currentLabel,
      availableDevices,
      eventName,
      storageKey
    }: {
      deviceType: keyof DeviceState
      currentDeviceId: string | null
      currentLabel: string | null
      availableDevices: MediaDeviceInfo[]
      eventName: string
      storageKey: string
    }) => {
      if (!currentDeviceId) return

      // Check if current device still exists
      const currentDeviceStillExists = availableDevices.find(
        (device) => device.deviceId === currentDeviceId
      )

      if (!currentDeviceStillExists && availableDevices.length > 0) {
        let newDevice: MediaDeviceInfo | null = null

        // Try to find device by label first (handles reconnection with new ID)
        if (currentLabel) {
          newDevice = availableDevices.find(
            (device) => device.label === currentLabel
          ) || null
        }

        // If not found by label, use first available device
        if (!newDevice) {
          newDevice = availableDevices[0]
        }

        if (newDevice) {
          const isReconnection = currentLabel && newDevice.label === currentLabel
          const reason = isReconnection ? 'device_reconnected' : 'device_disconnected'

          // Update device state
          deviceStateRef.current[deviceType] = {
            deviceId: newDevice.deviceId,
            label: newDevice.label
          }

          // Update localStorage
          localStorage.setItem(storageKey, newDevice.deviceId)

          // Dispatch event
          window.dispatchEvent(
            new CustomEvent(eventName, {
              detail: {
                deviceId: newDevice.deviceId,
                label: newDevice.label,
                automatic: true,
                reason
              }
            })
          )

          console.log(
            `Auto-switched ${deviceType}: ${newDevice.label || newDevice.deviceId} (${reason})`
          )
        }
      }
    }

    // Start monitoring
    const intervalId = setInterval(monitorDevices, interval)

    // Run immediately
    monitorDevices()

    return () => clearInterval(intervalId)
  }, [enabled, interval])

  // Update device state when manual changes occur
  useEffect(() => {
    const handleDeviceChange = (eventName: string, deviceType: keyof DeviceState) => {
      return (event: any) => {
        if (!event.detail.automatic) {
          deviceStateRef.current[deviceType] = {
            deviceId: event.detail.deviceId,
            label: event.detail.label || null
          }
        }
      }
    }

    const cameraHandler = handleDeviceChange('cameraDeviceChanged', 'camera')
    const microphoneHandler = handleDeviceChange('microphoneDeviceChanged', 'microphone')
    const playbackHandler = handleDeviceChange('playbackDeviceChanged', 'playback')

    window.addEventListener('cameraDeviceChanged', cameraHandler)
    window.addEventListener('microphoneDeviceChanged', microphoneHandler)
    window.addEventListener('playbackDeviceChanged', playbackHandler)

    return () => {
      window.removeEventListener('cameraDeviceChanged', cameraHandler)
      window.removeEventListener('microphoneDeviceChanged', microphoneHandler)
      window.removeEventListener('playbackDeviceChanged', playbackHandler)
    }
  }, [])

  return {
    // Expose current device states (read-only)
    currentDevices: {
      camera: deviceStateRef.current.camera,
      microphone: deviceStateRef.current.microphone,
      playback: deviceStateRef.current.playback
    }
  }
} 