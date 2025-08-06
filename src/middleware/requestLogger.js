const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.http(`${req.method} ${req.url} - ${req.ip} - Started`);
  
  // Override res.end to capture response time and status
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log the request completion
    logger.logRequest(req, res, responseTime);
    
    // Call original end method
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = requestLogger;