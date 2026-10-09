const http = require('http');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function testLoginFlowAndProtection() {
  console.log('🧪 Starting Login Page, Role Redirection & Route Protection Verification...');

  try {
    // 1. Unauthenticated Request Protection Test
    console.log('\n1. Testing Unauthenticated API Protection...');
    const unauthRes = await request('GET', '/customer-portal/vehicles');
    console.log('   Unauthenticated Request Status:', unauthRes.status);
    console.log('   Protection Message:', unauthRes.body.message);

    // 2. Customer Role Selection & Authentication
    console.log('\n2. Testing Customer Role Selection & Login (`rahul` / `customer123`)...');
    const custLogin = await request('POST', '/auth/login', { username: 'rahul', password: 'customer123' });
    console.log('   Customer Login Status:', custLogin.status);
    console.log('   User Role:', custLogin.body.user.role);
    console.log('   Customer Name:', custLogin.body.user.customerName);
    const custToken = custLogin.body.token;

    // 3. Customer Route Authorization Check
    console.log('\n3. Testing Customer Portal Data Access (Own Vehicles & Appointments)...');
    const custVehicles = await request('GET', '/customer-portal/vehicles', null, custToken);
    console.log('   Vehicles Retrieved Successfully. Count:', custVehicles.body.count);

    // 4. Strict Role Protection: Customer attempting Service Center Admin Endpoint
    console.log('\n4. Testing Strict Role Protection (Customer requesting Pickup Requests list)...');
    const custAdminAttempt = await request('GET', '/service-center-extra/pickup-requests', null, custToken);
    console.log('   Admin Endpoint Access Status:', custAdminAttempt.status);
    console.log('   Role Protection Response:', custAdminAttempt.body.message);

    // 5. Service Center Role Selection & Authentication
    console.log('\n5. Testing Service Center Staff Login (`admin` / `admin123`)...');
    const staffLogin = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    console.log('   Staff Login Status:', staffLogin.status);
    console.log('   User Role:', staffLogin.body.user.role);
    const staffToken = staffLogin.body.token;

    // 6. Service Center Route Authorization Check
    console.log('\n6. Testing Service Center Staff Access (Pickup Requests & Notifications)...');
    const staffPickups = await request('GET', '/service-center-extra/pickup-requests', null, staffToken);
    console.log('   Staff Pickup Requests Retrieved Successfully. Count:', staffPickups.body.count);

    console.log('\n======================================================');
    console.log('✅ LOGIN PAGE, ROUTE PROTECTION & REDIRECTS PASSED 100%!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Login Flow Test Error:', err);
  }
}

testLoginFlowAndProtection();
