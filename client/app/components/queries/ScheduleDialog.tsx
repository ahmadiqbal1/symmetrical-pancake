import React, { useState } from "react";
import Modal from "antd/lib/modal";
import DatePicker from "antd/lib/date-picker";
import TimePicker from "antd/lib/time-picker";
import Select from "antd/lib/select";
import Radio from "antd/lib/radio";
import { capitalize, clone, isEqual, omitBy, isNil, isEmpty } from "lodash";
import moment from "moment";
import { secondsToInterval, durationHumanize, pluralize, IntervalEnum, localizeTime } from "@/lib/utils";
// @ts-expect-error ts-migrate(6133) FIXME: 'DialogPropType' is declared but its value is neve... Remove this comment to see the full error message
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
// @ts-expect-error ts-migrate(6133) FIXME: 'Moment' is declared but its value is never read.
import { RefreshScheduleType, RefreshScheduleDefault, Moment } from "../proptypes";

import "./ScheduleDialog.css";

const WEEKDAYS_SHORT = moment.weekdaysShort();
const WEEKDAYS_FULL = moment.weekdays();
const DATE_FORMAT = "YYYY-MM-DD";
const HOUR_FORMAT = "HH:mm";
const { Option, OptGroup } = Select;

type OwnTimeEditorProps = {
    // @ts-expect-error ts-migrate(2749) FIXME: 'Moment' refers to a value, but is being used as a... Remove this comment to see the full error message
    defaultValue?: Moment;
    onChange: (...args: any[]) => any;
};

type TimeEditorProps = OwnTimeEditorProps & typeof TimeEditor.defaultProps;

export function TimeEditor(props: TimeEditorProps) {
  const [time, setTime] = useState(props.defaultValue);
  const showUtc = time && !time.isUTC();

  function onChange(newTime: any) {
    setTime(newTime);
    props.onChange(newTime);
  }

  return (
    <React.Fragment>
      <TimePicker allowClear={false} value={time} format={HOUR_FORMAT} minuteStep={5} onChange={onChange} />
      {showUtc && (
        <span className="utc" data-testid="utc">
          ({moment.utc(time).format(HOUR_FORMAT)} UTC)
        </span>
      )}
    </React.Fragment>
  );
}

TimeEditor.defaultProps = {
  defaultValue: null,
};

type OwnScheduleDialogProps = {
    schedule?: RefreshScheduleType;
    refreshOptions: number[];
    // @ts-expect-error ts-migrate(2749) FIXME: 'DialogPropType' refers to a value, but is being u... Remove this comment to see the full error message
    dialog: DialogPropType;
};

type ScheduleDialogState = any;

type ScheduleDialogProps = OwnScheduleDialogProps & typeof ScheduleDialog.defaultProps;

class ScheduleDialog extends React.Component<ScheduleDialogProps, ScheduleDialogState> {

  static defaultProps = {
    schedule: RefreshScheduleDefault,
  };

  state = this.getState();

  getState() {
    const newSchedule = clone(this.props.schedule || ScheduleDialog.defaultProps.schedule);
    const { time, interval: seconds, day_of_week: day } = newSchedule;
    const { interval } = secondsToInterval(seconds);
    const [hour, minute] = time ? localizeTime(time).split(":") : [null, null];

    return {
      hour,
      minute,
      seconds,
      interval,
      dayOfWeek: day ? WEEKDAYS_SHORT[WEEKDAYS_FULL.indexOf(day)] : null,
      newSchedule,
    };
  }

  get intervals() {
    const ret = {
      [IntervalEnum.NEVER]: [],
    };
    this.props.refreshOptions.forEach(seconds => {
      const { count, interval } = secondsToInterval(seconds);
      if (!(interval in ret)) {
        ret[interval] = [];
      }
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
      ret[interval].push([count, seconds]);
    });

    Object.defineProperty(this, "intervals", { value: ret }); // memoize

    return ret;
  }

  set newSchedule(newProps: any) {
    this.setState((prevState: any) => ({
      newSchedule: Object.assign(prevState.newSchedule, newProps)
    }));
  }

  setTime = (time: any) => {
    this.newSchedule = {
      time: moment(time)
        .utc()
        .format(HOUR_FORMAT),
    };
  };

