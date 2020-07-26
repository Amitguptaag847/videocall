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
    notice: ""
  }

  constructor() {
    super();
    try {
      this.socket = null;
      this.peer = null;
      this.peersRef = [];
      this.callPeer = this.callPeer.bind(this);
      this.rejectCall = this.rejectCall.bind(this);
      this.switchMainVideo = this.switchMainVideo.bind(this);
    } catch (e) {
      console.log(e);
    }
  }

  componentDidMount() {
    this.socket = io.connect("http://localhost:5000/", {  //"https://videocall-1.herokuapp.com/"
      transports: ['websocket'],
      upgrade: false
    });
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      this.setState({
        ...this.state,
        stream: stream,
        mainStream: stream
      });
    }).catch(err => console.log(err));

    window.addEventListener("beforeunload", (ev) => {
      ev.preventDefault();
      this.disconnectCall();
      window.close();
    });

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
      if (!this.state.callAccepted && !this.state.showIncoming) {
        this.setState({
          ...this.state,
          caller: data.from,
          callerSignal: data.signal,
          showIncoming: true
        });
      } else if ((this.state.callAccepted || this.state.showIncoming) && data.from !== this.state.caller) {
        this.socket.emit("disconnectCall", { to: data.from, message: "User is busy on another call" });
      }
    });

    this.socket.on("callAccepted", data => {
      this.setState({
        ...this.state,
        callAccepted: true,
        showDisconnect: true,
        callerSignal: data.signal
      });
      const item = this.peersRef.find(p => p.peerID === data.id);
      if (item) {
        item.peer.signal(this.state.callerSignal);
      }
    });

    this.socket.on("callDisconnect", data => {
      if (this.peer) {
        this.peer.destroy();
      }
      const item = this.peersRef.find(p => p.peerID === this.state.caller);
      if (item) {
        const index = this.peersRef.indexOf(item);
        this.peersRef.splice(index, 1);
      }
      this.setState({
        ...this.state,
        callAccepted: false,
        showDisconnect: false,
        showIncoming: false,
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

  createPeer = (id) => {
    const p = new Peer({
      initiator: true,
      trickle: false,
      stream: this.state.stream,
    });

    p.on("signal", data => {
      this.socket.emit("callUser", { userToCall: id, signalData: data, from: this.state.yourId });
      this.setState({
        ...this.state,
        caller: id
      });
    });

    p.on("stream", stream => {
      this.setState({
        ...this.state,
        incomingStream: stream
      });
    });

    return p;
  }

  callPeer = (id) => {
    if (this.state.caller === "") {
      const pr = this.createPeer(id);
      this.peersRef.push({
        peerID: id,
        peer: pr,
      });
    } else {
      this.setState({
        ...this.state,
        notice: "You cant call someone while on another call"
      });
      this.hideNotice();
    }
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
    this.socket.emit("disconnectCall", { to: this.state.caller, message: msg });
    this.setState({
      ...this.state,
      caller: "",
      callAccepted: false,
      showDisconnect: false,
      showIncoming: false,
      callerSignal: null,
      incomingStream: null
    });
  }

  disconnectCall = () => {
    if (this.peer) {
      this.peer.destroy();
    }
    const item = this.peersRef.find(p => p.peerID === this.state.caller);
    if (item) {
      item.peer.signal(this.state.callerSignal);
      const index = this.peersRef.indexOf(item);
      this.peersRef.splice(index, 1);
    }
    this.switchMainVideo(1);
    this.rejectCall("Call Disconnected");
  }

  switchMainVideo = (num) => {
    if (num === 1) {
      this.setState({
        ...this.state,
        mainStream: this.state.stream
      });
    } else if (num === 2) {
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

