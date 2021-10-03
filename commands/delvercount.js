const path = require('path');
const moment = require('moment-timezone');
const configPath = path.resolve('./config.json');
const config = require(configPath);

module.exports = {
  name: 'delvercount',
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

  // Make sure that all the prune data's up to date if anyone has joined or left the server
  const dataLogger = require(path.resolve('./datalog.js'));
  dataLogger.PruneDataMaintenance(client);

  // Setup the inactivity variable and intiailize the users-to-prune array
  let maxTimeSinceActive = 1;
  const totalActive = new Array();
  const heHim = new Array();

  // For discord snowflake processing
  const discordEpoch = BigInt(1420070400000);

  // Initialize the pruneStorage map. No need to import an "old one"- we'll be starting anew either way? maybe i'll change my mind and check for the file instead
  const pruneStorage = new Map();

  // Make sure there's data to even process
  if(!global.dataLog[message.guild.id].pruneData || global.dataLogLock == 1) {
    return message.channel.send('There\'s either no prune data right now, or the datalog is still caching');
  }

  await message.guild.members.fetch();

// Get a current timestamp and user activity data
  const currentTime = moment();
  const pruneData = new Map(global.dataLog[message.guild.id].pruneData.sort((a, b) => b[1][0] - a[1][0]));
  
  

  // Loop through the prune data, generating the spreadsheet and prune array for later
  for (const usr of pruneData) {
    const memberObj = await message.guild.member(usr[0]);

    // Make sure we can even manage this user
    if ((!memberObj.manageable || (config.roleComrade && !memberObj.roles.cache.has(config.roleComrade)))) {continue;}
    // Initialize the vars for the last post ID and whether this member is excluded
    const lastPost = usr[1][0];

    const usrObj = memberObj.user;

    // Set defaults and intialize
    let dateLastActive = 'N/A';
    let formattedDateLastActive;

    // If the user's last post date isn't "never", format in general and for the spreadsheet
    if (lastPost !== 0) {
      const lastPostUnixDate = Number((BigInt(lastPost) >> BigInt(22)) + discordEpoch);
      dateLastActive = moment(lastPostUnixDate);
      formattedDateLastActive = moment(lastPostUnixDate).toDate();
    }
    else {
      formattedDateLastActive = dateLastActive;
    }

    // If the last active date isn't n/a, check it against the inactivity limit set
    if (dateLastActive !== 'N/A') {
      const timeSinceLastActive = moment.duration(currentTime.diff(dateLastActive)).asMonths();
      if (timeSinceLastActive > maxTimeSinceActive) {break;}
    }

    const otherRoles = await message.guild.roles.cache.filter(role => role.name !== 'he/him' && (role.name.includes('/') || role.name.toLowerCase().includes('pronoun'))).sort((a, b) => a.name.localeCompare(b.name));

    totalActive.push((usr[0]));

    // Check for he/him
    if (memberObj.roles.cache.has('683057715823902725')) {
      let exclusive = 1;
      for (otherRole of otherRoles) {
        if (memberObj.roles.cache.has(otherRole.id)) {
          exlusive = 0;
        }
      }
      if (exclusive === 1) {
        heHim.push((usr[0]));
      }
    }
  }

  // If nobody is in the list, there's nothing else to do
  if (totalActive.length === 0) {
    return message.channel.send(`It seems no members satisfy this criteria**.`);
  }
  
  return message.channel.send(`Out of members active in the last month, **${heHim.length}/${totalActive.length}** (${round(heHim.length / totalActive.length)}%) are exclusively he/him`);
  },	
};