  setInterval = (newSeconds: any) => {
    const { newSchedule } = this.state;
    const { interval: newInterval } = secondsToInterval(newSeconds);

    // resets to defaults
    if (newInterval === IntervalEnum.NEVER) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'until' does not exist on type 'never'.
      newSchedule.until = null;
    }
    if ([IntervalEnum.NEVER, IntervalEnum.MINUTES, IntervalEnum.HOURS].indexOf(newInterval) !== -1) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'time' does not exist on type 'never'.
      newSchedule.time = null;
    }
    if (newInterval !== IntervalEnum.WEEKS) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'day_of_week' does not exist on type 'nev... Remove this comment to see the full error message
      newSchedule.day_of_week = null;
    }
    if (
      (newInterval === IntervalEnum.DAYS || newInterval === IntervalEnum.WEEKS) &&
      (!this.state.minute || !this.state.hour)
    ) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'time' does not exist on type 'never'.
      newSchedule.time = moment()
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
        .hour("00")
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
        .minute("15")
        .utc()
        .format(HOUR_FORMAT);
    }
    if (newInterval === IntervalEnum.WEEKS && !this.state.dayOfWeek) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'day_of_week' does not exist on type 'nev... Remove this comment to see the full error message
      newSchedule.day_of_week = WEEKDAYS_FULL[0];
    }

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'interval' does not exist on type 'never'... Remove this comment to see the full error message
    newSchedule.interval = newSeconds;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'time' does not exist on type 'never'.
    const [hour, minute] = newSchedule.time ? localizeTime(newSchedule.time).split(":") : [null, null];

    this.setState({
      interval: newInterval,
      seconds: newSeconds,
      hour,
      minute,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'day_of_week' does not exist on type 'nev... Remove this comment to see the full error message
      dayOfWeek: newSchedule.day_of_week ? WEEKDAYS_SHORT[WEEKDAYS_FULL.indexOf(newSchedule.day_of_week)] : null,
    });

    this.newSchedule = newSchedule;
  };

  setScheduleUntil = (_: any, date: any) => {
    this.newSchedule = { until: date };
  };

  setWeekday = (e: any) => {
    const dayOfWeek = e.target.value;
    this.setState({ dayOfWeek });
    this.newSchedule = {
      day_of_week: dayOfWeek ? WEEKDAYS_FULL[WEEKDAYS_SHORT.indexOf(dayOfWeek)] : null,
    };
  };

  setUntilToggle = (e: any) => {
    const date = e.target.value ? moment().format(DATE_FORMAT) : null;
    this.setScheduleUntil(null, date);
  };

  save() {
    const { newSchedule } = this.state;
    const hasChanged = () => {
      const newCompact = omitBy(newSchedule, isNil);
      const oldCompact = omitBy(this.props.schedule, isNil);
      return !isEqual(newCompact, oldCompact);
    };

    // save if changed
    if (hasChanged()) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'interval' does not exist on type 'never'... Remove this comment to see the full error message
      if (newSchedule.interval) {
        this.props.dialog.close(clone(newSchedule));
      } else {
        this.props.dialog.close(null);
      }
    }
    this.props.dialog.dismiss();
  }

  render() {
    const { dialog } = this.props;
    const {
      interval,
      minute,
      hour,
      seconds,
      newSchedule: { until },
    } = this.state;

    return (
      <Modal {...dialog.props} title="Refresh Schedule" className="schedule" onOk={() => this.save()}>
        <div className="schedule-component">
          <h5>Refresh every</h5>
          <div data-testid="interval">
            <Select className="input" value={seconds} onChange={this.setInterval} dropdownMatchSelectWidth={false}>
              {/* @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'ReactText'. */}
              <Option value={null} key="never">
                Never
              </Option>
              {Object.keys(this.intervals)
                .filter(int => !isEmpty(this.intervals[int]))
                .map(int => (
                  // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
                  <OptGroup label={capitalize(pluralize(int))} key={int}>
                    {/* @ts-expect-error ts-migrate(2488) FIXME: Type 'never' must have a '[Symbol.iterator]()' met... Remove this comment to see the full error message */}
                    {this.intervals[int].map(([cnt, secs]) => (
                      <Option value={secs} key={`${int}-${cnt}`}>
                        {durationHumanize(secs)}
                      </Option>
                    ))}
                  </OptGroup>
                ))}
            </Select>
          </div>
        </div>
        {[IntervalEnum.DAYS, IntervalEnum.WEEKS].indexOf(interval) !== -1 ? (
          <div className="schedule-component">
            <h5>On time</h5>
            <div data-testid="time">
              <TimeEditor
                defaultValue={
                  hour
                    ? moment()
                        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
                        .hour(hour)
                        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
                        .minute(minute)
                    : null
                }
                onChange={this.setTime}
              />
            </div>
          </div>
        ) : null}
        {IntervalEnum.WEEKS === interval ? (
          <div className="schedule-component">
            <h5>On day</h5>
            <div data-testid="weekday">
              {/* @ts-expect-error ts-migrate(2322) FIXME: Type '"medium"' is not assignable to type 'SizeTyp... Remove this comment to see the full error message */}
              <Radio.Group size="medium" defaultValue={this.state.dayOfWeek} onChange={this.setWeekday}>
                {WEEKDAYS_SHORT.map(day => (
                  <Radio.Button value={day} key={day} className="input">
                    {day[0]}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </div>
          </div>
        ) : null}
        {interval !== IntervalEnum.NEVER ? (
          <div className="schedule-component">
            <h5>Ends</h5>
            <div className="ends" data-testid="ends">
              {/* @ts-expect-error ts-migrate(2322) FIXME: Type '"medium"' is not assignable to type 'SizeTyp... Remove this comment to see the full error message */}
              <Radio.Group size="medium" value={!!until} onChange={this.setUntilToggle}>
                <Radio value={false}>Never</Radio>
                <Radio value>On</Radio>
              </Radio.Group>
              {until ? (
                <DatePicker
                  size="small"
                  className="datepicker"
                  // @ts-expect-error ts-migrate(2741) FIXME: Property 'isoWeeksInISOWeekYear' is missing in typ... Remove this comment to see the full error message
                  value={moment(until)}
                  allowClear={false}
                  format={DATE_FORMAT}
                  onChange={this.setScheduleUntil}
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    );
  }
}

export default wrapDialog(ScheduleDialog);
