import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'aiTextFormat',
  standalone: true,
})
export class AiTextFormatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(rawText: string | null | undefined): SafeHtml {
    if (!rawText) return '';
    const html = this.toHtml(rawText);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
  private toHtml(rawText: string): string {
    let text = rawText.replace(/\r\n/g, '\n').trim();
    text = text.replace(/([^\n])\s+(#{1,6})\s+(?=\S)/g, '$1\n\n$2 ');

    text = text.replace(/([^\n])\s+\*\s+(?=\*\*|[A-Za-z0-9])/g, '$1\n* ');

    text = text.replace(/([^\n])\s+(\d+)[.)]\s+(?=\S)/g, '$1\n$2. ');

    text = text.replace(/([^\n])\s+(#{1,6})\s+/g, '$1\n\n$2 ');

    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    text = text.replace(/^[ \t]*(#{1,6})[ \t]+(.*)$/gm, (_match, hashes, content) => {
      const level = hashes.length;

      return `\n\n@@H${level}@@${content.trim()}@@/H${level}@@\n\n`;
    });

    const codeBlocks: string[] = [];

    text = text.replace(/```([\s\S]*?)```/g, (_match, code) => {
      codeBlocks.push(code.trim());

      return `\n\n@@CODEBLOCK${codeBlocks.length - 1}@@\n\n`;
    });

    text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    text = text
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em>$1</em>');

    text = text
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />')
      .replace(
        /\[([^\]]*)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
      );

    text = text.replace(/^[ \t]*(?:[-*+•]|\d+[.)])\s+(.*)$/gm, '@@LI@@$1');

    text = text.replace(/((?:^@@LI@@.*$\n?)+)/gm, '\n\n$1\n\n');

    text = text.replace(/^[ \t]*>\s?(.*)$/gm, '@@BQ@@$1');

    text = text.replace(/((?:^@@BQ@@.*$\n?)+)/gm, '\n\n$1\n\n');

    const blocks = text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);

    return blocks.map((block) => this.renderBlock(block, codeBlocks)).join('\n');
  }
  private renderBlock(block: string, codeBlocks: string[]): string {
    const codeMatch = block.match(/^@@CODEBLOCK(\d+)@@$/);

    if (codeMatch) {
      const code = codeBlocks[Number(codeMatch[1])] ?? '';

      return `<pre><code>${code}</code></pre>`;
    }

    const headerMatch = block.match(/^@@H([1-6])@@([\s\S]*?)@@\/H\1@@$/);

    if (headerMatch) {
      const level = headerMatch[1];
      const content = headerMatch[2].trim();

      return `<h${level}>${content}</h${level}>`;
    }

    if (block === '@@HR@@') {
      return '<hr />';
    }

    const lines = block.split('\n');

    if (lines.every((line) => line.startsWith('@@LI@@'))) {
      const items = lines.map((line) => `<li>${line.replace('@@LI@@', '').trim()}</li>`).join('');

      return `<ul>${items}</ul>`;
    }

    if (lines.every((line) => line.startsWith('@@BQ@@'))) {
      const content = lines.map((line) => line.replace('@@BQ@@', '').trim()).join('<br />');

      return `<blockquote>${content}</blockquote>`;
    }
    return `<p>${lines.join('<br />')}</p>`;
  }
}
