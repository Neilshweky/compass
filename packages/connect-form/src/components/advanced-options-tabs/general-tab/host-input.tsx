import { css } from '@emotion/css';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Label,
  Icon,
  IconButton,
  TextInput,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { UpdateConnectionFormField } from '../../../hooks/use-connect-form';
import { ConnectionFormError } from '../../../utils/connect-form-errors';
import { MARKABLE_FORM_FIELD_NAMES } from '../../../constants/markable-form-fields';
import DirectConnectionInput from './direct-connection-input';
import FormFieldContainer from '../../form-field-container';

const hostInputContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  marginBottom: spacing[2],
});

const hostInputStyles = css({
  flexGrow: 1,
});

const hostActionButtonStyles = css({
  marginLeft: spacing[1],
  marginTop: spacing[1],
});

function HostInput({
  errors,
  connectionStringUrl,
  updateConnectionFormField,
}: {
  errors: ConnectionFormError[];
  connectionStringUrl: ConnectionStringUrl;
  updateConnectionFormField: UpdateConnectionFormField;
}): React.ReactElement {
  const [hosts, setHosts] = useState([...connectionStringUrl.hosts]);
  const { isSRV } = connectionStringUrl;

  const showDirectConnectionInput =
    connectionStringUrl
      .typedSearchParams<MongoClientOptions>()
      .get('directConnection') === 'true' ||
    (!connectionStringUrl.isSRV && hosts.length === 1);

  useEffect(() => {
    // Update the hosts in the state when the underlying connection string hosts
    // change. This can be when a user changes connections, pastes in a new
    // connection string, or changes a setting which also updates the hosts.
    setHosts([...connectionStringUrl.hosts]);
  }, [connectionStringUrl]);

  const onHostChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const newHosts = [...hosts];
      newHosts[index] = event.target.value || '';

      setHosts(newHosts);
      updateConnectionFormField({
        type: 'update-host',
        hostIndex: index,
        newHostValue: event.target.value,
      });
    },
    [hosts, setHosts, updateConnectionFormField]
  );

  const hostsErrorIndex = errors.findIndex(
    (error) => error.fieldName === MARKABLE_FORM_FIELD_NAMES.HOSTS
  );
  const hostsError = errors[hostsErrorIndex];

  return (
    <>
      <FormFieldContainer>
        <Label htmlFor="connection-host-input" id="connection-host-input-label">
          {isSRV ? 'Hostname' : 'Host'}
        </Label>
        {hosts.map((host, index) => (
          <div className={hostInputContainerStyles} key={`host-${index}`}>
            <TextInput
              className={hostInputStyles}
              type="text"
              id="connection-host-input"
              aria-labelledby="connection-host-input-label"
              state={hostsError ? 'error' : undefined}
              // Only show the error message on the last host.
              errorMessage={
                hostsError &&
                hostsError.fieldName === MARKABLE_FORM_FIELD_NAMES.HOSTS &&
                index === hostsError.hostIndex
                  ? hostsError.message
                  : undefined
              }
              value={`${host}`}
              onChange={(e) => onHostChange(e, index)}
            />
            {!isSRV && (
              <IconButton
                className={hostActionButtonStyles}
                aria-label="Add new host"
                onClick={() =>
                  updateConnectionFormField({
                    type: 'add-new-host',
                    hostIndexToAddAfter: index,
                  })
                }
              >
                <Icon glyph="Plus" />
              </IconButton>
            )}
            {!isSRV && hosts.length > 1 && (
              <IconButton
                className={hostActionButtonStyles}
                aria-label="Remove host"
                onClick={() =>
                  updateConnectionFormField({
                    type: 'remove-host',
                    hostIndexToRemove: index,
                  })
                }
              >
                <Icon glyph="Minus" />
              </IconButton>
            )}
          </div>
        ))}
      </FormFieldContainer>
      {showDirectConnectionInput && (
        <FormFieldContainer>
          <DirectConnectionInput
            connectionStringUrl={connectionStringUrl}
            updateConnectionFormField={updateConnectionFormField}
          />
        </FormFieldContainer>
      )}
    </>
  );
}

export default HostInput;
