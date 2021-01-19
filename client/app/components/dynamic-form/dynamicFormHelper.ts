import React from "react";
import { each, includes, isUndefined, isEmpty, isNil, map, get, some } from "lodash";

function orderedInputs(properties: any, order: any, targetOptions: any) {
  const inputs = new Array(order.length);
  Object.keys(properties).forEach(key => {
    const position = order.indexOf(key);
    const input = {
      name: key,
      title: properties[key].title,
      type: properties[key].type,
      placeholder: isNil(properties[key].default) ? null : properties[key].default.toString(),
      required: properties[key].required,
      extra: properties[key].extra,
      initialValue: targetOptions[key],
    };

    if (input.type === "select") {
      input.placeholder = "Select an option";
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'options' does not exist on type '{ name:... Remove this comment to see the full error message
      input.options = properties[key].options;
    }

    if (position > -1) {
      inputs[position] = input;
    } else {
      inputs.push(input);
    }
  });
  return inputs;
}

function normalizeSchema(configurationSchema: any) {
  each(configurationSchema.properties, (prop, name) => {
    if (name === "password" || name === "passwd") {
      prop.type = "password";
    }

    if (name.endsWith("File")) {
      prop.type = "file";
    }

    if (prop.type === "boolean") {
      prop.type = "checkbox";
    }

    if (prop.type === "string") {
      prop.type = "text";
    }

    if (!isEmpty(prop.enum)) {
      prop.type = "select";
      prop.options = map(prop.enum, value => ({ value, name: value }));
    }

    if (!isEmpty(prop.extendedEnum)) {
      prop.type = "select";
      prop.options = prop.extendedEnum;
    }

    prop.required = includes(configurationSchema.required, name);
    prop.extra = includes(configurationSchema.extra_options, name);
  });

  configurationSchema.order = configurationSchema.order || [];
}

function setDefaultValueToFields(configurationSchema: any, options = {}) {
  const properties = configurationSchema.properties;
  Object.keys(properties).forEach(key => {
    const property = properties[key];
    // set default value for checkboxes
    if (!isUndefined(property.default) && property.type === "checkbox") {
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      options[key] = property.default;
    }
    // set default or first value when value has predefined options
    if (property.type === "select") {
      const optionValues = map(property.options, option => option.value);
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      options[key] = includes(optionValues, property.default) ? property.default : optionValues[0];
    }
  });
}

function getFields(type = {}, target = { options: {} }) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'configuration_schema' does not exist on ... Remove this comment to see the full error message
  const configurationSchema = type.configuration_schema;
  normalizeSchema(configurationSchema);
  const hasTargetObject = Object.keys(target.options).length > 0;
  if (!hasTargetObject) {
    setDefaultValueToFields(configurationSchema, target.options);
  }

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{ options: {... Remove this comment to see the full error message
  const isNewTarget = !target.id;
  const inputs = [
    {
      name: "name",
      title: "Name",
      type: "text",
      required: true,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'name' does not exist on type '{ options:... Remove this comment to see the full error message
      initialValue: target.name,
      contentAfter: React.createElement("hr"),
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'name' does not exist on type '{}'.
      placeholder: `My ${type.name}`,
      autoFocus: isNewTarget,
    },
    ...orderedInputs(configurationSchema.properties, configurationSchema.order, target.options),
  ];

  return inputs;
}

function updateTargetWithValues(target: any, values: any) {
  target.name = values.name;
  Object.keys(values).forEach(key => {
    if (key !== "name") {
      target.options[key] = values[key];
    }
  });
}

function getBase64(file: any) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    reader.onload = () => resolve(reader.result.substr(reader.result.indexOf(",") + 1));
    reader.onerror = error => reject(error);
  });
}

function hasFilledExtraField(type: any, target: any) {
  const extraOptions = get(type, "configuration_schema.extra_options", []);
  return some(extraOptions, optionName => {
    const defaultOptionValue = get(type, ["configuration_schema", "properties", optionName, "default"]);
    const targetOptionValue = get(target, ["options", optionName]);
    return !isNil(targetOptionValue) && targetOptionValue !== defaultOptionValue;
  });
}

export default {
  getFields,
  updateTargetWithValues,
  getBase64,
  hasFilledExtraField,
};
