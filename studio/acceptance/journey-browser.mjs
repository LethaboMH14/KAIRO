// OPTIONAL future browser acceptance runner. NOT authorized by its existence.
// Prior browser-observation denial applies: do not set approval flags without a new explicit grant.
import assert from 'node:assert/strict';
import {journeyStages,viewports} from './journey-matrix.mjs';

const approved=process.env.KAIRO_BROWSER_ACCEPTANCE_AUTHORIZED==='explicit-new-approval';
const isolated=process.env.KAIRO_ACCEPTANCE_ISOLATED_SERVER==='synthetic-only';
const input=process.env.KAIRO_ACCEPTANCE_BASE_URL||'';
let base;
try{base=new URL(input);}catch{/* invalid URL is blocked */}
if(!approved||!isolated||!base||base.hostname!=='127.0.0.1'||base.protocol!=='http:'||
   !['/',''].includes(base.pathname)||base.search||base.hash||!base.port){
  console.error('BLOCKED: browser observation denied; requires a new explicit approval, isolated synthetic server and http://127.0.0.1:PORT. No browser started.');
  process.exit(78);
}

// Import only after the policy gate. Playwright is OPTIONAL and not installed by this code.
let chromium;
try{({chromium}=await import('playwright'));}catch{
  console.error('BLOCKED: optional pinned Playwright dependency unavailable; no package installation attempted.');
  process.exit(78);
}
const failures=[];
let browser,context,page;
const check=async(id,run)=>{
  try{await run();console.log(JSON.stringify({id,status:'PASS',evidence:'local synthetic browser'}));}
  catch(error){const message=String(error?.message||error).slice(0,350);failures.push({id,message});console.error(JSON.stringify({id,status:'FAIL',message}));throw error;}
};
const local=async path=>{
  const target=new URL(path,base);
  assert.equal(target.origin,base.origin);
  const response=await page.goto(target.href,{waitUntil:'domcontentloaded'});
  assert.equal(new URL(page.url()).origin,base.origin,'Navigation left local origin');
  assert.ok(response?.ok(),`GET ${path} failed: ${response?.status()}`);
};
const noHorizontalOverflow=()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+8);
const accessible=async locator=>assert.ok(await locator.isVisible());
const click=async(locator)=>{await accessible(locator);await locator.click();};

