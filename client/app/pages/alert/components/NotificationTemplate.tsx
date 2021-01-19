import React, { useState } from "react";
import { head, isEmpty, isNull, isUndefined } from "lodash";
import Mustache from "mustache";

import HelpTrigger from "@/components/HelpTrigger";
import { Alert as AlertType, Query as QueryType } from "@/components/proptypes";

import Input from "antd/lib/input";
import Select from "antd/lib/select";
import Modal from "antd/lib/modal";
import Switch from "antd/lib/switch";

import "./NotificationTemplate.less";

function normalizeCustomTemplateData(alert: any, query: any, columnNames: any, resultValues: any) {
  // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
  const topValue = !isEmpty(resultValues) ? head(resultValues)[alert.options.column] : null;

  return {
    ALERT_STATUS: "TRIGGERED",
    ALERT_CONDITION: alert.options.op,
    ALERT_THRESHOLD: alert.options.value,
    ALERT_NAME: alert.name,
    ALERT_URL: `${window.location.origin}/alerts/${alert.id}`,
    QUERY_NAME: query.name,
    QUERY_URL: `${window.location.origin}/queries/${query.id}`,
    QUERY_RESULT_VALUE: isNull(topValue) || isUndefined(topValue) ? "UNKNOWN" : topValue,
    QUERY_RESULT_ROWS: resultValues,
    QUERY_RESULT_COLS: columnNames,
  };
}

type OwnProps = {
    alert: AlertType;
    query: QueryType;
    columnNames: string[];
    resultValues: any[];
    subject?: string;
    setSubject: (...args: any[]) => any;
    body?: string;
    setBody: (...args: any[]) => any;
};

type Props = OwnProps & typeof NotificationTemplate.defaultProps;

function NotificationTemplate({ alert, query, columnNames, resultValues, subject, setSubject, body, setBody }: Props) {
  const hasContent = !!(subject || body);
  const [enabled, setEnabled] = useState(hasContent ? 1 : 0);
  const [showPreview, setShowPreview] = useState(false);

  const renderData = normalizeCustomTemplateData(alert, query, columnNames, resultValues);

  const render = (tmpl: any) => Mustache.render(tmpl || "", renderData);
  const onEnabledChange = (value: any) => {
    if (value || !hasContent) {
      setEnabled(value);
      setShowPreview(false);
    } else {
      Modal.confirm({
        title: "Are you sure?",
        content: "Switching to default template will discard your custom template.",
        onOk: () => {
          setSubject(null);
          setBody(null);
          setEnabled(value);
          setShowPreview(false);
        },
        maskClosable: true,
        autoFocusButton: null,
      });
    }
  };

  return (
    <div className="alert-template">
      <Select
        value={enabled}
        onChange={onEnabledChange}
        optionLabelProp="label"
        dropdownMatchSelectWidth={false}
        style={{ width: "fit-content" }}>
        <Select.Option value={0} label="Use default template">
          Default template
        </Select.Option>
        <Select.Option value={1} label="Use custom template">
          Custom template
        </Select.Option>
      </Select>
      {!!enabled && (
        <div className="alert-custom-template" data-test="AlertCustomTemplate">
          <div className="d-flex align-items-center">
            <h5 className="flex-fill">Subject / Body</h5>
            Preview{" "}
            {/* @ts-expect-error ts-migrate(2322) FIXME: Type '{ size: "small"; className: string; value: b... Remove this comment to see the full error message */}
            <Switch size="small" className="alert-template-preview" value={showPreview} onChange={setShowPreview} />
          </div>
          <Input
            value={showPreview ? render(subject) : subject}
            onChange={e => setSubject(e.target.value)}
            disabled={showPreview}
            data-test="CustomSubject"
          />
          <Input.TextArea
            value={showPreview ? render(body) : body}
            autoSize={{ minRows: 9 }}
            onChange={e => setBody(e.target.value)}
            disabled={showPreview}
            data-test="CustomBody"
          />
          {/* @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message */}
          <HelpTrigger type="ALERT_NOTIF_TEMPLATE_GUIDE" className="f-13">
            <i className="fa fa-question-circle" /> Formatting guide
          </HelpTrigger>
        </div>
      )}
    </div>
  );
}

NotificationTemplate.defaultProps = {
  subject: "",
  body: "",
};

export default NotificationTemplate;
