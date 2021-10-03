const fs = require('fs');
const path = require('path');
const configPath = path.resolve('./config.json');
const config = require(configPath);
const vettingLimitPath = path.resolve('./vettinglimit.json');
let vettingLimit = new Map();
if (fs.existsSync(vettingLimitPath)) {
  vettingLimit = require(vettingLimitPath);
}

// save disk space and increase readability
function prettyPrintJson() {
  const output = JSON.stringify(vettingLimit, function(k, v) {
    if (v instanceof Array) {
      return JSON.stringify(v);
    }
    return v;
  }, 2).replace(/\\/g, '')
    .replace(/"\[/g, '[')
    .replace(/\]"/g, ']')
    .replace(/"\{/g, '{')
    .replace(/\}"/g, '}');
  return output;
}

// Function to write to .json file
function writeData() {
  fs.writeFile(vettingLimitPath, prettyPrintJson(), function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

// This checks new messages in the server's lobby to see if anyone has generated a Ticket Tool panel, and stores the id if so
async function PublicVettingPanelCheck(message) {
  // Make sure the associated config settings are set
  if (!config.channelLobby || !config.channelInvLogs) {
    return;
  }

  // Proceed if things are open right now but there's no entry post detected yet
  if (vettingLimit.opened === 1 && vettingLimit.entryPost === 0) {
    // If someone used the command to generate a panel
    if (message.content.includes('$panel ')) {
      // Set a timer to delete the $panel command in 3 seconds
      setTimeout(function() {
        // After deleting the first post, start looking for the panel itself that should follow it
        message.delete().then(async () => {
          // The last post must be from a certain user: Ticket Tool
          let entryPostAuthor = '722196398635745312';
          // If we're on the dev server, use my ID instead of Ticket Tool
          if (message.guild.id == '674451358027350016') {
            entryPostAuthor = '261673576216789004';
          }

          // Proceed if the post author is the one we expect
          if (message.channel.lastMessage.author.id === entryPostAuthor) {
            // Set the entryPost to the panel we just found and write to the json
            vettingLimit.entryPost = message.channel.lastMessage.id;
            writeData();

            // Let 'em know we found it
            return await message.guild.channels.resolve(config.channelInvLogs).send(`🔓 Vetting Status: **Open**. Reason: Panel detected, **${vettingLimit.closesAt}** vet(s) left before closing`);
          }
        });
      }, 3000);
    }
    return;
  }
}

// This checks whether the defined vetting limit has been reached, and closes down vetting/deletes the panel if so
async function PublicVettingLimitCheck(channel, client) {
  // Make sure the associated config settings are set
  if (!config.airlockChannel || !config.channelLobby || !config.channelInvLogs) {
    return;
  }

  // Proceed if things are open right now and an entry post has been detected
  if (vettingLimit.opened === 1 && vettingLimit.entryPost) {

    // Increment the number of vets opened
    vettingLimit.curCount = parseInt(vettingLimit.curCount) + 1;
    writeData();

    // If the current amount of vets opened is more than the limit set,
    if (vettingLimit.curCount >= vettingLimit.closesAt) {

      // Get the lobby channel and and postid of the panel to delete
      const lobbyChannel = await client.channels.resolve(config.channelLobby);
      const entryPost = vettingLimit.entryPost;

      // Delete the associated panel message from the lobby channel, close things down, and respond
      await lobbyChannel.messages.delete(entryPost, 'closing airlock, limit reached').then(async () => {
        vettingLimit.opened = 0;
        writeData();
        return await client.channels.resolve(config.channelInvLogs).send('🔒 Vetting Status: **Closed**. Reason: Reached limit of **' + vettingLimit.closesAt + '** vet(s) since opening. Final vet opened was #' + channel.name);
      });
    }
  }
  return;
}

module.exports = {
  name: 'vettinglimit',
  aliases: ['vl', 'vetlimit'],
  description: 'Sets the limit for how many new vetting channels can occur before the panel is deleted',
  usage: `[Limit] - set the max vets before closing
  ${config.prefix}vettinglimit check - get the current vetting status
  ${config.prefix}vettinglimit cancel - cancel the process entirely`,
  cooldown: 3,
  guildOnly: true,
  staffOnly: false,
  args: false,
  async execute(message, args, client) {

    // Check for onboarder role
    if (!message.member.roles.cache.has('801587129905840128')) {
      return message.channel.send('Sorry, only onboarders can use this command!');
    }
      
    // Make sure all the necessary config settings are there
    if (!config.airlockChannel || !config.channelLobby || !config.channelInvLogs) {
      return message.channel.send('Please use `.config` to set up the vetting channel prefix, airlock/lobby channel, and invite logging channels');
    }
    // If a vetting limit is alraedy set, let people cancel the whole process
    if (args[0].toLowerCase() === 'cancel') {
      if (vettingLimit.opened === 1) {
        // Close things down, write to the json
        vettingLimit.opened = 0;
        writeData();

        // If no panel postid has been stored yet
        if (vettingLimit.entryPost === 0) {
          return message.channel.send('Vetting Status: The pending vetting limit has been canceled. No longer looking for a panel');
        }
        // If a panel is stored
        else {
          return message.channel.send('Vetting Status: The vetting limit has been canceled. The panel in the lobby will be left alone');
        }
      }
      // If vetting wasn't open to begin with
      else {
        return message.channel.send('Vetting Status: There\'s no vetting limit to cancel right now');
      }
    }

    // Let people check the current vetting status
    if (args[0].toLowerCase() === 'check' || args[0].toLowerCase() === 'status') {

      // If a vetting limit is set
      if (vettingLimit.opened === 1) {

        // If a panel has yet to be stored
        if (vettingLimit.entryPost === 0) {
          return message.channel.send(`🔓Vetting Status: **Waiting** (Reason: Panel not yet detected in lobby channel. Limit set to ${vettingLimit.closesAt}`);
        }
        // If things are fully open, give 'em the full status
        else {
          return message.channel.send(`🔓Vetting Status: **Open**. ${vettingLimit.curCount}/${vettingLimit.closesAt} vets started since opening`);
        }
      }
      // If vetting is closed
      else {
        return message.channel.send('🔒Vetting Status: **Closed**');
      }
    }

    // Make sure the arg is an integer
    if (!parseInt(args[0])) {
      return message.channel.send('I need to know how many vets (whole numbers only) should be allowed');
    }

    // If things are already opened up, they can change the limit
    if (vettingLimit.opened === 1) {
      const oldLimit = vettingLimit.closesAt;
      const newLimit = parseInt(args[0]);

      // If the number entered is higher than the current one, increase it
      // If the number entered is lower than the current one, but higher than the tickets opened so far, reduce it
      if (newLimit > oldLimit || ((newLimit < oldLimit) && (newLimit > vettingLimit.curCount))) {
        vettingLimit.closesAt = newLimit;
        writeData();
        return message.channel.send('The vet limit has been changed from ' + oldLimit + ' to ' + newLimit);
      }
      // If the new limit is less than the old limit, and more than the tickets opened so far, close it all out immediately
      else if ((newLimit < oldLimit) && (newLimit <= vettingLimit.curCount)) {

        // Get the lobby channel and associated post we're going to delete from it
        const lobbyChannel = await client.channels.resolve(config.channelLobby);
        const entryPost = vettingLimit.entryPost;

        // Delete the post, set vetting back to closed, and respond in the channel
        await lobbyChannel.messages.delete(entryPost, 'closing airlock, limit reached').then(async () => {
          vettingLimit.opened = 0;
          writeData();
          await client.channels.resolve(config.channelInvLogs).send('🔒 Vetting Status: **Closed**. Reason: Vetting limit (**' + newLimit + '**) was set lower than the number of vets already opened');
          await message.channel.send('🔒 Vetting Status: **Closed**. Reason: Vetting limit (**' + newLimit + '**) was set lower than the number of vets already opened. Deleting the associated message in the lobby channel');
        });
        return;
      }
      // If the limit is the same as the current one, there's no change necessary
      else {
        return message.channel.send('The limit you entered is the same as the old limit');
      }

    }

    // Set the vars for the json file
    vettingLimit.opened = 1;
    vettingLimit.entryPost = 0;
    vettingLimit.curCount = 0;
    vettingLimit.closesAt = parseInt(args[0]);
    writeData();

    // Aaand, respond
    message.channel.send('Okay! Once a panel is posted, vetting will be closed by deleting the panel in <#' + config.channelLobby + '> after ' + args[0] + ' more vet(s)');
  },
};

module.exports.VettingLimitCheck = PublicVettingLimitCheck;
module.exports.VettingPanelCheck = PublicVettingPanelCheck;