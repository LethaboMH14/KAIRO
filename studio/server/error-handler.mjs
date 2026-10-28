const messages = {
  400: 'Request could not be read.',
  404: 'Not found.',
  413: 'Request too large.',
};

// Clients get a fixed message per status class. error.message, stacks and paths stay server-side.
export function finalErrorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error);
  const status = errorStatus(error);
  const fallback = status >= 500 ? 'Something went wrong.' : 'Request could not be completed.';
  res.status(status).json({ error: messages[status] ?? fallback });
}

function errorStatus(error) {
  if (error?.type === 'entity.parse.failed') return 400;
  const status = error?.status ?? error?.statusCode;
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}
