export type ComparisonOperator = "gte" | "lte" | "gt" | "lt" | "eq" | "neq";

export type TestExpression =
  | { kind: "compare"; operator: ComparisonOperator; value: number }
  | { kind: "between"; low: number; high: number };

const COMPARISON_OPERATORS: readonly ComparisonOperator[] = [
  "gte",
  "lte",
  "gt",
  "lt",
  "eq",
  "neq",
];

const NUMBER_PATTERN = /^-?\d+(?:\.\d+)?$/;

export function isComparisonOperator(value: string): value is ComparisonOperator {
  return (COMPARISON_OPERATORS as readonly string[]).includes(value);
}

function parseNumber(raw: string): number {
  if (!NUMBER_PATTERN.test(raw)) {
    throw new Error(`invalid number: ${raw}`);
  }
  return Number(raw);
}

export function parseTest(input: string): TestExpression {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0) {
    throw new Error("test is empty");
  }

  const tokens = trimmed.split(/\s+/);

  if (tokens[0] === "between") {
    if (tokens.length !== 3) {
      throw new Error("between requires exactly two numbers: between LO HI");
    }
    const low = parseNumber(tokens[1]);
    const high = parseNumber(tokens[2]);
    if (low >= high) {
      throw new Error("between requires LO < HI");
    }
    return { kind: "between", low, high };
  }

  const operator = tokens[0];
  if (!isComparisonOperator(operator)) {
    throw new Error(`unknown operator: ${operator}`);
  }
  if (tokens.length !== 2) {
    throw new Error(`${operator} requires exactly one number`);
  }

  return { kind: "compare", operator, value: parseNumber(tokens[1]) };
}

export function isParseableTest(input: string): boolean {
  try {
    parseTest(input);
    return true;
  } catch {
    return false;
  }
}

export function evaluateTest(
  expression: TestExpression,
  reading: number,
): boolean {
  if (expression.kind === "between") {
    return reading >= expression.low && reading <= expression.high;
  }

  const { operator, value } = expression;
  switch (operator) {
    case "gte":
      return reading >= value;
    case "lte":
      return reading <= value;
    case "gt":
      return reading > value;
    case "lt":
      return reading < value;
    case "eq":
      return reading === value;
    case "neq":
      return reading !== value;
  }
}
