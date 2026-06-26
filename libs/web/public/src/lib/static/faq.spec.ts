import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarkdownModule } from 'ngx-markdown';
import { of } from 'rxjs';

import { StaticContentService } from './static-content.service';
import { FaqComponent } from './faq';

describe('FaqComponent', () => {
  let component: FaqComponent;
  let fixture: ComponentFixture<FaqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponent, MarkdownModule.forRoot()],
      providers: [
        {
          provide: StaticContentService,
          useValue: {
            getContent: jest.fn().mockReturnValue(of('## FAQ')),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
