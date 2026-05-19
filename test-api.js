const http = require('http');

const data = JSON.stringify({
  email: 'Admin@testmail.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      const token = response.access_token;
      
      if (!token) {
        console.error('No token received. Response:', body);
        return;
      }

      console.log('Got token. Fetching dashboard stats...');
      
      const dashOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/analytics/admin-dashboard',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const dashReq = http.request(dashOptions, (dashRes) => {
        let dashBody = '';
        dashRes.on('data', (chunk) => dashBody += chunk);
        dashRes.on('end', () => {
          console.log(`Dashboard Stats Response (Status ${dashRes.statusCode}):\n`, dashBody);
        });
      });
      
      dashReq.on('error', (e) => console.error(e));
      dashReq.end();

    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
