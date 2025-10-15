# 🎯 @burxk/discordjs

Minimal bir **Discord Client** — sade ve genişletilebilir bir Discord bot framework'ü.
**Discord.js** gibi büyük kütüphanelere alternatif, sadece ihtiyacın kadar!

---

## ✨ Özellikler

- ⚙️ Event sistemi (`client.on(Events.Ready)`)
- 📡 `setPresence()` gibi dinamik durum güncellemeleri
- 🪶 Hafif ve sade yapı (sadece core)

---

## 📦 Kurulum

```bash
npm i @burxk/discordjs
```

## 🔨​  Kullanım

```js
import { App } from "@burxk/discordjs"

const app = new App({intents})

app.run(token)
```

## 🛠️​​ Required flags

```js
import { Intents, Events, ActivityType, StatusType } from "@burxk/discordjs"

Intents.All => All intents

Events.Ready

ActivityType.Watching

StatusType.Idle
```

## 🔨​  Send message to channel

```js

// Send easy message

msg.reply()
interaction.send()


app.on(Events.MessageCreate, (msg)=> {

	if(msg.content = "hello") msg.send("welcome")
	
})
```

## Uses embed builder class

```js
import { EmbedBuilder } from "@burxk/discordjs"

new EmbedBuilder()
	  .setTitle('Slash Embed')
      .setDescription('Slash komutundan yanıt')
      .setColor('#ff66cc')
	  .build()
	 
// other
.setFooter()
.setAuthor()
```

