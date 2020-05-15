import { Manager } from "@twilio/flex-ui";
import {
	FUNCTIONS_HOSTNAME,
	DEFAULT_FROM_NUMBER,
	SYNC_CLIENT
} from "../OutboundDialingWithConferencePlugin"

class CallControlsClass {
	makeCall(to, fromOverride, attributes) {
		const manager = Manager.getInstance();
		const workerPhoneNumber = manager.workerClient.attributes.phone;
		const workerContactUri = manager.workerClient.attributes.contact_uri;
		const workerSid = manager.workerClient.sid;
		const token = manager.user.token;

		const from = fromOverride || workerPhoneNumber ? workerPhoneNumber : DEFAULT_FROM_NUMBER;

		const makeCallURL = `https://${FUNCTIONS_HOSTNAME}/outbound-dialing/makeCall`
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded'
		}

		const body = (
			`Token=${encodeURIComponent(token)}`
			+ `&To=${encodeURIComponent(to)}`
			+ `&From=${encodeURIComponent(from)}`
			+ `&workerContactUri=${encodeURIComponent(workerContactUri)}`
			+ `&functionsDomain=${encodeURIComponent(FUNCTIONS_HOSTNAME)}`
			+ `&workerSid=${encodeURIComponent(workerSid)}`
			+ `&attributes=${encodeURIComponent(JSON.stringify(attributes))}`
		)

		console.log("OUTBOUND DIALPAD: Making remote request to dial: ", to);
		return new Promise(resolve => {
			fetch(makeCallURL, {
				headers,
				method: 'POST',
				body
			})
				.then(response => response.json())
				.then(json => {
					resolve(json);
				})
				.catch(x => {
					let error_message = (x instanceof TypeError) ? "Backend not available" : x.message
					resolve({ error: { message: error_message } })
				})

		})
	}

	hangupCall(CallSid) {

		const manager = Manager.getInstance();
		const token = manager.user.token;

		const endCallURL = `https://${FUNCTIONS_HOSTNAME}/outbound-dialing/endCall`
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
		const body = (
			`Token=${token}`
			+ `&CallSid=${CallSid}`
		)

		return new Promise((resolve) => {

			fetch(endCallURL, {
				headers,
				method: 'POST',
				body
			})
				.then(response => response.json())
				.then(json => {
					resolve(json);
				})
				.catch(x => {
					let error_message = (x instanceof TypeError) ? "Backend not available" : x.message
					resolve({ error: { message: error_message } })
				})
		})
	}

}


class CallStatusClass {

	isExceptionState(call) {
		return (call && (
			call.callStatus === "failed" ||
			call.callStatus === "busy" ||
			call.callStatus === "no-answer")) ? true : false
	}

	isTerminalState(call) {
		return (call && (call.callStatus === "completed" ||
			call.callStatus === "canceled" ||
			this.isExceptionState(call))) ? true : false
	}

	// canDial includes an empty callStatus and is distinct with isTermanlState
	// isTerminalState is used to determine if syncDoc should be updated
	// it needs to exclude the end state or it will peruputally update itself
	canDial(call) {
		return (call && (this.isTerminalState(call) ||
			call.callStatus === "")) ? true : false
	}

	isRinging(call) {
		return (call && call.callStatus === "ringing") ? true : false
	}

	isAnswered(call) {
		return (call && call.callStatus === "in-progress") ? true : false
	}

	// You cant close the dialpad after a call is started and before
	// the call is answered or terminated
	isCloseable(call) {
		return (!call || (call.callStatus !== "dialing" &&
			call.callStatus !== "queued" &&
			call.callStatus !== "ringing")) ? true : false
	}

	showGreenButton(call, activeCall) {
		return (!call || (call.callStatus !== "queued" &&
			call.callStatus !== "ringing" && activeCall === "")) ? true : false
	}

	showRedButton(call) {
		return (call && (call.callStatus === "queued" || call.callStatus === "ringing")) ? true : false
	}

}

class RingingServiceClass {
	constructor() {
		this.ringSound = new Audio('https://assets.flex.twilio.com/assets/audio/uplifting-ring-3.wav');
		this.ringSound.loop = true;
		this.ringSound.volume = 0.5;
		this.ringSound.pause();
	}

	startRinging() {
		console.log("OUTBOUND DIALPAD: Start Ringing Executing");
		this.ringSound.play();
	}

	stopRinging() {
		console.log("OUTBOUND DIALPAD: Stop Ringing executing");
		this.ringSound.pause();
	}
}

class DialpadSyncDocClass {
	constructor() {
		const manager = Manager.getInstance();
		const workerContactUri = manager.workerClient.attributes.contact_uri;
		this.syncDocName = `${workerContactUri}.outbound-call`;
	}

	getDialpadSyncDoc() {
		return new Promise(resolve => {
			SYNC_CLIENT
				.document(this.syncDocName)
				.then(doc => {
					resolve(doc)
				})
		})
	}

	clearSyncDoc() {
		SYNC_CLIENT
			.document(this.syncDocName)
			.then(doc => {
				doc.update({
					call: { callSid: "", callStatus: "" },
					numberToDial: "",
					autoDial: false
				});
			})
	}

	forceUpdateStatus(callSid) {

		const manager = Manager.getInstance();
		const token = manager.user.token;

		const endCallURL = `https://${FUNCTIONS_HOSTNAME}/outbound-dialing/forceUpdateSyncDoc`
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
		const body = (
			`Token=${encodeURIComponent(token)}`
			+ `&callSid=${encodeURIComponent(callSid)}`
			+ `&syncDocName=${encodeURIComponent(this.syncDocName)}`
		)

		return new Promise((resolve) => {

			fetch(endCallURL, {
				headers,
				method: 'POST',
				body
			})
				.then(response => response.json())
				.then(json => {
					resolve(json);
				})
				.catch(x => {
					let error_message = (x instanceof TypeError) ? "Backend not available" : x.message
					resolve({ error: { message: error_message } })
				})
		})
	}

	removeAutoDial() {
		SYNC_CLIENT
			.document(this.syncDocName)
			.then(doc => {
				doc.update({ "autoDial": false });
			})
	}
}

export const CallStatus = new CallStatusClass();
export const RingingService = new RingingServiceClass();
export const DialpadSyncDoc = new DialpadSyncDocClass();
export const CallControls = new CallControlsClass()
