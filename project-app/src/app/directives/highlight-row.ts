import { Directive, ElementRef, HostListener, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appHighlightRow]',
  standalone: true
})
export class HighlightRow implements OnInit {

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit() {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.2s ease, box-shadow 0.2s ease');
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(-3px) scale(1.01)');
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', '0 6px 16px rgba(41, 58, 151, 0.51)');
    this.renderer.setStyle(this.el.nativeElement, 'background-color', 'red');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'translateY(0) scale(1)');
    this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
    this.renderer.removeStyle(this.el.nativeElement, 'background-color');
  }
}
