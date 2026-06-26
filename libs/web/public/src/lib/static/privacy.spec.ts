import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownModule } from 'ngx-markdown';
import { of } from 'rxjs';

import { StaticContentService } from './static-content.service';
import { PrivacyComponent } from './privacy';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent, MarkdownModule.forRoot()],
      providers: [
        {
          provide: StaticContentService,
          useValue: {
            getContent: jest.fn().mockReturnValue(of('## Privacy')),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
