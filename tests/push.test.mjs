import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateKeyPairSync } from 'node:crypto';
import { Messaging } from 'firebase-admin/messaging';
import notify from '../api/notify.js';
import subscribe from '../api/subscribe.js';

function response() {
  return {setHeader() {}, status(code) {this.code = code;return this;},json(data){this.data=data;return this;}};
}
test('push endpoints validate requests and send one topic message per accepted event', async t => {
  const { privateKey } = generateKeyPairSync('rsa', {modulusLength:2048});
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({project_id:'demo',client_email:'test@example.org',
    private_key:privateKey.export({type:'pkcs8',format:'pem'})});
  process.env.VITE_APP_TARGET = 'referee';
  process.env.VITE_REFEREE_PIN = '1234';
  const send = t.mock.method(Messaging.prototype,'send',async () => 'mock-id');
  const join = t.mock.method(Messaging.prototype,'subscribeToTopic',async () => ({failureCount:0}));
  const invalidMethod = response();
  await subscribe({method:'GET'},invalidMethod);
  assert.equal(invalidMethod.code,405);
  assert.equal((await subscribe({method:'POST',body:{}},response())).code,400);
  assert.equal((await subscribe({method:'POST',body:{token:'mock-token'}},response())).code,200);
  assert.deepEqual(join.mock.calls[0].arguments,[['mock-token'],'fanta_live_fans']);
  for (const type of ['kickoff','goal','yellow','red','sub','penalty','forfeit','fulltime']) {
    const req = {method:'POST',headers:{'x-fanta-pin':'1234'},body:{type,title:'عنوان',body:'تفاصيل',matchId:'fixture',url:'/live?matchId=fixture'}};
    assert.equal((await notify(req,response())).code,200);
    const [message] = send.mock.calls.at(-1).arguments;
    assert.equal(message.data.type,type);
    assert.equal(message.topic,'fanta_live_fans');
    assert.equal(message.webpush.headers.TTL,'120');
    assert.equal((await notify({...req,headers:{}},response())).code,403);
    assert.equal((await notify({...req,body:{...req.body,url:'https://example.org'}},response())).code,400);
  }
  assert.equal(send.mock.callCount(),8);
});

test('worker opens the viewer match and shows at most one background banner', async () => {
  let receive,click,opened,banners=0,pending;
  const self = { location:{origin:'https://viewer.example'}, addEventListener(_,cb){click=cb;},
    registration:{showNotification(){banners++;}}, clients:{matchAll:async()=>[],openWindow(url){opened=url;}} };
  vm.runInNewContext(readFileSync(new URL('../public/firebase-messaging-sw.js',import.meta.url),'utf8'),{
    self, URL, importScripts(){},firebase:{initializeApp(){},messaging:()=>({onBackgroundMessage(cb){receive=cb;}})},
  });
  receive({notification:{title:'goal'}});
  assert.equal(banners,0);
  receive({data:{title:'goal'}});
  assert.equal(banners,1);
  click({stopImmediatePropagation(){},notification:{close(){},data:{FCM_MSG:{data:{type:'goal',matchId:'a b'}}}},waitUntil(p){pending=p;}});
  await pending;
  assert.equal(opened,'https://viewer.example/live?matchId=a%20b');
});
