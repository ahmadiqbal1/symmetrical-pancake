import { map } from "lodash";
import React from "react";
import { Section, Select } from "@/visualizations/components/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";

export default function ColumnsSettings({ options, data, onOptionsChange }) {
  return (
    <React.Fragment>
      <Section>
        <Select
          layout="horizontal"
          label="Date (Bucket)"
          data-test="Cohort.DateColumn"
          className="w-100"
          value={options.dateColumn}
          onChange={dateColumn => onOptionsChange({ dateColumn })}>
          {map(data.columns, ({ name }) => (
            <Select.Option key={name} data-test={"Cohort.DateColumn." + name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Stage"
          data-test="Cohort.StageColumn"
          className="w-100"
          value={options.stageColumn}
          onChange={stageColumn => onOptionsChange({ stageColumn })}>
          {map(data.columns, ({ name }) => (
            <Select.Option key={name} data-test={"Cohort.StageColumn." + name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Bucket Population Size"
          data-test="Cohort.TotalColumn"
          className="w-100"
          value={options.totalColumn}
          onChange={totalColumn => onOptionsChange({ totalColumn })}>
          {map(data.columns, ({ name }) => (
            <Select.Option key={name} data-test={"Cohort.TotalColumn." + name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </Section>

      <Section>
        <Select
          layout="horizontal"
          label="Stage Value"
          data-test="Cohort.ValueColumn"
          className="w-100"
          value={options.valueColumn}
          onChange={valueColumn => onOptionsChange({ valueColumn })}>
          {map(data.columns, ({ name }) => (
            <Select.Option key={name} data-test={"Cohort.ValueColumn." + name}>
              {name}
            </Select.Option>
          ))}
        </Select>
      </Section>
    </React.Fragment>
  );
}

ColumnsSettings.propTypes = EditorPropTypes;
