const requireFields = (fields = []) => (req, res, next) => {
  const missing = [];
  for (const f of fields) {
    if (req.body[f] === undefined || req.body[f] === null || req.body[f] === '') missing.push(f);
  }
  if (missing.length) return res.status(400).json({ message: 'Missing required fields', missing });
  next();
};

export { requireFields };
