import test from 'node:test';
import assert from 'node:assert/strict';
import {parseYouTubeReference} from '../src/media-input/parseYouTubeReference.ts';

const ID='abcdefghijk';

test('accepts supported watch and short links and returns only the validated reference',()=>{
 assert.deepEqual(parseYouTubeReference(`https://youtube.com/watch?v=${ID}`),{ok:true,videoId:ID,startSeconds:0});
 assert.deepEqual(parseYouTubeReference(`https://www.youtube.com/watch?v=${ID}&t=37s&utm_source=lesson`),{ok:true,videoId:ID,startSeconds:37});
 assert.deepEqual(parseYouTubeReference(`https://m.youtube.com/watch?v=${ID}&start=604800`),{ok:true,videoId:ID,startSeconds:604800});
 assert.deepEqual(parseYouTubeReference(`https://youtu.be/${ID}?start=0s&feature=share`),{ok:true,videoId:ID,startSeconds:0});
 assert.deepEqual(parseYouTubeReference(`https://youtu.be:443/${ID}?t=42`),{ok:true,videoId:ID,startSeconds:42});
});

test('discards tracking parameters and never forwards query data',()=>{
 const result=parseYouTubeReference(`https://youtube.com/watch?v=${ID}&list=playlist-id&si=tracking&si=other&t=19`);
 assert.deepEqual(result,{ok:true,videoId:ID,startSeconds:19});
 if(result.ok)assert.deepEqual(Object.keys(result).sort(),['ok','startSeconds','videoId']);
});

test('rejects unsupported protocols, hosts, ports, credentials, paths, fragments, and path normalization',()=>{
 const urls=[
  `http://youtube.com/watch?v=${ID}`,
  `https://youtube.com.evil.test/watch?v=${ID}`,
  `https://www.youtu.be/${ID}`,
  `https://youtu.be.evil.test/${ID}`,
  `https://youtube.com:444/watch?v=${ID}`,
  `https://user@youtube.com/watch?v=${ID}`,
  `https://@youtube.com/watch?v=${ID}`,
  `https://youtube.com/embed/${ID}`,
  `https://youtube.com/watch/../watch?v=${ID}`,
  `https://youtu.be/${ID}/extra`,
  `https://youtu.be/${ID}#`,
  `https://youtube.com/watch?v=${ID}#chapter`,
  `https:\\youtube.com\\watch?v=${ID}`,
 ];
 for(const url of urls)assert.equal(parseYouTubeReference(url).ok,false,url);
});

test('rejects absent, malformed, or ambiguous video identifiers',()=>{
 const urls=[
  'https://youtube.com/watch',
  `https://youtube.com/watch?v=${ID.slice(1)}`,
  `https://youtube.com/watch?v=${ID}&v=${ID}`,
  `https://youtube.com/watch?v=${ID}&%76=${ID}`,
  `https://youtu.be/${ID.slice(1)}`,
  `https://youtu.be/${ID}?v=${ID}`,
 ];
 for(const url of urls)assert.equal(parseYouTubeReference(url).ok,false,url);
});

test('accepts only whole-second timestamps in the configured range',()=>{
 for(const timestamp of ['','1m2s','2.5','-1','+2','604801','999999999999999999999999999','0.5']){
  const parameter=timestamp?'&t='+timestamp:'&t=';
  const url=`https://youtube.com/watch?v=${ID}${parameter}`;
  assert.equal(parseYouTubeReference(url).ok,false,url);
 }
 for(const url of [
  `https://youtube.com/watch?v=${ID}&t=1&t=1`,
  `https://youtube.com/watch?v=${ID}&start=1&start=1`,
  `https://youtube.com/watch?v=${ID}&t=1&start=1`,
 ])assert.equal(parseYouTubeReference(url).ok,false,url);
});

test('checks character and UTF-8 byte bounds before URL parsing',()=>{
 assert.equal(parseYouTubeReference('x'.repeat(2049)).ok,false);
 const multibyte=`https://youtube.com/watch?v=${ID}&utm=${'é'.repeat(1020)}`;
 assert.ok(multibyte.length<2048);
 assert.ok(new TextEncoder().encode(multibyte).length>2048);
 assert.equal(parseYouTubeReference(multibyte).ok,false);
 assert.equal(parseYouTubeReference(42).ok,false);
 assert.equal(parseYouTubeReference(`https://youtube.com/wat\nch?v=${ID}`).ok,false);
});
