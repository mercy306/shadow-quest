const http = require('http');
const { spawn } = require('child_process');
const WS = require('ws');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TARGET = 'https://mercy306.github.io/shadow-quest/';
const PORT = 9265;

async function diagnose() {
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    TARGET
  ]);

  try {
    await new Promise(r => setTimeout(r, 3000));
    const res = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${PORT}/json/list`, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const page = res.find(t => t.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WS(page.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    function send(method, params = {}) {
      return new Promise(r => {
        const msgId = id++;
        const onMsg = data => {
          const m = JSON.parse(data.toString());
          if (m.id === msgId) {
            ws.removeListener('message', onMsg);
            r(m.result);
          }
        };
        ws.on('message', onMsg);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    ws.on('message', data => {
      const msg = JSON.parse(data.toString());
      if (msg.method === 'Console.messageAdded') {
        console.log('[BROWSER CONSOLE]', msg.params.message.level, msg.params.message.text);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[CONSOLE API]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[UNCAUGHT EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.method === 'Network.responseReceived') {
        const url = msg.params.response.url;
        if (url.includes('.glb') || url.includes('.wav') || url.includes('.js')) {
          console.log('[NETWORK RESPONSE]', msg.params.response.status, url);
        }
      }
      if (msg.method === 'Network.loadingFailed') {
        console.log('[FAILED ASSET]', msg.params.errorText, msg.params.requestId);
      }
    });

    await send('Console.enable');
    await send('Runtime.enable');
    await send('Network.enable');

    console.log('--- Monitoring page loading for 30 seconds ---');
    for (let i = 0; i < 30; i++) {
      const statusRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const status = document.getElementById('loading-status')?.textContent;
          const bar = document.getElementById('progress-bar')?.style.width;
          const screenHidden = document.getElementById('loading-screen')?.classList.contains('hidden');
          const menuHidden = document.getElementById('main-menu')?.classList.contains('hidden');
          const initStep = window.game?.initStep;
          const isReady = window.game?.isReady;
          return { status, bar, screenHidden, menuHidden, initStep, isReady };
        })()`,
        returnByValue: true
      });
      console.log(`[T+${i}s]`, statusRes?.result?.value);
      if (statusRes?.result?.value?.isReady) {
        console.log('🎉 GAME IS READY AT T+' + i + 's!');
        break;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

diagnose().catch(console.error);
