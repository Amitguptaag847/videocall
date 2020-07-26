import React, { useRef } from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
import './Layout.css';

function Layout(props) {

    const mainVideo = useRef();
    const userVideo = useRef();
    const partnerVideo = useRef();

    if (userVideo.current) {
        userVideo.current.srcObject = props.stream;
    }
    if (partnerVideo.current) {
        partnerVideo.current.srcObject = props.incomingStream;
    }
    if (mainVideo.current) {
        mainVideo.current.srcObject = props.mainStream;
    }

    return (
        <div>
            <div className={props.notice === ""? "d-none":"notice"}>
            <Button variant="danger" size="sm" className="d-flex mx-auto" disabled> {props.notice} </Button>
            </div>
            <div className={props.showIncoming? "card-ctm": "d-none"}>
                <Card className="text-center d-block">
                    <Card.Header><small>Incoming Video Call</small></Card.Header>
                    <Card.Body>
                        <Card.Text><small>{props.caller !== ""? props.users[props.caller].name : ""} is Calling you</small></Card.Text>
                    </Card.Body>
                    <Card.Footer className="text-muted">
                        <Row>
                            <Col>
                                <Button variant="danger" size="sm" onClick={() => props.rejectCall("User is busy")} block> Reject </Button>
                            </Col>
                            <Col>
                                <Button variant="primary" size="sm" onClick={props.accept} block> Accept </Button>
                            </Col>
                        </Row>
                    </Card.Footer>
                </Card>
            </div>
            <Row className="justify-content-md-center">
                <Col lg={3}>
                    <Button variant="light" size="sm" block disabled><b>Your Name</b></Button>
                    <Button variant="info" size="sm" className="mb-3" block disabled><b>{props.name}</b></Button>
                    <Button variant="light" size="sm" block disabled><b>Active Users </b></Button>
                    {Object.keys(props.users).map(key => {
                        if (key === props.yourId) {
                            return null;
                        }
                        return (
                            <Button key={key} variant="info" size="sm" onClick={() => props.callUser(key)} block>Call {props.users[key].name}</Button>
                        );
                    })}
                </Col>
                <Col lg={6}>
                    <Row>
                        <Col>
                            <Row>
                                <Col>
                                    <video playsInline muted ref={mainVideo} autoPlay />
                                </Col>
                            </Row>
                            <Row className={props.showDisconnect? "": "d-none"}>
                                <Col className="d-flex justify-content-center">
                                    <Button variant="danger" size="sm" onClick={props.disconnectCall} > Disconnect </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col lg={2}>
                    <Row>
                        <Col>
                            <Button variant="warning" size="sm" className="mb-4" block disabled><b>You</b></Button>
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col onClick={() => props.switchMainVideo(1)} className="pointer">
                            <video playsInline muted ref={userVideo} autoPlay />
                        </Col>
                    </Row>
                    <Row className="mt-4">
                        <Col>
                            <Button variant="warning" size="sm" className="mb-4" block disabled><b>Other</b></Button>
                        </Col>
                    </Row>
                    <Row className="justify-content-md-center">
                        <Col onClick={() => props.switchMainVideo(2)} className="pointer">
                            <video playsInline ref={partnerVideo} autoPlay />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    )
}

export default Layout;