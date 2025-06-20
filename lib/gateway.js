import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Events } from './bits.js';
import fetch from 'node-fetch';

const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

export class App extends EventEmitter {
  constructor({ intents }) {
    super();
    this.intents = intents;
    this.ws = null;
    this.seq = null;
    this.heartbeatInterval = null;
    this.token = null;
  }

  run(token) {
    if (!token) return console.error("❌ Token is not found");

    this.token = token;
    this.ws = new WebSocket(GATEWAY_URL);

    this.ws.on('open', () => {});

    let intents;
    if (Array.isArray(this.intents)) {
      intents = this.intents.reduce((a, b) => a | b, 0);
    } else {
      intents = this.intents;
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
          const patchedData = this.#patchEvent(d);
          if (Events[normalized]) {
            this.emit(Events[normalized], patchedData);
          } else {
            this.emit(t?.toLowerCase(), patchedData);
          }
          break;
        }
      }
    });

    this.ws.on('close', () => {
      console.log('🔁 Bağlantı koptu, yeniden bağlanılıyor...');
      clearInterval(this.heartbeatInterval);
      setTimeout(() => this.connect(this.token), 5000);
    });
  }

  async send(channelId, content) {
    const payload = typeof content === 'string' ? { content } : content;

    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Mesaj gönderilemedi: ${res.status} ${error}`);
    }

    return await res.json();
  }

  async reply(source, content) {
    const isInteraction = !!source.token && !!source.id && !!source.type;

    if (isInteraction) {
      const res = await fetch(`https://discord.com/api/v10/interactions/${source.id}/${source.token}/callback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 4,
          data: typeof content === 'string' ? { content } : content,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Interaction yanıtı gönderilemedi: ${res.status} ${error}`);
      }

      return true;
    }

    const payload = typeof content === 'string'
      ? { content, message_reference: { message_id: source.id } }
      : {
          ...content,
          message_reference: {
            message_id: source.id
          }
        };

    return await this.send(source.channel_id, payload);
  }

  setPresence(text = 'Hazırım!', type = 0, status = 'online') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠ Bot açık değil, presence gönderilemiyor.');
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

  #patchEvent(data) {
    const isInteraction = !!data.token && !!data.id && !!data.type;
    const hasChannel = !!data.channel_id;

    if (hasChannel) {
      data.send = (content) => this.send(data.channel_id, content);

      data.channel = {
        id: data.channel_id,
        send: (content) => this.send(data.channel_id, content),
      };
    }

    if (isInteraction) {
      data.reply = (content) => this.reply(data, content);
    }

    if (!isInteraction && hasChannel && data.id) {
      data.reply = (content) => this.reply(data, content);
    }

    return data;
  }
}
