import * as React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styled from 'react-emotion';
import {
  withTheme,
  templates,
  Template
} from '@twilio/flex-ui';

const Status = styled('div')`
  font-size: 12px;
`;

const StatusListItem = styled('div')`
  font-size: 10px;
`;

class ParticipantStatus extends React.PureComponent {
  render() {
    const { participant } = this.props;
    let statusTemplate = templates.CallParticipantStatusLive;

    if (participant.onHold) {
      statusTemplate = templates.CallParticipantStatusOnHold;
    }
    if (participant.status === 'recently_left') {
      statusTemplate = templates.CallParticipantStatusLeft;
    }
    if (participant.connecting) {
      statusTemplate = templates.CallParticipantStatusConnecting;
    }
    if (this.props.showKickConfirmation) {
      statusTemplate = templates.CallParticipantStatusKickConfirmation;
    }

    return this.props.listMode
      ? (
        <StatusListItem className="ParticipantCanvas-Status">
          <Template source={statusTemplate} />
        </StatusListItem>
      ) : (
        <Status className="ParticipantCanvas-Status">
          <Template source={statusTemplate} />
        </Status>
      );
  }
}

ParticipantStatus.propTypes = {
  participant: PropTypes.object,
  listMode: PropTypes.bool,
  showKickConfirmation: PropTypes.bool,
};

const mapStateToProps = (state, ownProps) => {
  const { participant } = ownProps;
  const componentViewStates = state.flex.view.componentViewStates;
  const customParticipants = componentViewStates.customParticipants || {};
  const participantState = customParticipants[participant.callSid];

  return {
    showKickConfirmation: participantState && participantState.showKickConfirmation
  };
};

export default connect(mapStateToProps)(withTheme(ParticipantStatus));
