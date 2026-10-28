import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {}
