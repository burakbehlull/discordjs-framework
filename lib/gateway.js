import WebSocket from 'ws';
import { EventEmitter } from 'events'
import { Events } from './bits.js';

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

export class Client extends EventEmitter {
  constructor({intents}) {
    super();
	this.intents = intents
    this.ws = null;
    this.seq = null;
    this.heartbeatInterval = null;
  }

  connect(token) {
	  
	if(!token) return console.error("Token is not found")
	
    this.ws = new WebSocket(GATEWAY_URL);

    this.ws.on('open', () => {});
	
	let intents;
	if (Array.isArray(this.intents)) {
		intents = this.intents.reduce((a, b) => a | b, 0)
	} else {
		intents = this.intents
	}

    this.ws.on('message', (data) => {
      const payload = JSON.parse(data.toString());
      const { t, s, op, d } = payload;
      if (s) this.seq = s;

      switch (op) {
        case 10: {
          this.heartbeatInterval = setInterval(() => {
            this.ws.send(JSON.stringify({ op: 1, d: this.seq }));
          }, d.heartbeat_interval);

          this.ws.send(JSON.stringify({
            op: 2,
            d: {
              token: token,
              intents: intents,
              properties: {
                os: 'linux',
                browser: 'custom-lib',
                device: 'custom-lib',
              },
            },
          }));
          break;
        }

        case 0: {

          const normalized = this.#normalizeEventName(t);
          if (Events[normalized]) {
            this.emit(Events[normalized], d);
          } else {
            this.emit(t?.toLowerCase(), d);
          }
          break;
        }
      }
    });

    this.ws.on('close', () => {
      console.log('🔁 Bot kapandı, yeniden bağlanılıyor...');
      clearInterval(this.heartbeatInterval);
      setTimeout(() => this.connect(), 5000);
    });
  }

  setPresence(text = 'Hazırım!', type = 0, status = 'online') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠Bot açık değil, presence gönderilemiyor.');
      return;
    }

    this.ws.send(JSON.stringify({
      op: 3,
      d: {
        since: null,
        activities: [{ name: text, type }],
        status,
        afk: false,
      },
    }));
  }

  #normalizeEventName(name) {
    return name?.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  }
}
