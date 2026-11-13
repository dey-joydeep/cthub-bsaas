import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSecurityHeaders,
  inspectPayloadForPii,
  validateCorsConfiguration,
  validateCookieSecurity,
  formatIntegratedReport,
} from './integrated-security-audit.mjs';

test('validateSecurityHeaders passes on localhost without HSTS', () => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  const result = validateSecurityHeaders(headers, 'local');
  assert.equal(result.passed, true);
  assert.equal(result.issues.length, 0);
});

test('validateSecurityHeaders fails on staging when HSTS is missing', () => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
  const result = validateSecurityHeaders(headers, 'staging');
  assert.equal(result.passed, false);
  assert.match(result.issues[0], /Strict-Transport-Security/);
});

test('inspectPayloadForPii flags confidential HR address fields on directory routes', () => {
  const directoryPayload = [
    {
      id: 'staff-1',
      displayName: 'Kenji Sato',
      addressLine1: '1-2-3 Roppongi',
      emergencyContactPhone: '+819011112222',
    },
  ];
  const result = inspectPayloadForPii(directoryPayload, '/partner/staff');
  assert.equal(result.isDirectoryEndpoint, true);
  assert.equal(result.leakedFields.includes('addressLine1'), true);
  assert.equal(result.leakedFields.includes('emergencyContactPhone'), true);
});

test('inspectPayloadForPii passes clean directory payload', () => {
  const cleanPayload = [
    {
      id: 'staff-1',
      displayName: 'Kenji Sato',
      role: 'STYLIST',
    },
  ];
  const result = inspectPayloadForPii(cleanPayload, '/partner/staff');
  assert.equal(result.isDirectoryEndpoint, true);
  assert.equal(result.leakedFields.length, 0);
});

test('validateCorsConfiguration rejects wildcard origin with credentials', () => {
  const result = validateCorsConfiguration('*', 'https://malicious.com', true);
  assert.equal(result.secure, false);
  assert.match(result.reason, /Wildcard CORS origin/);
});

test('validateCookieSecurity flags missing HttpOnly and Secure in staging', () => {
  const result = validateCookieSecurity('token=123; SameSite=Lax', 'staging');
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0], /HttpOnly/);
  assert.match(result.errors[1], /Secure/);
});

test('formatIntegratedReport produces markdown report', () => {
  const report = formatIntegratedReport({
    env: 'local',
    webUrl: 'http://localhost:4201',
    apiUrl: 'http://localhost:3001',
    headerResult: { passed: true, issues: [] },
    piiCheck: { isDirectoryEndpoint: true, leakedFields: [] },
    corsCheck: { allowed: true, secure: true },
    cookieCheck: { valid: true, errors: [] },
  });

  assert.match(report, /# Integrated Security Audit Report/);
  assert.match(report, /\*\*Environment:\*\* LOCAL/);
  assert.match(report, /No confidential PII leaked in transit/);
});
