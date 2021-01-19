import _ from 'lodash';
import { angular2react } from 'angular2react';
import { getColumnCleanName } from '@/services/query-result';
import { clientConfig } from '@/services/auth';
import { registerVisualization } from '@/visualizations';
import editorTemplate from './table-editor.html';
import './table-editor.less';

import Renderer from './Renderer';
import { ColumnTypes } from './utils';

const ALLOWED_ITEM_PER_PAGE = [5, 10, 15, 20, 25, 50, 100, 150, 200, 250];

const DEFAULT_OPTIONS = {
  itemsPerPage: 25,
};

function getColumnContentAlignment(type) {
  return ['integer', 'float', 'boolean', 'date', 'datetime'].indexOf(type) >= 0 ? 'right' : 'left';
}

function getDefaultColumnsOptions(columns) {
  const displayAs = {
    integer: 'number',
    float: 'number',
    boolean: 'boolean',
    date: 'datetime',
    datetime: 'datetime',
  };

  return _.map(columns, (col, index) => ({
    name: col.name,
    type: col.type,
    displayAs: displayAs[col.type] || 'string',
    visible: true,
    order: 100000 + index,
    title: getColumnCleanName(col.name),
    allowSearch: false,
    alignContent: getColumnContentAlignment(col.type),
    // `string` cell options
    allowHTML: true,
    highlightLinks: false,
  }));
}

function getDefaultFormatOptions(column) {
  const dateTimeFormat = {
    date: clientConfig.dateFormat || 'DD/MM/YYYY',
    datetime: clientConfig.dateTimeFormat || 'DD/MM/YYYY HH:mm',
  };
  const numberFormat = {
    integer: clientConfig.integerFormat || '0,0',
    float: clientConfig.floatFormat || '0,0.00',
  };
  return {
    dateTimeFormat: dateTimeFormat[column.type],
    numberFormat: numberFormat[column.type],
    booleanValues: clientConfig.booleanValues || ['false', 'true'],
    // `image` cell options
    imageUrlTemplate: '{{ @ }}',
    imageTitleTemplate: '{{ @ }}',
    imageWidth: '',
    imageHeight: '',
    // `link` cell options
    linkUrlTemplate: '{{ @ }}',
    linkTextTemplate: '{{ @ }}',
    linkTitleTemplate: '{{ @ }}',
    linkOpenInNewTab: true,
  };
}

function wereColumnsReordered(queryColumns, visualizationColumns) {
  queryColumns = _.map(queryColumns, col => col.name);
  visualizationColumns = _.map(visualizationColumns, col => col.name);

  // Some columns may be removed - so skip them (but keep original order)
  visualizationColumns = _.filter(visualizationColumns, col => _.includes(queryColumns, col));
  // Pick query columns that were previously saved with viz (but keep order too)
  queryColumns = _.filter(queryColumns, col => _.includes(visualizationColumns, col));

  // Both array now have the same size as they both contains only common columns
  // (in fact, it was an intersection, that kept order of items on both arrays).
  // Now check for equality item-by-item; if common columns are in the same order -
  // they were not reordered in editor
  for (let i = 0; i < queryColumns.length; i += 1) {
    if (visualizationColumns[i] !== queryColumns[i]) {
      return true;
    }
  }
  return false;
}

function getColumnsOptions(columns, visualizationColumns) {
  const options = getDefaultColumnsOptions(columns);

  if ((wereColumnsReordered(columns, visualizationColumns))) {
    visualizationColumns = _.fromPairs(_.map(
      visualizationColumns,
      (col, index) => [col.name, _.extend({}, col, { order: index })],
    ));
  } else {
    visualizationColumns = _.fromPairs(_.map(
      visualizationColumns,
      col => [col.name, _.omit(col, 'order')],
    ));
  }

  _.each(options, col => _.extend(col, visualizationColumns[col.name]));

  return _.sortBy(options, 'order');
}

const GridEditor = {
  bindings: {
    data: '<',
    options: '<',
    onOptionsChange: '<',
  },
  template: editorTemplate,
  controller($scope) {
    this.allowedItemsPerPage = ALLOWED_ITEM_PER_PAGE;
    this.displayAsOptions = _.map(ColumnTypes, ({ friendlyName: name }, value) => ({ name, value }));

    this.currentTab = 'columns';
    this.setCurrentTab = (tab) => {
      this.currentTab = tab;
    };

    $scope.$watch('$ctrl.options', (options) => {
      this.onOptionsChange(options);
    }, true);

    this.templateHint = `
      All columns can be referenced using <code>{{ column_name }}</code> syntax.
      Use <code>{{ @ }}</code> to reference current (this) column.
      This syntax is applicable to URL, Title and Size options.
    `;
  },
};

export default function init(ngModule) {
  ngModule.component('gridEditor', GridEditor);

  ngModule.run(($injector) => {
    registerVisualization({
      type: 'TABLE',
      name: 'Table',
      getOptions: (options, { columns }) => {
        options = { ...DEFAULT_OPTIONS, ...options };
        options.columns = _.map(
          getColumnsOptions(columns, options.columns),
          col => ({ ...getDefaultFormatOptions(col), ...col }),
        );
        return options;
      },
      Renderer,
      Editor: angular2react('gridEditor', GridEditor, $injector),

      autoHeight: true,
      defaultRows: 14,
      defaultColumns: 3,
      minColumns: 2,
    });
  });
}

init.init = true;
