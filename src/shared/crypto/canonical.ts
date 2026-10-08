/**
 * Canonical JSON serialization conforming to RFC 8785 (JSON Canonicalization Scheme - JCS).
 * Deterministic serialization ensuring identical cryptographic hashes across environments.
 */
export function canonicalize(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  const type = typeof value;

  if (type === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (type === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new TypeError('JCS: Non-finite numbers (NaN, Infinity) are not permitted');
    }
    // In JSON and RFC 8785, -0 is serialized as "0"
    if (Object.is(value, -0)) {
      return '0';
    }
    return JSON.stringify(value);
  }

  if (type === 'string') {
    return JSON.stringify(value);
  }

  if (type === 'bigint') {
    throw new TypeError('JCS: BigInt values are not supported in JSON');
  }

  if (type === 'symbol' || type === 'function' || type === 'undefined') {
    throw new TypeError(`JCS: Unsupported type "${type}" cannot be serialized`);
  }

  // Handle Date instances explicitly to ensure ISO 8601 UTC string format
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new TypeError('JCS: Invalid Date cannot be serialized');
    }
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => {
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        throw new TypeError('JCS: Invalid array element (undefined/function/symbol)');
      }
      return canonicalize(item);
    });
    return '[' + items.join(',') + ']';
  }

  if (type === 'object') {
    // If the object defines a custom toJSON method, call it first
    if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
      return canonicalize((value as { toJSON: () => unknown }).toJSON());
    }

    const record = value as Record<string, unknown>;
    // Filter out undefined and functions/symbols, sort keys by UTF-16 code units (RFC 8785 §3.2.3)
    const keys = Object.keys(record)
      .filter((k) => record[k] !== undefined && typeof record[k] !== 'function' && typeof record[k] !== 'symbol')
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    const entries = keys.map((k) => JSON.stringify(k) + ':' + canonicalize(record[k]));
    return '{' + entries.join(',') + '}';
  }

  throw new TypeError(`JCS: Cannot canonicalize value of type "${type}"`);
}
