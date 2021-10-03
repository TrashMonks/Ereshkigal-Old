const path = require('path');
const configPath = path.resolve('./config.json');
const config = require(configPath);

module.exports = {
  name: 'vetgen',
  description: 'Shows the stats for how many people are using pronoun roles on your server',
  usage: '',
  cooldown: 3,
  guildOnly: true,
  staffOnly: true,
  args: false,
  async execute(message, args, client) {

    function round(number) {
      return Math.round(((number * 100) + Number.EPSILON) * 100) / 100;
    }

    let content = '__**Airlock users with pronoun roles:**__\n';
    let patcontent = '__**Airlock patrons with pronoun roles:**__\n';

    await message.guild.members.fetch();
    // Detect pronoun roles by searching for ones with a slash in them. Might update this later to let people exclude certain roles ig? This is fine for our purposes right now
    const pronounRoles = await message.guild.roles.cache.filter(role => role.name.includes('/') || role.name.toLowerCase().includes('pronoun')).sort((a, b) => a.name.localeCompare(b.name));

    // Get total # of members with and without at least one pronoun role
    const airlockMembersWithPronounRoles = await message.guild.members.cache.filter(u => u.roles.cache.find(r => pronounRoles.find(pronounRole => pronounRole === r)) && !u.roles.cache.has(config.roleComrade) && !u.roles.cache.has('573296557256867853') && !u.user.bot);// .sort((member, member2) => (member.user.joinedAt).localeCompare(member2.user.joinedAt));
    const airlockPatronsWithPronounRoles = await message.guild.members.cache.filter(u => u.roles.cache.find(r => pronounRoles.find(pronounRole => pronounRole === r)) && !u.roles.cache.has(config.roleComrade) && u.roles.cache.has('573296557256867853') && !u.user.bot);// .sort((member, member2) => (member.user.joinedAt).localeCompare(member2.user.joinedAt));
    // console.log(airlockMembersWithPronounRoles.size);

    for (const member of airlockMembersWithPronounRoles) {
      if (content.length <= 1975) {
        content += (`<@${member[1].id}>, `);
      }
      else {
        message.channel.send(content);
        content = (`<@${member[1].id}>, `);
      }
    }
    message.channel.send(content);

    for (const member of airlockPatronsWithPronounRoles) {
      if (patcontent.length <= 1975) {
        patcontent += (`<@${member[1].id}>, `);
      }
      else {
        message.channel.send(patcontent);
        patcontent = (`<@${member[1].id}>, `);
      }
    }
    message.channel.send(patcontent);
  },
};