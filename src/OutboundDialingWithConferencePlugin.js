import { FlexPlugin } from "flex-plugin";
import { SyncClient } from "twilio-sync";
import { Manager } from "@twilio/flex-ui";

//independent features
import { loadDialPadInterface } from "./components/dialpad"
import { loadExternalTransferInterface } from "./components/external-transfer"
import { CallControls } from './utilities/DialPadUtil'

// common libraries
import { registerReservationCreatedExtensions } from "./eventListeners/workerClient/reservationCreated";
import { registerActionExtensions } from "./eventListeners/actionsFramework"

import "./notifications/CustomNotifications";

const PLUGIN_NAME = "OutboundDialingWithConferencePlugin";

export const FUNCTIONS_HOSTNAME = process.env.REACT_APP_SERVERLESS_HOST;
export const DEFAULT_FROM_NUMBER = process.env.REACT_APP_FROM_NUMBER;
export const SYNC_CLIENT = new SyncClient(Manager.getInstance().user.token);

function tokenUpdateHandler() {

  console.log("OUTBOUND DIALPAD: Refreshing SYNC_CLIENT Token");

  const loginHandler = Manager.getInstance().store.getState().flex.session.loginHandler;

  const tokenInfo = loginHandler.getTokenInfo();
  const accessToken = tokenInfo.token;

  SYNC_CLIENT.updateToken(accessToken);
}


export default class OutboundDialingWithConferencePlugin extends FlexPlugin {
  constructor() {
    console.log('env', process.env);
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    const translationStrings = {
      DIALPADExternalTransferHoverOver: "Add Conference Participant",
      DIALPADExternalTransferPhoneNumberPopupHeader: "Enter phone number to add to the conference",
      DIALPADExternalTransferPhoneNumberPopupTitle: "Phone Number",
      DIALPADExternalTransferPhoneNumberPopupCancel: "Cancel",
      DIALPADExternalTransferPhoneNumberPopupDial: "Dial"
    }

    //add translationStrings into manager.strings, preserving anything thats already there - this allows language to be updated outside of updating this plugin
    manager.strings = { ...translationStrings, ...manager.strings }

    //Add listener to loginHandler to refresh token when it expires
    manager.store.getState().flex.session.loginHandler.on("tokenUpdated", tokenUpdateHandler);
    // Add custom extensions
    loadDialPadInterface.bind(this)(flex, manager);
    loadExternalTransferInterface.bind(this)(flex, manager)
    registerReservationCreatedExtensions(manager);
    registerActionExtensions();

    window.addEventListener('message', this.onMessage, false);
  }

  onMessage = e => {
    try {
      const data = JSON.parse(e.data);
      if (data.action && data.action == 'outbound_dial' && data.to) {
        CallControls.makeCall(data.to, data.from, data.attributes || {});
      }
    } catch (e) { }
  };
}
