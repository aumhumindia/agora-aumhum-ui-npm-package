import React, { useContext } from 'react'
import PropsContext from '../../PropsContext'
// import RtcContext from '../../RtcContext'
import BtnTemplate from '../BtnTemplate'

function EndCall() {
  const { styleProps, callbacks } = useContext(PropsContext)
  const { localBtnStyles } = styleProps || {}
  const { endCall } = localBtnStyles || {}
  // const { dispatch } = useContext(RtcContext)

  return (
    <BtnTemplate
      style={endCall || { backgroundColor: '#eb5144', borderColor: '#fff' }}
      name='callEnd'
      data-role='agora-call-end'
      onClick={() => callbacks?.EndCall && callbacks.EndCall()}
    />
  )
}

export default EndCall
