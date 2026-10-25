import {chromium} from 'file:///C:/Users/USER/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('../../docs/full-integration-release-20261025/screenshots/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:/Users/USER/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];
for(const [name,path] of [['home','/'],['motor','/engineering'],['pump','/pump-lab']]){
 try{await page.goto((process.env.KAIRO_BROWSER_BASE||'http://127.0.0.1:4188')+path,{waitUntil:'networkidle',timeout:25000});await page.screenshot({path:fileURLToPath(new URL(name+'.png',out)),fullPage:true});results.push({name,url:page.url(),title:await page.title(),headings:await page.getByRole('heading').allTextContents(),buttons:(await page.getByRole('button').allTextContents()).slice(0,30)});}catch(e){results.push({name,error:e.message});}
}
await writeFile(new URL('../browser-initial.json',out),JSON.stringify({checkedAt:new Date().toISOString(),syntheticContext:true,errors,results},null,2));await browser.close();console.log(JSON.stringify({results,errors}));
