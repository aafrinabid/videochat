import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';
// import e, { json } from 'express';

const SocketContext = createContext();

// const socket = io('http://localhost:5000');
const socket = io('https://sleepy-sierra-81358.herokuapp.com/');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');
  const [offer,setOffer]=useState({})
  const [answer,setAnswer]=useState({})
  // console.log(offer)
console.log(call)

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);

        myVideo.current.srcObject = currentStream;
      });

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal });
    });
  }, []);

  // const answerCall = () => {
  //   setCallAccepted(true);

  //   const peer = new Peer({ initiator: false, trickle: false, stream });

  //   peer.on('signal', (data) => {
  //     socket.emit('answerCall', { signal: data, to: call.from });
  //   });

  //   peer.on('stream', (currentStream) => {
  //     console.log(currentStream,'to caller')
  //     userVideo.current.srcObject = currentStream;
  //   });
    const answerCall = () => {
      setCallAccepted(true);
      const rc=new RTCPeerConnection()
      // rc.onicecandidate=e=>{
      //   console.log('new ice kittiye')
      //   setAnswer(JSON.stringify(rc.localDescription))

      // }
      rc.ondatachannel=e=>{
        rc.dc=e.channel
        rc.dc.onmessage=e=>console.log('new message is here'+e.data)
        rc.dc.onopen=e=>console.log('connection OPENED')
      }

      rc.addEventListener('icegatheringstatechange',(ev)=>{
        let connection=ev.target;
        switch(connection.iceGatheringState){
          case 'gathering':
            console.log('gathering')
            break;
            case  'complete':
              rc.onicecandidate=e=>{
                console.log('new ice kittiye')
               const answer= rc.localDescription
               console.log(answer)
               socket.emit('answerCall',{signal:answer,to:call.from})        
              }
              break;
        }
      })
      console.log(call.signal)
      const offer=call.signal
    
      rc.setRemoteDescription(new RTCSessionDescription(offer)).then(e=>console.log('offer set'))
      rc.createAnswer().then(a=>rc.setLocalDescription(a)).then(a=>console.log('answer created')).catch(e=>e)

    //   const peer = new Peer({ initiator: false, trickle: false, stream });
  
    //   peer.on('signal', (data) => {
    //     socket.emit('answerCall', { signal: data, to: call.from });
    //   });
  
    //   peer.on('stream', (currentStream) => {
    //     console.log(currentStream,'to caller')
    //     userVideo.current.srcObject = currentStream;
    //   });

    // peer.signal(call.signal);
    // console.log(call.signal)

    // connectionRef.current = peer;
  };

  // const callUser = (id) => {
  //   const peer = new Peer({ initiator: true, trickle: false, stream });

  //   peer.on('signal', (data) => {
  //     socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
  //   });

  //   peer.on('stream', (currentStream) => {
  //     console.log(currentStream,'to other end reciever')
  //     userVideo.current.srcObject = currentStream;
  //   });

  //   socket.on('callAccepted', (signal) => {
  //     setCallAccepted(true);
  //     const sing='singjiii'

  //     peer.signal(signal);
  //   });

  //   connectionRef.current = peer;
  // };
  const callUser = (id) => {
     const localConnection=new RTCPeerConnection()
     let sdp
    //  localConnection.onicecandidate=e=>{
    //   console.log('NEW Ice candidtnant!! on Localconnection reprintinf sdp')
    //    setOffer(JSON.stringify(localConnection.localDescription))
    //  }
     const sendChannel=localConnection.createDataChannel('sendChannel')
     sendChannel.onmessage=e=>console.log('message recieved!!!'+e.data)
     sendChannel.onopen=e=>console.log('connection open')
      
     localConnection.createOffer().then(o=>localConnection.setLocalDescription(o)).then(a=>console.log(a,'setSuccesfully'))
    //  setTimeout(socketCon,10000)
    //  const socketCon=(id)=>{
      localConnection.addEventListener('icegatheringstatechange',(ev)=>{
        let connection=ev.target;
        switch(connection.iceGatheringState){
          case 'gathering':
            console.log('gathering')
            break;
            case  'complete':
              console.log('completeing')
              localConnection.onicecandidate=e=>{
                console.log('NEW Ice candidtnant!! on Localconnection reprintinf sdp')
                // setOffer(JSON.stringify(localConnection.localDescription))
                const offer=localConnection.localDescription
                socket.emit('callUser', { userToCall: id, signalData: offer, from: me, name })


               }

              break;
        }
      })
    //  }
    //  console.log(offer)
    // peer.on('signal', (data) => {
    //   socket.emit('callUser', { userToCall: id, signalData: data, from: me, name });
    // });

    // peer.on('stream', (currentStream) => {
    //   console.log(currentStream,'to other end reciever')
    //   userVideo.current.srcObject = currentStream;
    // });

    socket.on('callAccepted', (signal) => {
      localConnection.setRemoteDescription(signal)
      
      setCallAccepted(true);
      const sing='singjiii'

      // peer.signal(signal);
    });

    // connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);

    connectionRef.current.destroy();

    window.location.reload();
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };