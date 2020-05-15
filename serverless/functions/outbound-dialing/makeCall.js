const nodeFetch = require('node-fetch');
const TokenValidator = require('twilio-flex-token-validator').functionValidator;

async function getCallTreatment(context, event) {

	console.log('makeCall: Getting Call Treatment');

	const callTreatmentUrl = encodeURI(
		"https://" +
		event.functionsDomain +
		"/outbound-dialing/callTreatment?Token=" +
		event.Token +
		"&To=" +
		event.To
	);

	const fetchResponse = await nodeFetch(callTreatmentUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			To: event.To
		})
	});

	const callTreatmentResponse = await fetchResponse.json();
	console.log('makeCall: CallTreatmentResponse: ', callTreatmentResponse)
	return callTreatmentResponse.To;

}

function makeOutboundCall(context, event) {
	const client = context.getTwilioClient();

	return new Promise(async function (resolve, reject) {
		const callHandlerCallbackURL = encodeURI(
			"https://" +
			event.functionsDomain +
			"/outbound-dialing/callHandlerTwiml?workerContactUri=" +
			event.workerContactUri + "&attributes=" + event.attributes
		);

		const statusCallbackURL = encodeURI(
			"https://" +
			event.functionsDomain +
			"/outbound-dialing/callStatusUpdateHandler?workerSyncDoc=" +
			event.workerContactUri +
			".outbound-call" +
			"&workerSid=" +
			event.workerSid
		);

		const to = await getCallTreatment(context, event);

		client.calls
			.create({
				url: callHandlerCallbackURL,
				to: to,
				from: event.From,
				statusCallback: statusCallbackURL,
				statusCallbackEvent: ["ringing", "answered", "completed"]
			})
			.then(call => {
				console.log("makeCall: call created: ", call.sid);
				resolve({ call: call, error: null });
			})
			.catch(error => {
				console.log("makeCall: call creation failed");
				resolve({ call: null, error });
			});
	});
}

exports.handler = TokenValidator(async function (context, event, callback) {

	console.log("makeCall: makeCall request parameters:");
	console.log("makeCall: to:", event.To);
	console.log("makeCall: from:", event.From);
	console.log("makeCall: workerContactUri:", event.workerContactUri);
	console.log("makeCall: callbackDomain:", event.functionsDomain);
	console.log("makeCall: workerSid", event.workerSid);

	const response = new Twilio.Response();

	response.appendHeader('Access-Control-Allow-Origin', '*');
	response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
	response.appendHeader('Content-Type', 'application/json');
	response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

	const makeCallResult = await makeOutboundCall(context, event)
	if (makeCallResult.error) {
		response.setStatusCode(makeCallResult.error.status)
	}
	response.setBody(makeCallResult);

	callback(null, response);

});
