exports.handler = async function (context, event, callback) {

	console.log("callhandler for: ", event.CallSid);
	console.log("worker:", event.workerContactUri);
	console.log("to:", event.To);
	console.log("workflowSid:", context.TWILIO_WORKFLOW_SID);

	let customAttributes = {};
	try {
		customAttributes = JSON.parse(event.attributes);
	} catch (e) { }

	const taskAttributes = Object.assign({
		targetWorker: event.workerContactUri,
		autoAnswer: "true",
		type: "outbound",
		direction: "outbound",
		name: event.To
	}, customAttributes);

	console.log('attributes: ', taskAttributes);

	const twiml = new Twilio.twiml.VoiceResponse();
	const enqueue = twiml.enqueue({
		workflowSid: `${context.TWILIO_WORKFLOW_SID}`
	});

	enqueue.task(JSON.stringify(taskAttributes));
	callback(null, twiml);
}

