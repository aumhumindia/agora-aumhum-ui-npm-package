import React, { CSSProperties, useEffect, useState } from 'react'
import AgoraUIKit, { layout } from 'agora-custom-ui'
import 'agora-custom-ui/dist/index.css'
import AgoraRTC from 'agora-rtc-react'

const App: React.FunctionComponent = () => {
  const [videocall, setVideocall] = useState(false)
  const [isHost, setHost] = useState(true)
  const [isPinned, setPinned] = useState(false)
  const [username, setUsername] = useState('')

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  )
  const [availableMicrophones, setAvailableMicrophones] = useState<
    MediaDeviceInfo[]
  >([])
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>()
  const [selectedMicrophone, setSelectedMicrophone] = useState<
    string | undefined
  >()

  async function checkAvailableDevices() {
    const cameras = await AgoraRTC.getCameras()
    const microphones = await AgoraRTC.getMicrophones()
    setAvailableCameras(cameras)
    setAvailableMicrophones(microphones)
    console.log(await AgoraRTC.getPlaybackDevices())
  }

  // let localTracks = {
  //   videoTrack: null,
  //   audioTrack: null
  // }

  // var mics = [] // all microphones devices you can use
  // var cams = [] // all cameras devices you can use
  // var currentMic // the microphone you are using
  // var currentCam // the camera you are using

  // let volumeAnimation

  // async function mediaDeviceTest() {
  //   ;[localTracks.audioTrack, localTracks.videoTrack] = await Promise.all([
  //     AgoraRTC.createMicrophoneAudioTrack({
  //       encoderConfig: 'music_standard'
  //     }),
  //     AgoraRTC.createCameraVideoTrack()
  //   ])

  //   // play local track on device detect dialog
  //   localTracks.videoTrack.play('pre-local-player')
  //   // localTracks.audioTrack.play();

  //   // get mics
  //   mics = await AgoraRTC.getMicrophones()
  //   currentMic = mics[0]
  //   // add all mics to a select dropdown
  //   // and keep 0 index item selected

  //   // get cameras
  //   cams = await AgoraRTC.getCameras()
  //   currentCam = cams[0]
  //   // add cameras added to select dropdown
  //   // and keep 0 index item selected
  //   // see what value and label will go here
  // }

  // async function switchCamera(label) {
  //   // change selected item in select dropdown and
  //   // switch device of local video track.
  //   await localTracks.videoTrack.setDevice(currentCam.deviceId)
  // }

  // async function switchMicrophone(label) {
  //   // change selected item in select dropdown and
  //   // switch device of local audio track.
  //   await localTracks.audioTrack.setDevice(currentMic.deviceId)
  // }

  // show real-time volume while adjusting device.
  // function setVolumeWave() {
  //   volumeAnimation = requestAnimationFrame(setVolumeWave)
  //   console.log(localTracks.audioTrack.getVolumeLevel() * 100 + '%')
  // }

  console.log(availableCameras)
  console.log(availableMicrophones)

  useEffect(() => {
    checkAvailableDevices()
  }, [])

  function toggleMic() {
    const micButton = document.querySelector(
      '[data-role="agora-mic"]'
    ) as HTMLElement
    if (micButton) {
      const micState = micButton.getAttribute('data-custom-state')
      console.log(`MIC WAS: ${micState}`)
      micButton.click()
      return true
    }
    console.warn('Mic button not found!')
    return false
  }

  function toggleCamera() {
    const cameraButton = document.querySelector(
      '[data-role="agora-camera"]'
    ) as HTMLElement
    if (cameraButton) {
      const cameraState = cameraButton.getAttribute('data-custom-state')
      console.log(`CAMERA WAS: ${cameraState}`)
      cameraButton.click()
      return true
    }
    console.warn('Camera button not found!')
    return false
  }

  return (
    <div style={styles.container}>
      <div style={styles.videoContainer}>
        <h1 style={styles.heading}>Agora React Web UI Kit</h1>
        {videocall ? (
          <>
            <div style={styles.nav}>
              <p style={{ fontSize: 20, width: 200 }}>
                You're {isHost ? 'a host' : 'an audience'}
              </p>
              <p style={{ fontSize: 20 }} onClick={toggleMic}>
                TOGGLE MIC
              </p>
              <p style={{ fontSize: 20 }} onClick={toggleCamera}>
                TOGGLE CAMERA
              </p>
              <p style={styles.btn} onClick={() => setHost(!isHost)}>
                Change Role
              </p>
              <p style={styles.btn} onClick={() => setPinned(!isPinned)}>
                Change Layout
              </p>
            </div>
            <AgoraUIKit
              rtcProps={{
                appId: 'a3f4e664cb01478fa5bef1fc5b878a72',
                channel: 'channel',
                // token: null, // add your token if using app in secured mode
                token:
                  '007eJxTYAj9lXAl3ffRphXRba/6WGI0PrhsfKO/c/sEP7a176YufmKlwJBonGaSamZmkpxkYGhibpGWaJqUmmaYlmyaZGFukWhutKz3UnpDICND2/oHTIwMEAjiszMkZyTm5aXmMDAAAI5vJAw=',
                role: isHost ? 'host' : 'audience',
                layout: isPinned ? layout.pin : layout.grid,
                enableScreensharing: true,
                enableAudio: false,
                enableVideo: false,
                cameraDeviceId: selectedCamera,
                microphoneDeviceId: selectedMicrophone,
                uid: 45977
              }}
              rtmProps={{
                username: username || 'user',
                displayUsername: true,
                showPopUpBeforeRemoteMute: false,
                isThisUserAllowedToMuteOthers: true
              }}
              callbacks={{
                EndCall: () => setVideocall(false)
              }}
            />
          </>
        ) : (
          <div style={styles.nav}>
            <input
              style={styles.input}
              placeholder='nickname'
              type='text'
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
              }}
            />
            <h3 style={styles.btn} onClick={() => setVideocall(true)}>
              Start Call
            </h3>
            <select onChange={(e) => setSelectedCamera(e.target.value)}>
              {availableCameras.map((item, index) => (
                <option key={index} value={item.deviceId}>
                  {item.label}
                </option>
              ))}
            </select>
            <select onChange={(e) => setSelectedMicrophone(e.target.value)}>
              {availableMicrophones.map((item, index) => (
                <option key={index} value={item.deviceId}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flex: 1,
    backgroundColor: '#007bff22'
  },
  heading: { textAlign: 'center' as const, marginBottom: 0 },
  videoContainer: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  } as CSSProperties,
  nav: { display: 'flex', justifyContent: 'space-around' },
  btn: {
    backgroundColor: '#007bff',
    cursor: 'pointer',
    borderRadius: 5,
    padding: '4px 8px',
    color: '#ffffff',
    fontSize: 20
  },
  input: { display: 'flex', height: 24, alignSelf: 'center' } as CSSProperties
}

export default App

// https://webdemo.agora.io/
