const defaultOptions = {
  windowMs: 15 * 60 * 1000, 
  max: 100 
};

const rateLimiter = (options = {}) => {
  const opts = { ...defaultOptions, ...options };
  const hits = new Map();

  return (req, res, next) => {
    try {
      const now = Date.now();
      const windowStart = now - opts.windowMs;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      let entry = hits.get(ip);
      if (!entry) {
        entry = [];
        hits.set(ip, entry);
      }
      // remove old timestamps
      while (entry.length && entry[0] < windowStart) {
        entry.shift();
      }
      entry.push(now);

      if (entry.length > opts.max) {
        res.status(429).json({ message: 'Too many requests. Please try again later.' });
      } else {
        next();
      }
    } catch (err) {
      next();
    }
  };
};

export default rateLimiter;
