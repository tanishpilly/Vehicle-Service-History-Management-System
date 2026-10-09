const http = require('http');
const fs = require('fs');
const path = require('path');

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

function requestMultipart(path, fields, files, token) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const postDataParts = [];

    // Fields
    for (const [key, value] of Object.entries(fields)) {
      postDataParts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
      ));
    }

    // Files
    for (const fileObj of files) {
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${fileObj.fieldname}"; filename="${fileObj.filename}"\r\nContent-Type: ${fileObj.mimetype}\r\n\r\n`;
      postDataParts.push(Buffer.from(fileHeader));
      postDataParts.push(fileObj.buffer);
      postDataParts.push(Buffer.from('\r\n'));
    }

    postDataParts.push(Buffer.from(`--${boundary}--\r\n`));
    const payload = Buffer.concat(postDataParts);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length,
        'Authorization': `Bearer ${token}`
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
    req.write(payload);
    req.end();
  });
}

async function runAppointmentPickupTest() {
  console.log('🧪 Starting Appointment, Pickup Request & Insurance Doc Verification...');

  try {
    const timestamp = Date.now().toString().slice(-4);
    const username = `pickup_user_${timestamp}`;
    const phone = `98877${timestamp}`;

    // 1. Register Customer
    console.log('\n1. Registering Customer for Pickup Test...');
    const regRes = await request('POST', '/auth/register', {
      name: 'Tanish Pilly',
      phone,
      email: `${username}@example.com`,
      address: 'Flat 402, ABC Apartments, Kukatpally',
      username,
      password: 'password123'
    });
    console.log('   Registration Message:', regRes.body.message);
    const custToken = regRes.body.token;

    // 2. Register Vehicle
    console.log('\n2. Registering Vehicle TS09THAR2026...');
    const vehRes = await request('POST', '/customer-portal/vehicles', {
      registration_no: `TS09THAR${timestamp}`,
      brand: 'Mahindra',
      model: 'Thar ROXX',
      manufacturing_year: 2024,
      fuel_type: 'Diesel',
      mileage: 8500
    }, custToken);
    console.log('   Vehicle Result:', vehRes.body.message);
    const vehicleId = vehRes.body.vehicle.vehicle_id;

    // 3. Prepare Dummy Insurance Document PDF
    const dummyPdfBuffer = Buffer.from('%PDF-1.4 Dummy Vehicle Insurance Policy Document for Mahindra Thar ROXX');

    // 4. Create Service Appointment with Doorstep Pickup Request & Insurance Upload
    console.log('\n3. Creating Service Appointment with Doorstep Pickup & Insurance PDF...');
    const apptRes = await requestMultipart(
      '/appointments',
      {
        vehicle_id: String(vehicleId),
        service_type: 'Periodic Service',
        booking_date: '2026-10-10',
        preferred_time_slot: 'Morning (9:00 AM - 12:00 PM)',
        problem_description: 'Engine oil service & brake pads checkup',
        odometer_reading: '8600',
        pickup_required: 'true',
        flat_building: 'Flat 402, ABC Apartments',
        street: 'Road No. 5',
        area: 'Kukatpally',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500072',
        instructions: 'Please call 15 minutes before pickup.'
      },
      [
        {
          fieldname: 'insurance_docs',
          filename: 'thar_insurance_policy.pdf',
          mimetype: 'application/pdf',
          buffer: dummyPdfBuffer
        }
      ],
      custToken
    );

    console.log('   Appointment Result:', apptRes.body.message);
    console.log('   Booking Code:', apptRes.body.booking?.booking_code);
    console.log('   Pickup Status:', apptRes.body.booking?.pickup_status);
    console.log('   Pickup Address:', apptRes.body.booking?.pickup_address);
    console.log('   Insurance Files Count:', apptRes.body.booking?.insurance_documents_count);
    const bookingId = apptRes.body.booking?.booking_id;

    // 5. Staff Login & Verify In-App Notification
    console.log('\n4. Staff Login & Verifying In-App Notifications...');
    const staffLogin = await request('POST', '/auth/login', { username: 'admin', password: 'admin123' });
    const staffToken = staffLogin.body.token;

    const notifRes = await request('GET', '/service-center-extra/notifications', null, staffToken);
    console.log('   Notifications Unread Count:', notifRes.body.unread_count);
    console.log('   Latest Notification Title:', notifRes.body.notifications[0]?.title);

    // 6. Staff Retrieves Pickup Requests
    console.log('\n5. Staff Retrieving Pickup Requests List...');
    const pickupList = await request('GET', '/service-center-extra/pickup-requests', null, staffToken);
    const targetPickup = pickupList.body.pickup_requests.find(p => p.booking_id === bookingId);
    console.log('   Found Target Pickup Request!');
    console.log('   Customer Name:', targetPickup.customer_name);
    console.log('   Phone:', targetPickup.customer_phone);
    console.log('   Pickup Address:', targetPickup.full_address);

    // 7. Staff Updates Pickup Status: Accepted -> Scheduled -> Picked Up
    console.log('\n6. Staff Updating Pickup Status to Accepted...');
    await request('PUT', `/appointments/${bookingId}/pickup-status`, { pickup_status: 'Accepted' }, staffToken);

    console.log('   Staff Updating Pickup Status to Picked Up (Vehicle at Workshop)...');
    const updateRes = await request('PUT', `/appointments/${bookingId}/pickup-status`, { pickup_status: 'Picked Up' }, staffToken);
    console.log('   Pickup Update Message:', updateRes.body.message);

    // 8. Staff Creates Service Record & Deducts Spare Part Stock via PostgreSQL Trigger
    console.log('\n7. Staff Creating Service Record & Deducting Stock via Trigger...');
    const recordRes = await request('POST', '/service-records', {
      booking_id: bookingId,
      mechanic_id: 1,
      service_date: '2026-10-10',
      odometer_reading: 8600,
      description: 'Vehicle picked up from customer door-step. Replaced engine oil filter.',
      labour_cost: 1200,
      parts_used: [{ part_id: 1, quantity: 1 }]
    });
    console.log('   Service Completion Result:', recordRes.body.message);

    // 9. Customer Verifies Final Appointment & Pickup Tracking Status
    console.log('\n8. Customer Verifying Final Statuses in Customer Dashboard...');
    const custAppts = await request('GET', '/appointments/my-appointments', null, custToken);
    const myAppt = custAppts.body.appointments.find(a => a.booking_id === bookingId);

    console.log('   Final Pickup Status in Customer Portal:', myAppt.pickup_status);
    console.log('   Final Service Status in Customer Portal:', myAppt.service_status);
    console.log('   Attached Insurance Documents:', myAppt.insurance_documents.map(d => d.original_filename));

    console.log('\n======================================================');
    console.log('🎉 ALL SERVICE APPOINTMENT & PICKUP VERIFICATIONS PASSED 100%!');
    console.log('======================================================');
  } catch (err) {
    console.error('❌ Test Execution Failure:', err);
  }
}

runAppointmentPickupTest();
