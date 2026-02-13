/**
 * Validate request parts with zod schemas. Parsed (trimmed, coerced, defaulted)
 * values are stored on req.valid, so controllers never touch raw input.
 * (Express 5 makes req.query read-only, which is why we don't overwrite it.)
 *
 *   router.post('/x', validate({ params, query, body }), controller)
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = req.valid ?? {};
  for (const part of ['params', 'query', 'body']) {
    const schema = schemas[part];
    if (!schema) continue;
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) return next(result.error);
    req.valid[part] = result.data;
  }
  return next();
};
