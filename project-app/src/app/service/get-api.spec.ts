import { TestBed } from '@angular/core/testing';

import { GetApi } from './get-api';

describe('GetApi', () => {
  let service: GetApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
