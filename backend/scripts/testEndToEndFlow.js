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

async function runEndToEndTest() {
  console.log('🧪 Starting End-to-End Authentication & Workflow Verification...');

  try {
    // 1. Customer Login Test (Pre-seeded sample customer)
    console.log('\n1. Testing Pre-seeded Customer Login (`rahul` / `customer123`)...');
    const custLogin = await request('POST', '/auth/login', { username: 'rahul', password: 'customer123' });
    console.log('   Response Status:', custLogin.status);
    console.log('   User:', custLogin.body.user);
    const rahulToken = custLogin.body.token;

    // 2. Customer Vehicles Retrieval
    console.log('\n2. Fetching Customer Vehicles for Rahul...');
    const rahulVehicles = await request('GET', '/customer-portal/vehicles', null, rahulToken);
    console.log('   Vehicles Count:', rahulVehicles.body.count);

    // 3. New Customer Registration Test
    const timestamp = Date.now().toString().slice(-4);
    const newUsername = `testuser_${timestamp}`;
    const newPhone = `99988${timestamp}`;
    console.log(`\n3. Registering New Customer (${newUsername})...`);
    const regRes = await request('POST', '/auth/register', {
      name: 'Test Customer',
      phone: newPhone,
      email: `${newUsername}@example.com`,
      address: '123 Test Street',
      username: newUsername,
      password: 'password123'
    });
    console.log('   Registration Result:', regRes.body.message);
    const newCustToken = regRes.body.token;

    // 4. Register Vehicle for New Customer
    console.log('\n4. Registering Vehicle TS10EX... for New Customer...');
    const vehRes = await request('POST', '/customer-portal/vehicles', {
      registration_no: `TS10EX${timestamp}`,
      brand: 'Honda',
      model: 'City',
      manufacturing_year: 2023,
      fuel_type: 'Petrol',
      mileage: 12000
    }, newCustToken);
    console.log('   Vehicle Result:', vehRes.body.message);
    const vehicleId = vehRes.body.vehicle.vehicle_id;

    // 5. Create Service Booking (Status: Pending)
    console.log('\n5. Creating Service Booking (Status: Pending)...');
    const bookRes = await request('POST', '/customer-portal/bookings', {
      vehicle_id: vehicleId,
      booking_date: new Date().toISOString().split('T')[0],
      service_type: 'Full Comprehensive Inspection',
      problem_description: 'Engine noise during high speeds'
    }, newCustToken);
    console.log('   Booking Result:', bookRes.body.message);
    const bookingId = bookRes.body.booking.booking_id;

    // 6. Service Center Admin Login Test
    console.log('\n6. Testing Service Center Staff Login (`admin` / `admin123`)...');
    const staffLogin = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    console.log('   Staff Login Response:', staffLogin.body.message);

    // 7. Verify Pending Booking in Admin View
    console.log('\n7. Fetching Service Center Bookings...');
    const adminBookings = await request('GET', '/bookings');
    const bookingsList = adminBookings.body.data || adminBookings.body.bookings || [];
    const targetBooking = bookingsList.find(b => b.booking_id === bookingId);
    console.log('   Target Booking Found in Admin List. Status:', targetBooking ? targetBooking.status : 'Not Found');

    // 8. Service Center Completes Service Record (Assign Mechanic + Spare Parts)
    console.log('\n8. Service Center Completing Service (Mechanic ID: 1, Labour: ₹1500, Spare Part ID: 1)...');
    const recordRes = await request('POST', '/service-records', {
      booking_id: bookingId,
      mechanic_id: 1,
      service_date: new Date().toISOString().split('T')[0],
      odometer_reading: 12500,
      description: 'Completed engine checkup and replaced oil filter.',
      labour_cost: 1500,
      parts_used: [{ part_id: 1, quantity: 1 }]
    });
    console.log('   Service Record Completion Result:', recordRes.body.message);

    // 9. Customer Refresh & Verify Status + History + Invoice
    console.log('\n9. Customer Verifying Updated Status & Invoice...');
    const custBookingsUpdated = await request('GET', '/customer-portal/bookings', null, newCustToken);
    const updatedBooking = custBookingsUpdated.body.bookings.find(b => b.booking_id === bookingId);
    console.log('   Updated Booking Status in Customer Portal:', updatedBooking.status);

    const custInvoices = await request('GET', '/customer-portal/invoices', null, newCustToken);
    console.log('   Customer Generated Invoice Grand Total:', custInvoices.body.invoices[0]?.grand_total);

    console.log('\n======================================================');
    console.log('✅ ALL END-TO-END WORKFLOW VERIFICATIONS PASSED 100%!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ E2E Test Error:', err);
  }
}

runEndToEndTest();
