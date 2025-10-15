export default class EmbedBuilder {
  constructor() {
    this.embed = {};
  }

  setTitle(title) {
    this.embed.title = title;
    return this;
  }

  setDescription(desc) {
    this.embed.description = desc;
    return this;
  }

  setColor(hex) {
    this.embed.color = typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex;
    return this;
  }

  setFooter(text, icon) {
    this.embed.footer = { text };
    if (icon) this.embed.footer.icon_url = icon;
    return this;
  }

  setAuthor(name, icon, url) {
    this.embed.author = { name };
    if (icon) this.embed.author.icon_url = icon;
    if (url) this.embed.author.url = url;
    return this;
  }

  addField(name, value, inline = false) {
    if (!this.embed.fields) this.embed.fields = [];
    this.embed.fields.push({ name, value, inline });
    return this;
  }

  build() {
    return this.embed;
  }
}
