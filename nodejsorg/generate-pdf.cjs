const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js'); // For syntax highlighting
const puppeteer = require('puppeteer');

// Path to the cloned repository's learn directory
const learnDir = path.join(__dirname, 'apps', 'site', 'pages', 'en', 'learn');

// The ordered structure of content as provided
const orderedContent = [
  {
    section: 'Getting Started',
    files: [
      'introduction-to-nodejs.md',
      'how-to-install-nodejs.md',
      'how-much-javascript-do-you-need-to-know-to-use-nodejs.md',
      'differences-between-nodejs-and-the-browser.md',
      'the-v8-javascript-engine.md',
      'an-introduction-to-the-npm-package-manager.md',
      'ecmascript-2015-es6-and-beyond.md',
      'nodejs-the-difference-between-development-and-production.md',
      'nodejs-with-webassembly.md',
      'debugging.md',
      'profiling.md',
      'security-best-practices.md'
    ]
  },
  {
    section: 'TypeScript',
    files: [
      'introduction.md',
      'transpile.md',
      'run.md',
      'run-natively.md'
    ]
  },
  {
    section: 'Asynchronous Work',
    files: [
      'asynchronous-flow-control.md',
      'overview-of-blocking-vs-non-blocking.md',
      'javascript-asynchronous-programming-and-callbacks.md',
      'discover-javascript-timers.md',
      'event-loop-timers-and-nexttick.md',
      'the-nodejs-event-emitter.md',
      'understanding-processnexttick.md',
      'understanding-setimmediate.md',
      'dont-block-the-event-loop.md'
    ]
  },
  {
    section: 'Manipulating Files',
    files: [
      'nodejs-file-stats.md',
      'nodejs-file-paths.md',
      'working-with-file-descriptors-in-nodejs.md',
      'reading-files-with-nodejs.md',
      'writing-files-with-nodejs.md',
      'working-with-folders-in-nodejs.md',
      'working-with-different-filesystems.md'
    ]
  },
  {
    section: "Command Line",
    files: [
        "run-nodejs-scripts-from-the-command-line.md",
        "how-to-read-environment-variables-from-nodejs.md",
        "how-to-use-the-nodejs-repl.md",
        "output-to-the-command-line-using-nodejs.md",
        "accept-input-from-the-command-line-in-nodejs.md"
    ]
  },
  {
    section: "Modules",
    files: [
        "publishing-node-api-modules.md",
        "anatomy-of-an-http-transaction.md",
        "abi-stability.md",
        "backpressuring-in-streams.md"
    ]
  },
  {
    section: "Diagnostics",
    files: [
        "user-journey.md",
        "memory/index.md", // Nested file
        "live-debugging/index.md", // Nested file
        "poor-performance/index.md", // Nested file
        "flame-graphs.md"
    ]
  },
  {
    section: "Test Runner",
    files: [
        "introduction.md",
        "using-test-runner.md",
        "mocking.md"
    ]
  }
];

// Function to read and convert MDX/Markdown files to HTML
function convertMDToHTML(filePath) {
  const md = new MarkdownIt({
    html: true,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(lang, str, true).value}</code></pre>`;
        } catch (__) {}
      }

      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  const mdContent = fs.readFileSync(filePath, "utf8");

  // Clean up unnecessary headers (e.g., front matter)
  const cleanedContent = mdContent.replace(/---[\s\S]*?---/g, '');

  return md.render(cleanedContent);
}

// Function to generate PDF from combined HTML using Puppeteer
async function generatePDF(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set HTML content with custom styles for better formatting
  await page.setContent(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
          }
          h1, h2, h3 {
            color: #333;
          }
          pre.hljs {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
          }
          code.hljs {
            font-size: 14px;
            color: #333;
          }
          hr {
            margin-top: 50px;
            margin-bottom: 50px;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `);

  // Generate PDF with margins and page breaks for readability on paper tablets like Remarkable
  await page.pdf({
    path: './NodeJS_Learn_Content.pdf',
    format: "A4",
    margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" }
  });

  console.log("PDF generated successfully as NodeJS_Learn_Content.pdf");

  await browser.close();
}

// Main function to orchestrate everything
async function main() {
  let combinedHTMLContent = '';

  for (const section of orderedContent) {
    combinedHTMLContent += `<h1>${section.section}</h1>\n`;

    for (const file of section.files) {

       // Handle nested directories by checking if file exists at path
       const filePath = path.join(learnDir, section.section.toLowerCase().replace(/\s+/g, '-'), file);

       if (fs.existsSync(filePath)) {
         const htmlContent = convertMDToHTML(filePath);
         combinedHTMLContent += `<h2>${file.replace('.md', '').replace(/-/g, " ")}</h2>\n${htmlContent}\n<hr class="page-break">\n`;
       } else {
         console.error(`File not found: ${filePath}`);
       }
     }
   }

   // Step: Generate PDF from combined HTML content
   await generatePDF(combinedHTMLContent);
}

main().catch(console.error);
