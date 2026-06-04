/**
 * 预渲染脚本：在 vite build 后运行，将 SPA 渲染为静态 HTML
 * 供百度等搜索引擎爬虫直接读取
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = 3456;

// 启动静态文件服务器
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
      }[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback: return index.html for unknown routes
          fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not found');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(data2);
            }
          });
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        }
      });
    });

    server.listen(PORT, () => {
      console.log(`[prerender] Static server running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

// 使用 puppeteer 进行预渲染
async function prerender() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 等待页面完全加载
  await page.goto(`http://localhost:${PORT}/`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // 额外等待 React 渲染完成（给数据加载留时间）
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 获取渲染后的 HTML
  const html = await page.content();

  await browser.close();

  // 写回 dist/index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  fs.writeFileSync(indexPath, html);

  console.log('[prerender] dist/index.html prerendered successfully!');
}

// 主流程
async function main() {
  const server = await startServer();

  try {
    await prerender();
  } catch (err) {
    console.error('[prerender] Error:', err);
    process.exit(1);
  } finally {
    server.close();
  }
}

main();
