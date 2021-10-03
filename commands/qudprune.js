const fs = require('fs');
const path = require('path');
const configPath = path.resolve('./config.json');
const config = require(configPath);
const moment = require('moment-timezone');
const wait = require('util').promisify(setTimeout);

function kickUser (user, reason) {
  //user.send(`You've been kicked from **${user.guild.name}** with reason: "${reason}"`);
  user.send(`You've been kicked from **Caves of Qud** with reason: "${reason}"`);
}

module.exports = {
  name: 'qudprune',
  description: "Lists all members of an airlock role, and offers to kick the ones that haven't finished onboarding after one week",
  usage: '',
  cooldown: 3,
  guildOnly: true,
  staffOnly: true,
  args: false,
async execute(message, args, client) {
  // function to create a message collector.
  async function msgCollector() {
    // let responses = 0;
    let reply = false;
    // create a filter to ensure output is only accepted from the author who initiated the command.
    const filter = input => (input.author.id === message.author.id);
    await message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] })
      // this method creates a collection; since there is only one entry we get the data from collected.first
      .then(collected => reply = collected.first())
      .catch(collected => message.channel.send('Sorry, I waited 30 seconds with no response, please run the command again.'));
    // console.log('Reply processed...');
    return reply;
  }

  
  //const currentGuildUsrs = await g.members.fetch().then(members => members.filter(member => !member.user.bot));
  /*
  <message>.guild.members.fetch().then(fetchedMembers => {
  const totalOnline = fetchedMembers.filter(member => member.presence.status === 'online');
  */
 const ROLEID = '768770661840846858'; //live
// const ROLEID = ['674744267444322326']; //dev
 

/*
message.guild.members.prune({ dry: true, count:true,b days: 1, roles: ['674744267444322326'],  reason: 'im pruney!' })
.then(pruned => console.log(`I just pruned ${pruned} people!`))
.catch(console.error);
*/
 //find(element => element.property === value);
 //const promises = await message.guild.members.fetch(ROLEID).members;//.then('768770661840846858').members;
 //const members = await Promise.all(promises)
 const fullMemberList = await message.guild.members.fetch();
 const promises  = await message.guild.members.cache.filter(u => !u.roles.cache.has(config.roleComrade) && !u.user.bot);
 const airlockUsers = await Promise.all(promises)
/*
 const promises = await message.guild.roles.cache.get(ROLEID).members;
 const members = await Promise.all(promises);
 const promises2 = await message.guild.roles.cache.get(ROLEID).members;
 const members2 = await Promise.all(promises2)
 */
 //return console.log(promises);
    message.channel.send('Users in airlock (no delver role) **' + (airlockUsers.length) + '**');
    
//  message.channel.send('This will prune **' + (airlockUsers.length) + '** people. Are you sure?');
/*
      let reply = await msgCollector();
      if (!reply) { return; }
      if (reply.content.toLowerCase() == 'n' || reply.content.toLowerCase() == 'no') {
        return message.channel.send('Prune canceled');
      }
      else if (reply.content.toLowerCase() == 'y' || reply.content.toLowerCase() == 'yes') {
        message.channel.send(`Alright, beginning the prune`);
        let i = 0;
        let toKick = setInterval(async function() {
          const memberObj = await message.guild.member(members[i][0]);
          const usrObj = memberObj.user;
          //console.log('Kicked: ' + memberObj.nickname);
          //member.send(`You've been kicked from **Caves of Qud** with reason: "please consider rejoining in a week when we're not getting raided"`);
          kickUser(usrObj, "we've had a major, major influx of new users recently, please consider rejoining in a week if you're still interested!");
          setTimeout(function() {
            memberObj.kick("pruned after sseth influx");
          }, 1000);
          if (i == members.length) {
            //if (i == 0) {
            clearInterval(toKick);
          }
          i++;
        }, 15000);
      }

*/


  /*
  message.guild.roles.cache.get('768770661840846858').members.forEach(m => {
    // Your kick methodology, i.e. m.kick(), m being the member from the array.
    write("\nkicking " + m);
    await(3000);
    //delay(3000).then(() => process.stdout.write("\nkicking " + members[i][0]));
});
*/
  
  /*
  let i = 0;
  while (i < members.length) {
    wait(1000);
    process.stdout.write("\nkicking " + members[i][0]);
    i++;
  }
  */
  
}
};