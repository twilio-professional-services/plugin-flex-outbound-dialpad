import React from "react";
import DialPadLauncher from "./DialPadLauncher";

export function loadDialPadInterface(flex) {
	flex.MainHeader.Content.add(
		<DialPadLauncher
			key="sidebardialerbutton"
		/>,
		{
			sortOrder: 0,
			align: "end"
		}
	)
}
