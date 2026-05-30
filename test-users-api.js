const http = require('http');

const data = JSON.stringify({
  email: 'sivimon@testmail.com',
  password: 'admin123'
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

      console.log('Got token. Fetching users list...');
      
      const usersOptions = {
        hostname: 'localhost',
        port: 3001,
        path: '/users?role=ASSESSOR',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const usersReq = http.request(usersOptions, (usersRes) => {
        let usersBody = '';
        usersRes.on('data', (chunk) => usersBody += chunk);
        usersRes.on('end', () => {
          console.log(`Users Response (Status ${usersRes.statusCode}):\n`, usersBody);
        });
      });
      
      usersReq.on('error', (e) => console.error(e));
      usersReq.end();

    } catch (e) {
      console.error(e);
    }
  });
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
