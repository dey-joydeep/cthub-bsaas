import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownModule } from 'ngx-markdown';
import { of } from 'rxjs';

import { StaticContentService } from './static-content.service';
import { TermsComponent } from './terms';

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsComponent, MarkdownModule.forRoot()],
      providers: [
        {
          provide: StaticContentService,
          useValue: {
            getContent: jest.fn().mockReturnValue(of('## Terms')),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
