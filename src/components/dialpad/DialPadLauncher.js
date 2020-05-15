import * as React from "react";

import { IconButton, Notifications, Actions } from "@twilio/flex-ui";
import Dialog from "@material-ui/core/Dialog";
import PropTypes from "prop-types";
import DialPad from "./DialPad";
import Close from "@material-ui/icons/Close";
import styled from "react-emotion";
import { withStyles } from "@material-ui/core/styles";
import { CallStatus, RingingService, DialpadSyncDoc } from '../../utilities/DialPadUtil'
import { unblockForOutBoundCall } from "../../eventListeners/workerClient/reservationCreated";

const StyledDialog = withStyles({
  root: {
    width: "100%"
  }
})(({ classes, ...other }) => <Dialog className={classes.root} {...other} />);


class DialPadDialog extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      autoDial: false,
      numberToDial: "",
      call: { callSid: "", callStatus: "" }
    };

    this.setCallState = this.setCallState.bind(this);
    this.setNumberState = this.setNumberState.bind(this);
    this.setInitialActivity = this.setInitialActivity.bind(this);
  }



  componentDidMount() {
    console.log("OUTBOUND DIALPAD: Mounting DialPadLauncher v1.3.0");
    this.initSyncListener();
  }

  componentWillUnmount() {
    console.log("OUTBOUND DIALPAD: Unmounting DialPadLauncher");
  }

  setInitialActivity(activity) {
    this.initialActivity = activity
    console.log("OUTBOUND DIALPAD: Initial activity when dialpad launched", this.initialActivity);
  }

  initSyncListener() {

    const { openDialpad } = this.props;

    DialpadSyncDoc.getDialpadSyncDoc()
      .then(doc => {

        console.log("OUTBOUND DIALPAD: Initial Sync Doc State: ", doc.value);

        //forcing update incase call status event callback has somehow 
        //failed to update sync doc
        if (doc.value && doc.value.call && doc.value.call.callSid) {
          console.log("OUTBOUND DIALPAD: forcing update of sync doc for initial setup");
          DialpadSyncDoc.forceUpdateStatus(doc.value.call.callSid);
        }

        // map and respond to sync doc state upon load
        this.setState(doc.value)
        this.processCallStatus()

        //add listener and handler for doc changes
        doc.on("updated", updatedDoc => {
          console.log("OUTBOUND DIALPAD: Sync Doc Update Recieved: ", updatedDoc.value);
          this.setState(updatedDoc.value)
          if (updatedDoc.value.autoDial) {
            openDialpad();
          }
          this.processCallStatus();

        })

      })
  }

  setAgentAvailable() {
    return new Promise((resolve, reject) => {
      Actions.invokeAction("SetActivity", {
        activityName: "Available"
      })
        .then(() => {
          console.log("OUTBOUND DIALPAD: Agent is now Available");
          resolve();
        })
        .catch(e => {
          console.log('OUTBOUND DIALPAD: Exception setting available', e);

          Actions.invokeAction("SetActivity", {
            activityName: "Idle"
          })
            .then(() => {
              console.log("OUTBOUND DIALPAD: Agent is now Idle");
              resolve();
            })
            .catch(() => {
              Notifications.showNotification("ActivityStateUnavailable", {
                state1: "Available",
                state2: "Idle"
              });
              reject();
            });
        });
    })
  }

  processCallStatus() {
    const { call } = this.state;
    const { openDialpad, closeDialpad } = this.props;

    if (CallStatus.isRinging(call)) {
      console.log("OUTBOUND DIALPAD: Call Status Update Ringing State");
      // this ensures the dialpad is opened if the page is refreshed
      openDialpad();
      RingingService.startRinging();
    } else if (CallStatus.isAnswered(call)) {
      console.log("OUTBOUND DIALPAD: Call Status Update Answered State");
      // The agent will be pushed into available
      // by function handling the call status change
      // "in-progress" - this is just to reset the sync doc
      RingingService.stopRinging();
      // sets agent availble and closes dialpad without resetting state for blocking inbound calls - this will be hanlded by the reservationCreated event handler
      this.setAgentAvailable().then(() => closeDialpad()).catch(() => closeDialpad());
    } else if (CallStatus.isTerminalState(call)) {
      console.log("OUTBOUND DIALPAD: Call Status Update Terminal State");
      if (CallStatus.isExceptionState(call)) {
        Notifications.showNotification("UnableToConnect", {
          message: call.callStatus
        });
      }
      // any termination state will reset the sync doc
      // and make sure the dialpad isnt ringing
      RingingService.stopRinging();
      DialpadSyncDoc.clearSyncDoc();

    }
  }

  // used to ensure dialpad popup can't be closed while making
  // an outbound call and when manually closed (instead of auto answering
  // call, the user returns to their previous activity
  handleClose() {
    const { call } = this.state;
    const { closeDialpad } = this.props;

    if (CallStatus.isCloseable(call)) {
      console.log("OUTBOUND DIALPAD: Returning to initial activity when dialpad launched", this.initialActivity);
      Actions.invokeAction("SetActivity", {
        activityName: this.initialActivity
      })
      unblockForOutBoundCall();
      closeDialpad();
    } else {
      Notifications.showNotification("CantCloseDialpad");
    }
  }

  // used to allow state updated from child component
  setCallState(callUpdate) {
    console.log("OUTBOUND DIALPAD: Call State updated from Dialpad Popup:", callUpdate.callStatus);

    this.setState({ call: callUpdate });
  }

  // used to allow state updated from child component
  setNumberState(numberUpdate) {
    console.log("OUTBOUND DIALPAD: Number State updated from Dialpad Popup");
    this.setState({ numberToDial: numberUpdate });
  }

  render() {
    return (
      <StyledDialog
        disableBackdropClick
        disableEscapeKeyDown
        onClose={this.handleClose}
        aria-labelledby="simple-dialog-title"
        maxWidth={"xs"}
        open={this.props.isOpen}
      >
        <CloseButton>
          {""}
          <Close
            onClick={() => {
              this.handleClose();
            }}
          />
          {""}
        </CloseButton>
        <DialPad
          key="dialpadModal"
          call={this.state.call}
          number={this.state.numberToDial}
          autoDial={this.state.autoDial}
          setCallState={this.setCallState}
          setNumberState={this.setNumberState}
          closeViewFunction={this.handleClose}
          setInitialActivity={this.setInitialActivity}
        />
      </StyledDialog>
    );
  }
}

DialPadDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  openDialpad: PropTypes.func.isRequired,
  closeDialpad: PropTypes.func.isRequired,
};

const CloseButton = styled("div")`
  cursor: pointer;
  position: absolute;
  top: 10px;
  left: 5px;
  color: white;
`;

export default class DialPadLauncher extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    };
  }

  openDialpad = () => {
    this.setState({
      isOpen: true
    });
  }

  closeDialpad = () => {
    this.setState({ isOpen: false });
  }

  render() {
    return (
      <React.Fragment>
        <IconButton
          {...this.props}
          icon="Call"
          iconActive="CallBold"
          onClick={() => this.openDialpad()}
        >
          Dialpad
        </IconButton>
        <DialPadDialog
          isOpen={this.state.isOpen}
          openDialpad={this.openDialpad}
          closeDialpad={this.closeDialpad}
        />
      </React.Fragment>
    );
  }
}
