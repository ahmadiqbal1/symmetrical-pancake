import { toUpper } from "lodash";
import React from "react";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { StateStorage } from "@/components/items-list/classes/StateStorage";
import DynamicComponent from "@/components/DynamicComponent";

import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import Alert from "@/services/alert";
import { currentUser } from "@/services/auth";
import routes from "@/services/routes";

export const STATE_CLASS = {
  unknown: "label-warning",
  ok: "label-success",
  triggered: "label-danger",
};

type Props = {
    controller: ControllerType;
};

class AlertsList extends React.Component<Props> {

  listColumns = [
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sortable' does not exist on type '(rende... Remove this comment to see the full error message
    Columns.custom.sortable(
      (text: any, alert: any) => <i className={`fa fa-bell-${alert.options.muted ? "slash" : "o"} p-r-0`} />,
      {
        title: <i className="fa fa-bell p-r-0" />,
        field: "muted",
        width: "1%",
      }
    ),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sortable' does not exist on type '(rende... Remove this comment to see the full error message
    Columns.custom.sortable(
      (text: any, alert: any) => (
        <div>
          <Link className="table-main-title" href={"alerts/" + alert.id}>
            {alert.name}
          </Link>
        </div>
      ),
      {
        title: "Name",
        field: "name",
      }
    ),
    Columns.custom((text: any, item: any) => item.user.name, { title: "Created By", width: "1%" }),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sortable' does not exist on type '(rende... Remove this comment to see the full error message
    Columns.custom.sortable(
      (text: any, alert: any) => (
        <div>
          {/* @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message */}
          <span className={`label ${STATE_CLASS[alert.state]}`}>{toUpper(alert.state)}</span>
        </div>
      ),
      {
        title: "State",
        field: "state",
        width: "1%",
        className: "text-nowrap",
      }
    ),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sortable' does not exist on type '(overr... Remove this comment to see the full error message
    Columns.timeAgo.sortable({ title: "Last Updated At", field: "updated_at", width: "1%" }),
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'sortable' does not exist on type '(overr... Remove this comment to see the full error message
    Columns.dateTime.sortable({ title: "Created At", field: "created_at", width: "1%" }),
  ];

  render() {
    const { controller } = this.props;

    return (
      <div className="page-alerts-list">
        <div className="container">
          <PageHeader
            title={controller.params.pageTitle}
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'Element | null' is not assignable to type 'n... Remove this comment to see the full error message
            actions={
              currentUser.hasPermission("list_alerts") ? (
                <Link.Button block type="primary" href="alerts/new">
                  <i className="fa fa-plus m-r-5" />
                  New Alert
                </Link.Button>
              ) : null
            }
          />
          <div>
            {controller.isLoaded && controller.isEmpty ? (
              <DynamicComponent name="AlertsList.EmptyState">
                {/* @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call. */}
                <EmptyState
                  // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
                  icon="fa fa-bell-o"
                  // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
                  illustration="alert"
                  // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
                  description="Get notified on certain events"
                  // @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
                  helpMessage={<EmptyStateHelpMessage helpTriggerType="ALERTS" />}
                  // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
                  showAlertStep
                />
              </DynamicComponent>
            ) : (
              <div className="table-responsive bg-white tiled">
                {/* @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call. */}
                <ItemsTable
                  loading={!controller.isLoaded}
                  items={controller.pageItems}
                  columns={this.listColumns}
                  orderByField={controller.orderByField}
                  orderByReverse={controller.orderByReverse}
                  toggleSorting={controller.toggleSorting}
                />
                <Paginator
                  showPageSizeSelect
                  totalCount={controller.totalItemsCount}
                  pageSize={controller.itemsPerPage}
                  // @ts-expect-error ts-migrate(2322) FIXME: Type '(itemsPerPage: any) => any' is not assignabl... Remove this comment to see the full error message
                  onPageSizeChange={(itemsPerPage: any) => controller.updatePagination({ itemsPerPage })}
                  page={controller.page}
                  // @ts-expect-error ts-migrate(2322) FIXME: Type '(page: any) => any' is not assignable to typ... Remove this comment to see the full error message
                  onChange={(page: any) => controller.updatePagination({ page })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const AlertsListPage = itemsList(
  AlertsList,
  () =>
    new ResourceItemsSource({
      isPlainList: true,
      getRequest() {
        return {};
      },
      getResource() {
        return Alert.query.bind(Alert);
      },
    }),
  () => new StateStorage({ orderByField: "created_at", orderByReverse: true, itemsPerPage: 20 })
);

routes.register(
  "Alerts.List",
  routeWithUserSession({
    path: "/alerts",
    title: "Alerts",
    // @ts-expect-error ts-migrate(2322) FIXME: Type '{ currentPage: string; pageTitle?: string | ... Remove this comment to see the full error message
    render: pageProps => <AlertsListPage {...pageProps} currentPage="alerts" />,
  })
);