try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce',acceptDownloads:true,permissions:[],serviceWorkers:'block'});
  page=await context.newPage();
  page.on('dialog',dialog=>dialog.dismiss()); // Never approve a destructive browser prompt.
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    return url.origin===base.origin?route.continue():route.abort('blockedbyclient');
  });
  await check('J01',async()=>{
    await local('/account');
    await accessible(page.getByRole('heading',{name:'Your place to keep learning.'}));
    // No sign-in, sign-up, account mutation or personal data.
  });
  await check('J02',async()=>{
    await local('/sources');
    await click(page.getByRole('button',{name:/Try the shopkeeper sample/}));
    await accessible(page.getByRole('heading',{name:'Check the words first'}));
    await accessible(page.getByText('Stock control at the corner shop').first());
  });
  await check('J03',async()=>{
    await page.getByLabel(/I checked the text against my material/).check();
    await click(page.getByRole('button',{name:/Save reviewed text/}));
    await click(page.getByRole('button',{name:/Shape my lesson/}));
    await accessible(page.getByRole('heading',{name:'Shape a lesson around your goal'}));
    await click(page.getByRole('button',{name:'Create local reading lesson'}));
    await click(page.getByRole('link',{name:/Learn with KAIRO/}));
    assert.match(new URL(page.url()).pathname,/^\/classroom$/);
  });
  await check('J04',async()=>{
    await click(page.getByRole('button',{name:/Begin reading/}));
    await accessible(page.locator('.kx-caption'));
    assert.ok((await page.locator('.kx-caption').innerText()).trim().length>30);
    assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
    await accessible(page.getByRole('checkbox',{name:'Reduce motion'}));
    await click(page.getByRole('button',{name:'Stop',exact:true}));
    await click(page.getByRole('button',{name:'Show KAIRO in 3D'}));
    await click(page.getByRole('button',{name:'Reading view'}));
    await click(page.getByRole('button',{name:'Save reading copy'}));
    await accessible(page.getByText(/Reading copy saved on this device/));
  });
  await check('J06',async()=>{
    await click(page.getByRole('navigation',{name:'Lesson journey'}).getByRole('button',{name:/Practise/}));
    await accessible(page.getByRole('heading',{name:'Try it in your own words.'}));
    await page.getByRole('radio').first().check();
    await accessible(page.getByText(/reviewed revision|source/i).first());
  });
  await check('J07',async()=>{
    await click(page.getByRole('navigation',{name:'Lesson journey'}).getByRole('button',{name:/Keep my work/}));
    const note='SYNTHETIC-JOURNEY-NOTE: I compared the provided figures.';
    await page.getByLabel('My explanation or notes').fill(note);
    const downloadPromise=page.waitForEvent('download');
    await click(page.getByRole('button',{name:'Download my lesson & working'}));
    const download=await downloadPromise;
    assert.match(download.suggestedFilename(),/^KAIRO-[a-f0-9]{24}-working\.md$/);
    const stream=await download.createReadStream();
    assert.ok(stream,'Download stream missing');
    let body='';for await(const chunk of stream){body+=chunk.toString();assert.ok(body.length<512000,'Unbounded download');}
    assert.ok(body.includes(note),'Synthetic note absent from download');
    await page.reload({waitUntil:'domcontentloaded'});
    await click(page.getByRole('navigation',{name:'Lesson journey'}).getByRole('button',{name:/Keep my work/}));
    assert.equal(await page.getByLabel('My explanation or notes').inputValue(),note,'Recovery lost saved note');
  });
  await check('J05',async()=>{
    await local('/studios');
    await accessible(page.getByRole('heading',{name:'See how the idea works.'}));
    await accessible(page.getByRole('link',{name:/Choose material/}));
  });
  await check('J08',async()=>{
    await local('/saved');
    await accessible(page.getByRole('heading',{name:'Take your learning with you'}));
    await accessible(page.getByText(/Saved reading copy/).first());
  });
  await check('A01',async()=>{
    await local('/home');
    await page.keyboard.press('Tab');
    assert.match(await page.evaluate(()=>document.activeElement?.textContent||''),/Skip to content/);
  });
  await check('A04',async()=>{
    assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
  });
  for(const profile of viewports){
    await check(`A06-${profile.id}`,async()=>{
      await page.setViewportSize({width:profile.width,height:profile.height});
      await local('/home');
      assert.ok(await noHorizontalOverflow(),`Horizontal overflow at ${profile.width}px`);
      await accessible(page.getByRole('link',{name:/Start a lesson/}));
    });
  }
  await check('A03-PROXY',async()=>{
    // Root-font scaling is a reflow proxy, NOT native browser 200% text-only zoom.
    await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
    assert.ok(await noHorizontalOverflow(),'Horizontal overflow under root-font scaling proxy');
    await page.evaluate(()=>{document.documentElement.style.fontSize='';});
  });
} catch(error){
  console.error('Acceptance stopped at failing dependent stage; remaining browser/device checks are NOT RUN.');
} finally{
  await context?.close();await browser?.close();
}
console.log(JSON.stringify({status:failures.length?'FAIL':'PASS',declaredScenarios:journeyStages.length,failed:failures.map(f=>f.id),notCovered:['native 200% browser text zoom','screen-reader human order and names','contrast measured on physical devices','offline after server shutdown','real mobile Safari/Android','audio/voice accuracy','any microphone/camera observation']}));
if(failures.length)process.exitCode=1;
