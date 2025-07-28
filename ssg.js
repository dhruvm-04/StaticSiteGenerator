// ssg.js

// 1. Import necessary modules
const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');

// 2. Define constants for our paths
const DIRS = {
  content: 'content',
  projects: 'projects',
  dist: 'dist'
};
const TEMPLATE_PATH = 'template.html';
const LINKS_FILE = 'links.md';
const RESUME_FILE = 'Resume_DhruvMaheshwari.pdf'; // New: Resume file

// =================================================================
// MAIN BUILD FUNCTION
// =================================================================
async function buildSite() {
  console.log('Starting static site generation...');
  try {
    const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
    await fs.rm(DIRS.dist, { recursive: true, force: true });
    await fs.mkdir(DIRS.dist, { recursive: true });

    // NEW: Copy resume to dist folder
    await fs.copyFile(RESUME_FILE, path.join(DIRS.dist, RESUME_FILE))
      .then(() => console.log('Resume PDF copied successfully.'))
      .catch(() => console.log('Resume PDF not found, skipping copy.'));

    const pages = await findAndParseContent();
    await writeIndividualPages(pages, template);
    await writeListPages(pages, template);

    console.log('Static site generation complete!');
  } catch (err)
 {
    console.error('An error occurred during the build process:', err);
  }
}

// =================================================================
// CORE LOGIC FUNCTIONS
// =================================================================

async function findAndParseContent() {
  const allPages = [];
  const contentSources = [
    { type: 'post', dir: DIRS.content, outputSubdir: '' },
    { type: 'project', dir: DIRS.projects, outputSubdir: 'projects' }
  ];

  for (const source of contentSources) {
    const files = await fs.readdir(source.dir).catch(() => []);
    if (source.outputSubdir) {
      await fs.mkdir(path.join(DIRS.dist, source.outputSubdir), { recursive: true });
    }

    for (const file of files) {
      if (path.extname(file) === '.md') {
        const sourcePath = path.join(source.dir, file);
        const fileContent = await fs.readFile(sourcePath, 'utf8');
        const { data, content } = matter(fileContent);
        
        const baseName = path.basename(file, '.md');
        const outputPath = path.join(DIRS.dist, source.outputSubdir, `${baseName}.html`);
        
        let title = data.title;
        if (!title) {
          const firstLine = content.split('\n').find(line => line.startsWith('# '));
          title = firstLine ? firstLine.substring(2).trim() : baseName;
        }

        allPages.push({
          type: source.type,
          outputPath: outputPath,
          sourcePath: sourcePath,
          frontMatter: data,
          markdownContent: content,
          title: title,
        });
      }
    }
  }
  return allPages;
}

async function writeIndividualPages(pages, template) {
  for (const page of pages) {
    const htmlContent = marked.parse(page.markdownContent);
    const finalHtml = renderTemplate(template, {
      content: htmlContent,
      outputPath: page.outputPath
    });
    await fs.writeFile(page.outputPath, finalHtml);
    console.log(`Generated page: ${page.outputPath}`);
  }
}

