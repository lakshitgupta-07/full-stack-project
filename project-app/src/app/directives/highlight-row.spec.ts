import { ElementRef, Renderer2 } from '@angular/core';
import { HighlightRow } from './highlight-row';

describe('HighlightRow', () => {
  it('should create an instance', () => {
    const element = new ElementRef(document.createElement('tr'));
    const renderer = jasmine.createSpyObj<Renderer2>('Renderer2', ['setStyle', 'removeStyle']);

    const directive = new HighlightRow(element, renderer);

    expect(directive).toBeTruthy();
  });
});
