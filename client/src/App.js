import React, { Component } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import Layout from './container/Layout';
import './App.css';

class App extends Component {

  state = {
    yourId: "",
    name: "",
    users: {},
    stream: null,
    incomingStream: null,
    mainStream: null,
    caller: "",
    callerSignal: null,
    callAccepted: false,
    showDisconnect: false,
    showIncoming: false,
    iCalled: false,
    notice: ""
  }

  constructor() {
    super();
    try {
      this.socket = null;
      this.peer = null;
      this.callPeer = this.callPeer.bind(this);
      this.rejectCall = this.rejectCall.bind(this);
      this.switchMainVideo = this.switchMainVideo.bind(this);
    } catch (e) {
      console.log(e);
    }
  }

  componentDidMount() {
    this.socket = io.connect("https://videocall-1.herokuapp.com/",{
        transports: ['websocket'], 
        upgrade: false
    });
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      this.setState({
        ...this.state,
        stream: stream,
        mainStream: stream
      });
    }).catch( err => console.log(err));

    this.socket.on("yourId", (user) => {
      this.setState({
        ...this.state,
        yourId: user.socketId,
        name: user.name
      });
    });

    this.socket.on("allUsers", (users) => {
      this.setState({
        ...this.state,
        users: users
      });
    });

    this.socket.on("incomingCall", (data) => {
      if(!this.state.callAccepted && !this.state.showIncoming) {
        this.setState({
          ...this.state,
          caller: data.from,
          callerSignal: data.signal,
          showIncoming: true
        });
      }
    });

    this.socket.on("callDisconnect", data => { 
      this.peer.destroy();
      this.setState({
        ...this.state,
        callAccepted: false,
        showDisconnect:false,
        showIncoming:false,
        caller: "",
        callerSignal: null,
        incomingStream: null,
        notice: data.message
      });
      this.switchMainVideo(1);
      this.hideNotice();
    });
  }

  hideNotice = () => {
    setTimeout(() => {
      this.setState({
        ...this.state,
        notice: ''
      });
    }, 5000);
  }

  callPeer = (id) => {
    this.peer = new Peer({
      initiator: true,
      trickle: false,
      stream: this.state.stream,
    });
    this.peer.on("signal", data => {
      console.log("callersignal");
      this.socket.emit("callUser", { userToCall: id, signalData: data, from: this.state.yourId });
      this.setState({
        ...this.state,
        caller: id,
        iCalled: true
      });
    });

    this.peer.on("stream", stream => {
      this.setState({
        ...this.state,
        incomingStream: stream
      });
    });

    this.socket.on("callAccepted", signal => {
      this.setState({
        ...this.state,
        callAccepted: true,
        showDisconnect: true,
        callerSignal: signal
      });
      this.peer.signal(this.state.callerSignal);
    });
  }

  acceptCall = () => {
    this.peer = new Peer({
      initiator: false,
      trickle: false,
      stream: this.state.stream
    });

    this.peer.on("signal", data => {
      this.socket.emit("acceptedCall", { signal: data, to: this.state.caller });
    });

    this.peer.on("stream", stream => {
      console.log("Call Stream");
      this.setState({
        ...this.state,
        incomingStream: stream,
        mainStream: stream,
        callAccepted: true,
        showDisconnect: true,
        showIncoming: false
      });
    });
    this.peer.signal(this.state.callerSignal);
  }

  rejectCall = (msg) => {
    console.log(this.state.caller);
    this.socket.emit("disconnectCall", { to: this.state.caller, message: msg });
    this.setState({
      ...this.state,
      callAccepted: false,
      showDisconnect:false,
      showIncoming:false,
      callerSignal: null,
      incomingStream: null
    });
  }

  disconnectCall = () => {
    this.peer.destroy();
    this.switchMainVideo(1);
    this.rejectCall("Call Disconnected");
  }

  switchMainVideo = (num) => {
    if(num === 1) {
      //console.log(1);
      this.setState({
        ...this.state,
        mainStream: this.state.stream
      });
    } else if(num === 2) {
      //console.log(2);
      this.setState({
        ...this.state,
        mainStream: this.state.incomingStream
      });
    }
  }

  render() {
    return (
      <div className="App">
        <Layout
          yourId={this.state.yourId} 
          name={this.state.name}
          users={this.state.users} 
          stream={this.state.stream} 
          incomingStream={this.state.incomingStream} 
          mainStream={this.state.mainStream}
          caller={this.state.caller}
          callerSignal={this.state.callerSignal} 
          callAccepted={this.state.callAccepted} 
          showDisconnect={this.state.showDisconnect} 
          showIncoming={this.state.showIncoming}
          notice={this.state.notice} 
          callUser={this.callPeer}
          accept={this.acceptCall}
          rejectCall={this.rejectCall}
          disconnectCall={this.disconnectCall}
          switchMainVideo={this.switchMainVideo}
        />
      </div>
    )
  }
}

export default App;