async function writeListPages(pages, template) {
  // Generate projects.html
  const projects = pages.filter(p => p.type === 'project');
  const projectsOutputPath = path.join(DIRS.dist, 'projects.html');
  const projectCards = projects.map(project => {
    const relativePath = path.relative(path.dirname(projectsOutputPath), project.outputPath).replace(/\\/g, '/');
    return `
      <a href="${relativePath}" class="card-link">
        <div class="card">
          <div class="mac-header"><span class="red"></span><span class="yellow"></span><span class="green"></span></div>
          <span class="card-title">${project.title}</span>
          <p class="card-description">${project.frontMatter.description || ''}</p>
          <div class="card-tags">${(project.frontMatter.tags || []).map(tag => `<span class="card-tag">${tag}</span>`).join('')}</div>
          <div class="code-editor"><pre><code>${(project.frontMatter.codeSnippet || '').trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>
        </div>
      </a>`;
  }).join('\n');
  const projectsPageContent = `<h1 class="page-title">My Projects</h1><div class="projects-grid">${projectCards}</div>`;
  const finalProjectsHtml = renderTemplate(template, { content: projectsPageContent, outputPath: projectsOutputPath });
  await fs.writeFile(projectsOutputPath, finalProjectsHtml);
  console.log('Generated projects page.');

  // Generate index.html (for blog posts)
  const posts = pages.filter(p => p.type === 'post');
  const indexOutputPath = path.join(DIRS.dist, 'index.html');
  const postLinks = posts.map(post => {
    const relativePath = path.relative(path.dirname(indexOutputPath), post.outputPath).replace(/\\/g, '/');
    return `<li><a href="${relativePath}">${post.title}</a></li>`;
  }).join('\n');
  const indexPageContent = `<h1>All Posts</h1><ul>${postLinks}</ul>`;
  const finalIndexHtml = renderTemplate(template, { content: indexPageContent, outputPath: indexOutputPath });
  await fs.writeFile(indexOutputPath, finalIndexHtml);
  console.log('Generated main index page.');

  // Generate links.html and resume.html
  await generateLinksPage(template);
  await generateResumePage(template);
}

async function generateLinksPage(template) {
    try {
        const linksFileContent = await fs.readFile(LINKS_FILE, 'utf8');
        const { data } = matter(linksFileContent);
        const linksOutputPath = path.join(DIRS.dist, 'links.html');

        const linkCards = (data.links || []).map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-card">
                <div class="link-card-icon">${link.icon}</div>
                <div class="link-card-content">
                    <span class="link-card-title">${link.title}</span>
                    <p class="link-card-description">${link.description}</p>
                </div>
            </a>
        `).join('\n');

        const linksPageContent = `
            <h1 class="page-title">Links</h1>
            <div class="links-grid">${linkCards}</div>
        `;
        const finalLinksHtml = renderTemplate(template, { 
            content: linksPageContent, 
            outputPath: linksOutputPath
        });
        await fs.writeFile(linksOutputPath, finalLinksHtml);
        console.log('Generated links page.');
    } catch (err) {
        console.log('links.md not found, skipping links page generation.');
    }
}

// NEW: Generates the resume.html page
async function generateResumePage(template) {
    const resumeOutputPath = path.join(DIRS.dist, 'resume.html');
    const resumePageContent = `
        <h1 class="page-title">Resume</h1>
        <div class="resume-container">
            <iframe src="./${RESUME_FILE}" width="100%" height="100%"></iframe>
        </div>
    `;
    const finalResumeHtml = renderTemplate(template, {
        content: resumePageContent,
        outputPath: resumeOutputPath
    });
    await fs.writeFile(resumeOutputPath, finalResumeHtml);
    console.log('Generated resume page.');
}


// =================================================================
// HELPER FUNCTION
// =================================================================
function renderTemplate(template, data) {
  let output = template.replace('{{ content }}', data.content);

  const pathToHome = path.relative(path.dirname(data.outputPath), path.join(DIRS.dist, 'index.html')).replace(/\\/g, '/');
  const pathToProjects = path.relative(path.dirname(data.outputPath), path.join(DIRS.dist, 'projects.html')).replace(/\\/g, '/');
  const pathToLinks = path.relative(path.dirname(data.outputPath), path.join(DIRS.dist, 'links.html')).replace(/\\/g, '/');
  const pathToResume = path.relative(path.dirname(data.outputPath), path.join(DIRS.dist, 'resume.html')).replace(/\\/g, '/');

  output = output.replace(/{{pathToHome}}/g, pathToHome || 'index.html');
  output = output.replace(/{{pathToProjects}}/g, pathToProjects || 'projects.html');
  output = output.replace(/{{pathToLinks}}/g, pathToLinks || 'links.html');
  output = output.replace(/{{pathToResume}}/g, pathToResume || 'resume.html');
  
  return output;
}


// Run the build
buildSite();
