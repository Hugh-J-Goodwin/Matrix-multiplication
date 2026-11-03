import Fraction from 'fraction.js';

export function rational(value) {
  if (value instanceof Fraction) return value;
  const text = String(value);
  if (!/[eE]/.test(text)) return new Fraction(text);
  const [mantissa, exponent] = text.toLowerCase().split('e');
  const places = (mantissa.split('.')[1] || '').length - Number(exponent);
  const numerator = BigInt(mantissa.replace('.', ''));
  return places >= 0
    ? new Fraction(numerator, 10n ** BigInt(places))
    : new Fraction(numerator * 10n ** BigInt(-places));
}
export const fractionText = value => rational(value).toFraction();
export const fractionSum = row => row.reduce((sum, value) => sum.add(value), new Fraction(0));
export const addFractions = (a, b) => a.map((row, i) => row.map((value, j) => value.add(b[i][j])));

// Parse scalar rules with rational arithmetic, without evaluating JavaScript.
export function fractionCoefficient(expression, n) {
  const compact = expression.replace(/\s/g, '');
  const tokens = compact.match(/(?:\d*\.?\d+(?:e[+-]?\d+)?|n|[()+\-*/^])/gi) || [];
  if (tokens.join('') !== compact) throw Error('Use numbers, n, parentheses, and + − * / ^ in your rule.');
  let index = 0;
  function atom() {
    const token = tokens[index++];
    if (token === '(') {
      const value = sum();
      if (tokens[index++] !== ')') throw Error('Unclosed parentheses.');
      return value;
    }
    if (token === 'n') return rational(n);
    if (token === undefined || !Number.isFinite(Number(token))) throw Error('Invalid coefficient rule.');
    return rational(token);
  }
  function power() {
    const value = atom();
    if (tokens[index] !== '^') return value;
    index++;
    const exponent = unary();
    if (Math.abs(Number(exponent)) > 10000) throw Error('Rule exponents must be between −10,000 and 10,000.');
    const result = value.pow(exponent);
    if (!result) throw Error('This rule produces an irrational number. Use a rational coefficient for fraction results.');
    return result;
  }
  function unary() {
    if (tokens[index] === '-') { index++; return unary().neg(); }
    if (tokens[index] === '+') { index++; return unary(); }
    return power();
  }
  function product() {
    let value = unary();
    while (['*', '/'].includes(tokens[index])) {
      const op = tokens[index++], right = unary();
      value = op === '*' ? value.mul(right) : value.div(right);
    }
    return value;
  }
  function sum() {
    let value = product();
    while (['+', '-'].includes(tokens[index])) {
      const op = tokens[index++], right = product();
      value = op === '+' ? value.add(right) : value.sub(right);
    }
    return value;
  }
  const value = sum();
  if (index !== tokens.length) throw Error('Invalid coefficient rule.');
  return value;
}
function zeros(size) { return Array.from({ length: size }, () => Array.from({ length: size }, () => new Fraction(0))); }
function multiplyFractions(a, b) {
  const output = zeros(a.length);
  for (let i = 0; i < a.length; i++) for (let k = 0; k < a.length; k++) {
    if (a[i][k].n === 0n) continue;
    for (let j = 0; j < a.length; j++) {
      if (b[k][j].n !== 0n) output[i][j] = output[i][j].add(a[i][k].mul(b[k][j]));
    }
  }
  return output;
}
export function calculateFractions(matrix, order, rule, cumulative) {
  if (!Number.isInteger(order) || order < 1 || order > 100) throw Error('Choose an order from 1 to 100.');
  if (matrix.some(row => row.some(value => !Number.isFinite(value)))) throw Error('All matrix cells must be finite numbers.');
  const source = matrix.map(row => row.map(rational));
  let power = zeros(matrix.length), result = zeros(matrix.length);
  power.forEach((row, i) => { row[i] = new Fraction(1); });
  for (let n = 1; n <= order; n++) {
    power = multiplyFractions(power, source);
    if (cumulative || n === order) {
      const coefficient = fractionCoefficient(rule, n);
      result = addFractions(result, power.map(row => row.map(value => value.mul(coefficient))));
    }
  }
  return result;
}
export function rankRows(matrix, names) {
  const rows = matrix.map((row, index) => ({ index, name: names[index] || `Item ${index + 1}`, total: fractionSum(row) }));
  rows.sort((a, b) => b.total.compare(a.total) || a.index - b.index);
  let rank = 0;
  return rows.map((row, index) => {
    if (!index || row.total.compare(rows[index - 1].total) !== 0) rank = index + 1;
    return { ...row, rank };
  });
}
export function matrixDelimited(matrix, names, separator = ',', formatter = fractionText) {
  names = names.map((name, index) => name || `Item ${index + 1}`);
  const escape = value => '"' + String(value).replaceAll('"', '""') + '"';
  return [['', ...names], ...matrix.map((row, i) => [names[i], ...row.map(formatter)])]
    .map(row => row.map(escape).join(separator)).join('\n');
}

export function calculateSeries(matrices) {
  const included = matrices.filter(matrix => matrix.enabled);
  if (!included.length) throw Error('Include at least one matrix.');
  return included.reduce((total, matrix) => {
    let value;
    try { value = calculateFractions(matrix.values, matrix.order, matrix.rule, matrix.cumulative); }
    catch (error) { throw Error(`${matrix.name}: ${error.message}`); }
    return total ? addFractions(total, value) : value;
  }, null);
}
