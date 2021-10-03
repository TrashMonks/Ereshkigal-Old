const path = require('path');
const configPath = path.resolve('./config.json');
const config = require(configPath);

module.exports = {
  name: 'ivything',
  description: 'heehoo it\'s the ivy thing',
  usage: '',
  cooldown: 3,
  guildOnly: true,
  staffOnly: true,
  args: false,
  async execute(message, args, client) {

    function round(number) {
      return Math.round(((number * 100) + Number.EPSILON) * 100) / 100;
    }

    let content = '__**Delvers with airlock roles: **__\n';

    await message.guild.members.fetch();

    // Get total # of members with and without at least one pronoun role
    const delversWithAirlockRoles = await message.guild.members.cache.filter(u => u.roles.cache.has(config.roleComrade) && (u.roles.cache.has('787866090713776179') || u.roles.cache.has('768770661840846858')) && !u.user.bot);// .sort((member, member2) => (member.user.joinedAt).localeCompare(member2.user.joinedAt));
    // console.log(airlockMembersWithPronounRoles.size);

    for (const member of delversWithAirlockRoles) {
      if (content.length <= 1975) {
        content += (`<@${member[1].id}>, `);
      }
      else {
        message.channel.send(content);
        content = (`<@${member[1].id}>, `);
      }
    }
    message.channel.send(content);

  },
};