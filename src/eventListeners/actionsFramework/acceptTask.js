import { Actions, StateHelper } from "@twilio/flex-ui";

export function registerAcceptTaskExtensions() {
    Actions.replaceAction('AcceptTask', (payload, original) => {
    console.log("ACCEPT TASK: ", payload);
    const task = payload.task;

    // handle calls from twilio clients "client:<name>"
    if (task.attributes.to === "") {
      payload.conferenceOptions.from = task.attributes.from;
    }

    // handle outbound calls
    if (
      task.attributes.type === "outbound" &&
      task.taskChannelUniqueName === "voice"
    ) {
      payload.conferenceOptions.from = task.attributes.from;
    }

    const reservation = StateHelper.getReservation(task.sid);
    if (!reservation) {
      throw new Error(`Reservation not found for task ${task.sid}`);
    }

    original(payload);
  });
}
