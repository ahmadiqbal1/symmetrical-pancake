import React from 'react';
import { react2angular } from 'react2angular';
import { head, includes, trim, template } from 'lodash';

import { $route } from '@/services/ng';
import { currentUser } from '@/services/auth';
import navigateTo from '@/services/navigateTo';
import notification from '@/services/notification';
import { Alert as AlertService } from '@/services/alert';
import { Query as QueryService } from '@/services/query';

import LoadingState from '@/components/items-list/components/LoadingState';
import AlertView from './AlertView';
import AlertEdit from './AlertEdit';
import AlertNew from './AlertNew';
import { getConditionText } from './components/Criteria';

import Modal from 'antd/lib/modal';

import { routesToAngularRoutes } from '@/lib/utils';
import PromiseRejectionError from '@/lib/promise-rejection-error';

const MODES = {
  NEW: 0,
  VIEW: 1,
  EDIT: 2,
};

// eslint-disable-next-line no-template-curly-in-string
const defaultNameBuilder = template('${query.name}: ${options.column} ${conditionText} ${options.value}');

export function getDefaultName(alert) {
  if (!alert.query) {
    return 'New Alert';
  }
  return defaultNameBuilder({ ...alert, conditionText: getConditionText(alert.options.op) });
}

class AlertPage extends React.Component {
  _isMounted = false;

  state = {
    alert: null,
    queryResult: null,
    pendingRearm: null,
    canEdit: false,
    mode: null,
  };

  componentDidMount() {
    this._isMounted = true;
    const { mode } = $route.current.locals;
    this.setState({ mode });

    if (mode === MODES.NEW) {
      this.setState({
        alert: new AlertService({
          options: {
            op: '>',
            value: 1,
          },
        }),
        pendingRearm: 0,
        canEdit: true,
      });
    } else {
      const { alertId } = $route.current.params;
      AlertService.get({ id: alertId }).$promise.then((alert) => {
        if (this._isMounted) {
          const canEdit = currentUser.canEdit(alert);

          // force view mode if can't edit
          if (!canEdit) {
            this.setState({ mode: MODES.VIEW });
            notification.warn(
              'You cannot edit this alert',
              'You do not have sufficient permissions to edit this alert, and have been redirected to the view-only page.',
              { duration: 0 },
            );
          }

          this.setState({ alert, canEdit, pendingRearm: alert.rearm });
          this.onQuerySelected(alert.query);
        }
      }).catch((err) => {
        if (this._isMounted) {
          throw new PromiseRejectionError(err);
        }
      });
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  save = () => {
    const { alert, pendingRearm } = this.state;

    alert.name = trim(alert.name) || getDefaultName(alert);
    alert.rearm = pendingRearm || null;

    return alert.$save().then(() => {
      notification.success('Saved.');
      navigateTo(`/alerts/${alert.id}`, true, false);
      this.setState({ mode: MODES.VIEW });
    }).catch(() => {
      notification.error('Failed saving alert.');
    });
  };

  onQuerySelected = (query) => {
    this.setState(({ alert }) => ({
      alert: Object.assign(alert, { query }),
      queryResult: null,
    }));

    if (query) {
      // get cached result for column names and values
      new QueryService(query).getQueryResultPromise().then((queryResult) => {
        if (this._isMounted) {
          this.setState({ queryResult });
          let { column } = this.state.alert.options;
          const columns = queryResult.getColumnNames();

          // default to first column name if none chosen, or irrelevant in current query
          if (!column || !includes(columns, column)) {
            column = head(queryResult.getColumnNames());
          }
          this.setAlertOptions({ column });
        }
      });
    }
  };

  onNameChange = (name) => {
    const { alert } = this.state;
    this.setState({
      alert: Object.assign(alert, { name }),
    });
  };

  onRearmChange = (pendingRearm) => {
    this.setState({ pendingRearm });
  };

  setAlertOptions = (obj) => {
    const { alert } = this.state;
    const options = { ...alert.options, ...obj };
    this.setState({
      alert: Object.assign(alert, { options }),
    });
  };

  delete = () => {
    const { alert } = this.state;

    const doDelete = () => {
      alert.$delete(() => {
        notification.success('Alert deleted successfully.');
        navigateTo('/alerts');
      }, () => {
        notification.error('Failed deleting alert.');
      });
    };

    Modal.confirm({
      title: 'Delete Alert',
      content: 'Are you sure you want to delete this alert?',
      okText: 'Delete',
      okType: 'danger',
      onOk: doDelete,
      maskClosable: true,
      autoFocusButton: null,
    });
  };

  edit = () => {
    const { id } = this.state.alert;
    navigateTo(`/alerts/${id}/edit`, true, false);
    this.setState({ mode: MODES.EDIT });
  };

  cancel = () => {
    const { id } = this.state.alert;
    navigateTo(`/alerts/${id}`, true, false);
    this.setState({ mode: MODES.VIEW });
  };

  render() {
    const { alert } = this.state;
    if (!alert) {
      return <LoadingState className="m-t-30" />;
    }

    const { queryResult, mode, canEdit, pendingRearm } = this.state;
    const commonProps = {
      alert,
      queryResult,
      pendingRearm,
      delete: this.delete,
      save: this.save,
      onQuerySelected: this.onQuerySelected,
      onRearmChange: this.onRearmChange,
      onNameChange: this.onNameChange,
      onCriteriaChange: this.setAlertOptions,
      onNotificationTemplateChange: this.setAlertOptions,
    };

    return (
      <div className="container alert-page">
        {mode === MODES.NEW && <AlertNew {...commonProps} />}
        {mode === MODES.VIEW && <AlertView canEdit={canEdit} onEdit={this.edit} {...commonProps} />}
        {mode === MODES.EDIT && <AlertEdit cancel={this.cancel} {...commonProps} />}
      </div>
    );
  }
}

export default function init(ngModule) {
  ngModule.component('alertPage', react2angular(AlertPage));

  return routesToAngularRoutes([
    {
      path: '/alerts/new',
      title: 'New Alert',
      mode: MODES.NEW,
    },
    {
      path: '/alerts/:alertId',
      title: 'Alert',
      mode: MODES.VIEW,
    },
    {
      path: '/alerts/:alertId/edit',
      title: 'Alert',
      mode: MODES.EDIT,
    },
  ], {
    template: '<alert-page></alert-page>',
    controller($scope, $exceptionHandler) {
      'ngInject';

      $scope.handleError = $exceptionHandler;
    },
  });
}

init.init = true;
