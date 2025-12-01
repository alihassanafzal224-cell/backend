const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const response = { message: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }
  console.error('Error:', err);
  res.status(status).json(response);
};

export default errorHandler;
