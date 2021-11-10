const {Message} = require('discord.js');

module.exports = {
    name: 'edit',
    description: 'Edit a message previously posted by the bot. It must be in the same channel the command is run in.',
    usage: '[message id] [new contents]',
    cooldown: 3,
    guildOnly: true,
    staffOnly: true,
    args: true,

    async execute(message, [messageId, ..._], client) {
        let messageToEdit = new Message(client, null, message.channel);
        messageToEdit.id = messageId;
        messageToEdit = await messageToEdit.fetch();
        let newContents = /^[^ ]+ +[^ ]+(.*)$/s.exec(message.content)[1];
        await messageToEdit.edit(newContents);
        await message.delete();
    },
}
