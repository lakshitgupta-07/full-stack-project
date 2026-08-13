import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
  name: "aiTextFormat",
  standalone: true,
})
export class AiTextFormatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(rawText: string | null | undefined): SafeHtml {
    if (!rawText) return "";
    const html = this.toHtml(rawText);
    // Sanitizer strips any residual unsafe markup (script tags etc).
    // We're generating the HTML ourselves from escaped text, so this
    // is a belt-and-braces pass, not the primary defense.
    return this.sanitizer.sanitize(1 /* SecurityContext.HTML */, html) ?? "";
  }

  private toHtml(rawText: string): string {
    let text = rawText.replace(/\r\n/g, "\n");

    // Escape HTML-significant characters FIRST, before we inject our own tags.
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers -> keep as their own block, mark with a data level for CSS
    text = text.replace(
      /^[ \t]*#{1,6}[ \t]+(.*)$/gm,
      (_m, content) => `\n\n@@H@@${content}@@/H@@\n\n`
    );

    // Fenced code blocks -> placeholder blocks (rendered as <pre><code>)
    const codeBlocks: string[] = [];
    text = text.replace(/```([\s\S]*?)```/g, (_m, code) => {
      codeBlocks.push(code.trim());
      return `\n\n@@CODEBLOCK${codeBlocks.length - 1}@@\n\n`;
    });

    // Inline code
    text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");

    // Bold / italic / strikethrough
    text = text
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "<em>$1</em>")
      .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, "<em>$1</em>");

    // Links / images
    text = text
      .replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img alt="$1" src="$2" />'
      )
      .replace(
        /\[([^\]]*)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

    // Normalize list markers to a token we can group below
    text = text.replace(
      /^[ \t]*(?:[-*+•]|\d+[.)])\s+(.*)$/gm,
      "@@LI@@$1"
    );

    // Blockquotes
    text = text.replace(/^[ \t]*>\s?(.*)$/gm, "@@BQ@@$1");

    // Horizontal rules
    text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "@@HR@@");

    // Split into blocks on blank lines, then wrap each block appropriately
    const blocks = text
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    const html = blocks
      .map((block) => this.renderBlock(block, codeBlocks))
      .join("\n");

    return html;
  }

  private renderBlock(block: string, codeBlocks: string[]): string {
    // Code block placeholder
    const codeMatch = block.match(/^@@CODEBLOCK(\d+)@@$/);
    if (codeMatch) {
      const code = codeBlocks[Number(codeMatch[1])] ?? "";
      return `<pre><code>${code}</code></pre>`;
    }

    // Header placeholder
    const headerMatch = block.match(/^@@H@@([\s\S]*?)@@\/H@@$/);
    if (headerMatch) {
      return `<h4>${headerMatch[1].trim()}</h4>`;
    }

    if (block === "@@HR@@") {
      return "<hr />";
    }

    const lines = block.split("\n");

    // List block: every line is an @@LI@@ item
    if (lines.every((l) => l.startsWith("@@LI@@"))) {
      const items = lines
        .map((l) => `<li>${l.replace("@@LI@@", "").trim()}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }

    // Blockquote block
    if (lines.every((l) => l.startsWith("@@BQ@@"))) {
      const content = lines
        .map((l) => l.replace("@@BQ@@", "").trim())
        .join("<br />");
      return `<blockquote>${content}</blockquote>`;
    }

    // Plain paragraph — join wrapped lines with <br />
    return `<p>${lines.join("<br />")}</p>`;
  }
}