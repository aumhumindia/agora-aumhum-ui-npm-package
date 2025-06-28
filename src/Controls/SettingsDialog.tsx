import { DialogContent, DialogTitle } from '@mui/material'
import Dialog from '@mui/material/Dialog'
import AgoraRTC, {
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-react'
import React, { useContext, useEffect, useState } from 'react'
import TracksContext from '../TracksContext'

import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import {
  findMicrophoneByLabel
} from '../Utils/microphoneDeviceManager'

function SelectMenuCamera() {
  const [cameraDeviceId, setCameraDeviceId] = React.useState('')
  const [availableCameraDevices, setAvailableCameraDevices] = useState<
    MediaDeviceInfo[]
  >([])
  const { localVideoTrack } = useContext(TracksContext)

  useEffect(() => {
    async function setThingsUp() {
      const cams = await AgoraRTC.getCameras()
      setAvailableCameraDevices([...cams])
      const alreadySelectedDeviceId = cams?.find(
        (item) => item.label === localVideoTrack?.getTrackLabel()
      )?.deviceId
      const defaultCam = localStorage.getItem('selectedCamera')
      if (defaultCam) {
        setCameraDeviceId(defaultCam)
      } else if (alreadySelectedDeviceId) {
        setCameraDeviceId(alreadySelectedDeviceId)
        localStorage.setItem('selectedCamera', alreadySelectedDeviceId)
      }
    }
    setThingsUp()
  }, [])

  const handleChange = async (event: SelectChangeEvent) => {
    await (localVideoTrack as ICameraVideoTrack).setDevice(event.target.value)
    setCameraDeviceId(event.target.value as string)
  }

  return (
    <Box sx={{ marginTop: 5 }}>
      <FormControl fullWidth>
        <InputLabel id='demo-simple-select-label'>Change Camera</InputLabel>
        <Select
          labelId='demo-simple-select-label'
          id='demo-simple-select'
          value={cameraDeviceId}
          label='Change Camera'
          onChange={handleChange}
        >
          {availableCameraDevices?.map((cam) => (
            <MenuItem key={cam?.deviceId} value={cam?.deviceId}>
              {cam?.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

function SelectMenuMic() {
  const [micDeviceId, setMicDeviceId] = React.useState('')
  const [availableMicrophoneDevices, setAvailableMicrophoneDevices] = useState<
    MediaDeviceInfo[]
  >([])
  const { localAudioTrack } = useContext(TracksContext)
  const [previousLabel, setPreviousLabel] = React.useState<string>('')

  useEffect(() => {
    async function setThingsUp() {
      const mics = await AgoraRTC.getMicrophones()
      setAvailableMicrophoneDevices([...mics])
      const alreadySelectedDeviceId = mics?.find(
        (item) => item.label === localAudioTrack?.getTrackLabel()
      )?.deviceId
      const defaultMic = localStorage.getItem('selectedMicrophone')
      if (defaultMic) {
        setMicDeviceId(defaultMic)
        // Store the label of the selected device
        const selectedDevice = mics.find(m => m.deviceId === defaultMic)
        if (selectedDevice) {
          setPreviousLabel(selectedDevice.label)
        }
      } else if (alreadySelectedDeviceId) {
        setMicDeviceId(alreadySelectedDeviceId)
        localStorage.setItem('selectedMicrophone', alreadySelectedDeviceId)
        const selectedDevice = mics.find(m => m.deviceId === alreadySelectedDeviceId)
        if (selectedDevice) {
          setPreviousLabel(selectedDevice.label)
        }
      }
    }
    setThingsUp()
  }, [])

  // Monitor microphone device changes
  useEffect(() => {
    const monitorMicDevices = async () => {
      try {
        const currentDevices = await AgoraRTC.getMicrophones()
        const currentDeviceStillExists = currentDevices.find(
          device => device.deviceId === micDeviceId
        )

        // Check if the previous device (by label) has reconnected with a new ID
        if (!currentDeviceStillExists && previousLabel) {
          const reconnectedDevice = await findMicrophoneByLabel(previousLabel)
          if (reconnectedDevice && reconnectedDevice.deviceId !== micDeviceId) {
            console.log(`Microphone "${previousLabel}" reconnected with new ID`)
            
            // Update to the new device ID
            setMicDeviceId(reconnectedDevice.deviceId)
            localStorage.setItem('selectedMicrophone', reconnectedDevice.deviceId)
            
            // Apply the device to the local audio track
            if (localAudioTrack && 'setDevice' in localAudioTrack) {
              try {
                await (localAudioTrack as IMicrophoneAudioTrack).setDevice(reconnectedDevice.deviceId)
                console.log(`Re-applied microphone: ${previousLabel}`)
              } catch (error) {
                console.log('Failed to re-apply microphone device:', error)
              }
            }
            
            // Dispatch event to notify other components
            window.dispatchEvent(
              new CustomEvent('microphoneDeviceChanged', {
                detail: {
                  deviceId: reconnectedDevice.deviceId,
                  automatic: true,
                  reason: 'device_reconnected'
                }
              })
            )
          } else if (!reconnectedDevice && currentDevices.length > 0) {
            // Device is truly disconnected, switch to another available device
            console.log('Current microphone disconnected, auto-switching...')
            const newDeviceId = currentDevices[0].deviceId
            setMicDeviceId(newDeviceId)
            localStorage.setItem('selectedMicrophone', newDeviceId)
            setPreviousLabel(currentDevices[0].label)
            
            // Apply the device to the local audio track
            if (localAudioTrack && 'setDevice' in localAudioTrack) {
              try {
                await (localAudioTrack as IMicrophoneAudioTrack).setDevice(newDeviceId)
              } catch (error) {
                console.log('Failed to switch microphone device:', error)
              }
            }
            
            // Dispatch event
            window.dispatchEvent(
              new CustomEvent('microphoneDeviceChanged', {
                detail: {
                  deviceId: newDeviceId,
                  automatic: true,
                  reason: 'device_disconnected'
                }
              })
            )
            
            console.log(`Auto-switched to microphone: ${currentDevices[0].label || newDeviceId}`)
          }
        }

        // Update available devices list
        setAvailableMicrophoneDevices([...currentDevices])
      } catch (error) {
        console.log('Error monitoring microphone devices:', error)
      }
    }

    // Check devices every 2 seconds
    const interval = setInterval(monitorMicDevices, 2000)
    
    // Also check immediately
    monitorMicDevices()
    
    return () => clearInterval(interval)
  }, [micDeviceId, localAudioTrack, previousLabel])

  const handleChange = async (event: SelectChangeEvent) => {
    const newDeviceId = event.target.value as string
    await (localAudioTrack as IMicrophoneAudioTrack).setDevice(newDeviceId)
    setMicDeviceId(newDeviceId)
    localStorage.setItem('selectedMicrophone', newDeviceId)
    
    // Update the stored label
    const selectedDevice = availableMicrophoneDevices.find(m => m.deviceId === newDeviceId)
    if (selectedDevice) {
      setPreviousLabel(selectedDevice.label)
    }
    
    // Dispatch event
    window.dispatchEvent(
      new CustomEvent('microphoneDeviceChanged', {
        detail: {
          deviceId: newDeviceId,
          automatic: false
        }
      })
    )
  }

  return (
    <Box sx={{ marginTop: 5 }}>
      <FormControl fullWidth>
        <InputLabel id='demo-simple-select-label'>Change Microphone</InputLabel>
        <Select
          labelId='demo-simple-select-label'
          id='demo-simple-select'
          value={micDeviceId}
          label='Change Microphone'
          onChange={handleChange}
        >
          {availableMicrophoneDevices?.map((mic) => (
            <MenuItem key={mic?.deviceId} value={mic?.deviceId}>
              {mic?.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

function SelectMenuPlayback() {
  const [playbackDeviceId, setPlaybackDeviceId] = React.useState('')
  const [availablePlaybackDevices, setAvailablePlaybackDevices] = useState<
    MediaDeviceInfo[]
  >([])

  useEffect(() => {
    async function setThingsUp() {
      try {
        const playbackDevices = await AgoraRTC.getPlaybackDevices()
        setAvailablePlaybackDevices([...playbackDevices])

        const defaultPlayback = localStorage.getItem('selectedPlayback')
        if (defaultPlayback) {
          setPlaybackDeviceId(defaultPlayback)
        } else if (playbackDevices.length > 0) {
          // Set first device as default
          setPlaybackDeviceId(playbackDevices[0].deviceId)
          localStorage.setItem('selectedPlayback', playbackDevices[0].deviceId)
        }
      } catch (error) {
        console.log('Failed to get playback devices:', error)
      }
    }
    setThingsUp()
  }, [])

  // Monitor device changes and auto-switch if current device is disconnected
  useEffect(() => {
    const monitorDevices = async () => {
      try {
        const currentDevices = await AgoraRTC.getPlaybackDevices()
        const currentDeviceStillExists = currentDevices.find(
          device => device.deviceId === playbackDeviceId
        )

        // If current device is not found in available devices, switch automatically
        if (playbackDeviceId && !currentDeviceStillExists && currentDevices.length > 0) {
          console.log('Current playback device disconnected, auto-switching...')
          const newDeviceId = currentDevices[0].deviceId
          setPlaybackDeviceId(newDeviceId)
          localStorage.setItem('selectedPlayback', newDeviceId)
          
          // Dispatch event to update all audio tracks
          window.dispatchEvent(
            new CustomEvent('playbackDeviceChanged', {
              detail: { 
                deviceId: newDeviceId,
                automatic: true,
                reason: 'device_disconnected'
              }
            })
          )
          
          console.log(`Auto-switched to: ${currentDevices[0].label || newDeviceId}`)
        }

        // Update available devices list
        setAvailablePlaybackDevices([...currentDevices])
      } catch (error) {
        console.log('Error monitoring devices:', error)
      }
    }

    // Check devices every 2 seconds
    const interval = setInterval(monitorDevices, 2000)
    
    return () => clearInterval(interval)
  }, [playbackDeviceId])

  const handleChange = async (event: SelectChangeEvent) => {
    const newDeviceId = event.target.value as string
    setPlaybackDeviceId(newDeviceId)
    localStorage.setItem('selectedPlayback', newDeviceId)

    // Dispatch a custom event to notify other components
    window.dispatchEvent(
      new CustomEvent('playbackDeviceChanged', {
        detail: { 
          deviceId: newDeviceId,
          automatic: false 
        }
      })
    )
  }

  return (
    <Box sx={{ marginTop: 5 }}>
      <FormControl fullWidth>
        <InputLabel id='playback-select-label'>Change Speaker/Output</InputLabel>
        <Select
          labelId='playback-select-label'
          id='playback-select'
          value={playbackDeviceId}
          label='Change Speaker/Output'
          onChange={handleChange}
        >
          {availablePlaybackDevices?.map((device) => (
            <MenuItem key={device?.deviceId} value={device?.deviceId}>
              {device?.label || 'Default Speaker'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}

/// the component below is the main component

export interface SimpleDialogProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog(props: SimpleDialogProps) {
  const { onClose, open } = props

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent sx={{ minWidth: 350, maxWidth: 350 }}>
        <SelectMenuCamera />
        <SelectMenuMic />
        <SelectMenuPlayback />
      </DialogContent>
    </Dialog>
  )
}
