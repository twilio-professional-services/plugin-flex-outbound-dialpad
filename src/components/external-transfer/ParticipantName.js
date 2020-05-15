import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'react-emotion';
import { Manager, withTheme } from '@twilio/flex-ui';
import { FUNCTIONS_HOSTNAME } from "../../OutboundDialingWithConferencePlugin";

const Name = styled('div')`
  font-size: 14px;
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NameListItem = styled('div')`
  font-size: 12px;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class ParticipantName extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: ''
    };
  }

  componentDidMount() {
    const { participant, task } = this.props;
    const { callSid } = participant;

    if (participant.participantType === 'customer') {
      this.setState({ name: task.attributes.name });
      return;
    }

    const manager = Manager.getInstance();
    const token = manager.user.token;

    const getCallPropertiesUrl = (
      `https://${FUNCTIONS_HOSTNAME}/external-transfer/get-call-properties`
    );
    fetch(getCallPropertiesUrl, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: (
        `Token=${encodeURIComponent(token)}`
        + `&callSid=${encodeURIComponent(callSid)}`
      )
    }).then(response => response.json())
      .then(json => {
        if (json) {
          const name = (json && json.to) || '';
          this.setState({ name });
        }
      });
  }

  render() {
    return this.props.listMode
      ? (
        <NameListItem className="ParticipantCanvas-Name">
          {this.state.name}
        </NameListItem>
      ) : (
        <Name className="ParticipantCanvas-Name">
          {this.state.name}
        </Name>
      );
  }
}

ParticipantName.propTypes = {
  participant: PropTypes.object,
  task: PropTypes.object,
  listMode: PropTypes.bool,
};

const mapStateToProps = state => {
  const { serviceBaseUrl } = state.flex.config;

  return {
    serviceBaseUrl,
  }
};

export default connect(mapStateToProps)(withTheme(ParticipantName));
