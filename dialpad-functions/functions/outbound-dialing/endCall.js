const nodeFetch = require('node-fetch');

async function getAuthentication(token, context) {

	console.log('Validating request token');

	const tokenValidationApi = `https://${context.ACCOUNT_SID}:${context.AUTH_TOKEN}@iam.twilio.com/v1/Accounts/${context.ACCOUNT_SID}/Tokens/validate`;

	const fetchResponse = await nodeFetch(tokenValidationApi, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			token
		})
	});

	const tokenResponse = await fetchResponse.json();
	return tokenResponse;
}

function hangupCall(context, event) {

	const client = context.getTwilioClient();
	return new Promise(function (resolve, reject) {
		client
			.calls(event.CallSid)
			.update({ status: "completed" })
			.then(call => {
				console.log("terminated call: ", call.sid);
				console.log("\tto: ", call.to);
				console.log("\tfrom: ", call.from);
				console.log("\tstatus: ", call.status.toString());
				resolve({ success: true, call: call });
			})
			.catch(error => {
				console.log("Failed to terminate call: ", data.callSid);
				console.log("\tERROR: ", error);

				resolve({ success: false, error: error });
			});
	});
}

exports.handler = async function (context, event, callback) {

	console.log("endCall for: ", event.CallSid);

	const response = new Twilio.Response();

	response.appendHeader('Access-Control-Allow-Origin', '*');
	response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS POST');
	response.appendHeader('Content-Type', 'application/json');
	response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

	const tokenResponse = await getAuthentication(event.token, context);
	if (tokenResponse.valid) {
		const hangupCallResult = await hangupCall(context, event)
		if (!hangupCallResult.success) {
			response.setStatusCode(500)
		}
		response.setBody(hangupCallResult)
		callback(null, response);
	} else {
		response.setStatusCode(401);
		response.setBody({
			status: 401,
			message: 'Your authentication token failed validation',
		});
		callback(null, response);
	}

}