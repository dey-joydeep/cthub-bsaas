import jwt from 'jsonwebtoken';
import fs from 'fs';

// Set your JWT secret here to match your app's config
const secret = process.env.JWT_SECRET || 'test_secret';

// Example payload - adjust as needed for your app's requirements
const payload = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'admin',
  tenant_id: 'test-tenant',
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('JWT for testing:', token);
fs.writeFileSync('test.jwt', token);
