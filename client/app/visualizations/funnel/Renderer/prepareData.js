import { map, maxBy, sortBy } from "lodash";

export default function prepareData(rows, options) {
  if (rows.length === 0 || !options.stepCol.colName || !options.valueCol.colName) {
    return [];
  }

  rows = [...rows];
  if (options.sortKeyCol.colName) {
    rows = sortBy(rows, options.sortKeyCol.colName);
  }
  if (options.sortKeyCol.reverse) {
    rows = rows.reverse();
  }

  const data = map(rows, row => ({
    step: row[options.stepCol.colName],
    value: parseFloat(row[options.valueCol.colName]) || 0.0,
  }));

  const maxVal = maxBy(data, d => d.value).value;
  data.forEach((d, i) => {
    d.pctMax = (d.value / maxVal) * 100.0;
    d.pctPrevious = i === 0 || d.value === data[i - 1].value ? 100.0 : (d.value / data[i - 1].value) * 100.0;
  });

  return data.slice(0, options.itemsLimit);
}
