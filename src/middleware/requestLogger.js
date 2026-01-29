/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and outgoing responses with full details
 */

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log incoming request
  console.log('\n' + '='.repeat(80));
  console.log(`📥 [REQUEST] ${timestamp}`);
  console.log(`   Method: ${req.method}`);
  console.log(`   Path: ${req.path}`);
  console.log(`   URL: ${req.originalUrl || req.url}`);
  console.log(`   IP: ${req.ip || req.connection.remoteAddress || 'unknown'}`);
  
  // Log headers (sanitize sensitive data)
  const headers = { ...req.headers };
  if (headers.authorization) {
    headers.authorization = '[REDACTED]';
  }
  if (headers.cookie) {
    headers.cookie = '[REDACTED]';
  }
  console.log(`   Headers:`, JSON.stringify(headers, null, 2));
  
  // Log query parameters
  if (Object.keys(req.query || {}).length > 0) {
    console.log(`   Query Params:`, JSON.stringify(req.query, null, 2));
  }
  
  // Log request body (sanitize sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.token) {
      sanitizedBody.token = sanitizedBody.token.substring(0, 20) + '...';
    }
    if (sanitizedBody.password) {
      sanitizedBody.password = '[REDACTED]';
    }
    console.log(`   Body:`, JSON.stringify(sanitizedBody, null, 2));
  }
  
  // Capture original res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalStatus = res.status.bind(res);
  
  let statusCode = res.statusCode || 200;
  let responseBody = null;
  
  // Override res.status to capture status code
  res.status = function(code) {
    statusCode = code;
    return originalStatus(code);
  };
  
  // Override res.json to capture response body
  res.json = function(body) {
    responseBody = body;
    return originalJson(body);
  };
  
  // Override res.send to capture response body
  res.send = function(body) {
    responseBody = body;
    return originalSend(body);
  };
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    
    console.log('\n' + '-'.repeat(80));
    console.log(`📤 [RESPONSE] ${timestamp}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   Status Code: ${statusCode}`);
    console.log(`   Duration: ${duration}ms`);
    
    // Log response body (limit size for large responses)
    if (responseBody) {
      const bodyStr = JSON.stringify(responseBody);
      if (bodyStr.length > 1000) {
        console.log(`   Response Body: ${bodyStr.substring(0, 1000)}... (truncated, ${bodyStr.length} chars)`);
      } else {
        console.log(`   Response Body:`, JSON.stringify(responseBody, null, 2));
      }
    }
    
    // Color code based on status
    if (statusCode >= 500) {
      console.log(`   ⚠️  Server Error`);
    } else if (statusCode >= 400) {
      console.log(`   ⚠️  Client Error`);
    } else {
      console.log(`   ✅ Success`);
    }
    
    console.log('='.repeat(80) + '\n');
  });
  
  next();
};

module.exports = requestLogger;

