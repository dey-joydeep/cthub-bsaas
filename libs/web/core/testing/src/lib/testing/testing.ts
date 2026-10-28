import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'lib-testing',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './testing.html',
  styleUrl: './testing.css',
})
export class Testing {}
