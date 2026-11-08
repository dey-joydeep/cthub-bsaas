import assert from 'node:assert/strict';
import test from 'node:test';

import { checkSpecContent, checkTemplateContent, extractTsValidators } from './check-form-validation.mjs';

test('detects Validators.required in TypeScript form definition', () => {
  const tsContent = `
    this.form = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      notes: [''],
    });
  `;
  assert.equal(extractTsValidators(tsContent, 'displayName'), true);
  assert.equal(extractTsValidators(tsContent, 'notes'), false);
  assert.equal(extractTsValidators(tsContent, 'nonexistent'), false);
});

test('flags missing <mat-error> when input has HTML required attribute', () => {
  const html = `
    <mat-form-field appearance="outline">
      <mat-label>Email</mat-label>
      <input matInput formControlName="email" required />
    </mat-form-field>
  `;
  const violations = checkTemplateContent(html, '');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'MISSING_MAT_ERROR');
  assert.match(violations[0].message, /formControlName="email"/);
});

test('flags missing <mat-error> when input has TypeScript validator even without HTML required attribute', () => {
  const html = `
    <mat-form-field appearance="outline">
      <mat-label>Display Name</mat-label>
      <input matInput formControlName="displayName" />
    </mat-form-field>
  `;
  const ts = `
    this.form = this.fb.group({
      displayName: ['', Validators.required],
    });
  `;
  const violations = checkTemplateContent(html, ts);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'MISSING_MAT_ERROR');
});

test('passes when validated input has a <mat-error> element', () => {
  const html = `
    <mat-form-field appearance="outline">
      <mat-label>Display Name</mat-label>
      <input matInput formControlName="displayName" required />
      <mat-error>Display name is required.</mat-error>
    </mat-form-field>
  `;
  const violations = checkTemplateContent(html, '');
  assert.equal(violations.length, 0);
});

test('does NOT flag optional inputs without validators (avoids false positives)', () => {
  const html = `
    <mat-form-field appearance="outline">
      <mat-label>Internal Notes</mat-label>
      <textarea matInput formControlName="notes"></textarea>
    </mat-form-field>
  `;
  const ts = `
    this.form = this.fb.group({
      notes: [''],
    });
  `;
  const violations = checkTemplateContent(html, ts);
  assert.equal(violations.length, 0, 'Optional field must not be flagged');
});

test('distinguishes colliding control names across multiple form groups (avoids false positives)', () => {
  const ts = `
    protected readonly shiftForm = this.fb.group({
      branchId: ['', Validators.required],
    });
    protected readonly leaveForm = this.fb.group({
      branchId: this.fb.control(null),
    });
  `;

  // shiftForm's branchId is required and lacks mat-error -> must flag
  const shiftHtml = `
    <form [formGroup]="shiftForm">
      <mat-form-field appearance="outline">
        <mat-label>Branch</mat-label>
        <mat-select formControlName="branchId"></mat-select>
      </mat-form-field>
    </form>
  `;
  const shiftViolations = checkTemplateContent(shiftHtml, ts);
  assert.equal(shiftViolations.length, 1, 'shiftForm.branchId is required and must be flagged');

  // leaveForm's branchId is optional and lacks mat-error -> must NOT flag
  const leaveHtml = `
    <form [formGroup]="leaveForm">
      <mat-form-field appearance="outline">
        <mat-label>Branch</mat-label>
        <mat-select formControlName="branchId"></mat-select>
      </mat-form-field>
    </form>
  `;
  const leaveViolations = checkTemplateContent(leaveHtml, ts);
  assert.equal(leaveViolations.length, 0, 'leaveForm.branchId is optional and must NOT be flagged');
});

test('does NOT flag search or readonly inputs (avoids false positives)', () => {
  const html = `
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <input matInput placeholder="Search customers..." type="search" />
    </mat-form-field>
    <mat-form-field appearance="outline">
      <input matInput readonly value="Readonly token" />
    </mat-form-field>
  `;
  const violations = checkTemplateContent(html, '');
  assert.equal(violations.length, 0, 'Search and readonly fields must not be flagged');
});

test('flags TestBed.overrideComponent usage in spec files', () => {
  const specContent = `
    TestBed.configureTestingModule({...})
      .overrideComponent(MyComponent, { set: { template: '' } });
  `;
  const violations = checkSpecContent(specContent, 'my-component.spec.ts');
  assert.equal(violations.length, 1);
  assert.equal(violations[0].rule, 'PROHIBIT_OVERRIDE_COMPONENT');
});

test('passes spec files using clean dependency injection without overrideComponent', () => {
  const specContent = `
    TestBed.configureTestingModule({
      providers: [{ provide: MyService, useValue: mockService }]
    });
  `;
  const violations = checkSpecContent(specContent, 'my-component.spec.ts');
  assert.equal(violations.length, 0);
});
