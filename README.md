# **static.me** - A Custom Static Site Generator

A personal portfolio and blog powered by a custom-built Static Site Generator (SSG). Built the entire generator from scratch using Node.js, demonstrating a deep understanding of file system operations, content processing, and web development fundamentals.

The SSG takes content written in Markdown, combines it with a single custom HTML template, and generates a complete, fast, and secure static website.

## Features

* **Markdown-Based Content:**\
    All content for blog posts and project pages is written in simple, clean Markdown.

* **Front-Matter Support:**\
    Uses `gray-matter` to parse YAML front-matter from content files, allowing for rich metadata like titles, descriptions, tags, and code snippets.

* **Dynamic Page Generation:**\
    Automatically creates individual pages for blog posts, projects, links, and a resume viewer.

* **Theming:**\
    Features a fully custom UI with light and dark modes that works with the user's system preferences and remembers their choice.

* **Responsive Design:**\
    The layout is fully responsive, providing a variable viewing experience on desktops, tablets, mobile devices, etc.

* **Client-Side Search:**\
    A live search bar filters posts and projects in real-time.

* **Polished UX:**\
    Includes UX features like active page highlighting and an animated search placeholder.

## Tech Stack

* **Core:** Node.js

* **Markdown Parsing:** [marked](https://github.com/markedjs/marked)

* **Front-Matter Parsing:** [gray-matter](https://github.com/jonschlinkert/gray-matter)

* **Styling:** Pure CSS with CSS Variables for theming.

* **Hosting:** Deployed via GitHub Actions to GitHub Pages.
