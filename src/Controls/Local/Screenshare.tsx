import React, { useContext } from 'react'
import RtcContext from '../../RtcContext'
import BtnTemplate from '../BtnTemplate'
import PropsContext from '../../PropsContext'

function Screenshare() {
  const { styleProps } = useContext(PropsContext)
  const { localBtnStyles } = styleProps || {}
  const { screenshare } = localBtnStyles || {}
  const { toggleScreensharing, isScreensharing } = useContext(RtcContext)

  return (
    <div>
      <BtnTemplate
        style={screenshare}
        name={isScreensharing ? 'stop' : 'screen'}
        data-role='agora-screen-share'
        data-custom-state={isScreensharing ? 'enabled' : 'disabled'}
        onClick={() => toggleScreensharing()}
      />
    </div>
  )
}

export default Screenshare
