const http = require('http');

async function test() {
  console.log("Fetching CSRF token...");
  const csrfRes = await fetch('http://localhost:3001/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  
  const cookies = csrfRes.headers.get('set-cookie');
  console.log("Got CSRF Token:", csrfToken);
  
  console.log("Attempting Login...");
  const loginRes = await fetch('http://localhost:3001/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookies
    },
    body: new URLSearchParams({
      username: 'testuser',
      password: 'password123',
      csrfToken: csrfToken,
      redirect: 'false',
      json: 'true'
    })
  });
  
  console.log("Login Status:", loginRes.status);
  const loginCookies = loginRes.headers.get('set-cookie');
  console.log("Login Cookies:", loginCookies);
  
  if (loginRes.ok) {
    const data = await loginRes.json();
    console.log("Login Data:", data);
    
    // Convert Set-Cookie array or string into proper Cookie header
    const rawCookies = loginRes.headers.get('set-cookie');
    const cookieHeader = rawCookies.split(', ').map(c => c.split(';')[0]).join('; ');
    console.log("Formatted Cookie Header:", cookieHeader);
    
    // Now request home page
    const homeRes = await fetch('http://localhost:3001/', {
      headers: {
        'Cookie': cookieHeader,
        'Accept': 'text/html',
        'Host': 'localhost:3000'
      },
      redirect: 'manual'
    });
    
    console.log("Home Status:", homeRes.status);
    console.log("Home Headers:", homeRes.headers);
  }
}

test().catch(console.error);
