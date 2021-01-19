import React from 'react';
import PropTypes from 'prop-types';

import { QuerySelector } from '@/components/QuerySelector';
import { SchedulePhrase } from '@/components/queries/SchedulePhrase';

import Tooltip from 'antd/lib/tooltip';
import Icon from 'antd/lib/icon';

import './Query.less';

export default function QueryFormItem({ query, onChange, editMode }) {
  const queryHint = query && query.schedule ? (
    <small>
      Scheduled to refresh <i style={{ textTransform: 'lowercase' }}><SchedulePhrase schedule={query.schedule} isNew={false} /></i>
    </small>
  ) : (
    <small>
      <Icon type="warning" theme="filled" style={{ color: '#ff4d4f' }} />{' '}
      This query has no <i>refresh schedule</i>.{' '}
      <Tooltip title="A query schedule is not necessary but is highly recommended for alerts. An Alert without a query schedule will only send notifications if a user in your organization manually executes this query."><a>Why it&apos;s recommended <Icon type="question-circle" theme="twoTone" /></a></Tooltip>
    </small>
  );

  return (
    <>
      {editMode ? (
        <QuerySelector
          onChange={onChange}
          selectedQuery={query}
          className="alert-query-selector"
          type="select"
        />
      ) : (
        <Tooltip title="Open query in a new tab.">
          <a href={`/queries/${query.id}`} target="_blank" rel="noopener noreferrer" className="alert-query-link">
            {query.name}<i className="fa fa-external-link" />
          </a>
        </Tooltip>
      )}
      <div className="ant-form-explain">
        {query && queryHint}
      </div>
    </>
  );
}

QueryFormItem.propTypes = {
  query: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
  editMode: PropTypes.bool.isRequired,
};

QueryFormItem.defaultProps = {
  query: null,
};
