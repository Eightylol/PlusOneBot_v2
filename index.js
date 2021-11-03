const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const {Client, Intents} = require('discord.js')
const Discord = require('discord.js')
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

dotenv.config()

class Bot {
    token = null
    client = null

    clientId
    guildId

    intents = [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]

    lastError = ""

    commands
    commandFiles
    rest

    constructor() {
        this.absPath = __dirname
        
        if(!this.LoadDotEnv()) {
            console.log(this.lastError)
            process.exit()
        }
        this.InitClient()
        this.InitFiles()
        this.InitRest()
        
        
    }
        

    InitFiles() {
        this.commands = [];
        this.commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
        
        for (const file of this.commandFiles) {
            const command = require(`./commands/${file}`)
            this.commands.push(command.data.toJSON())
        }
    }
    
    InitRest() {
        this.rest = new REST({ version: '9' }).setToken(this.token);
        

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.')
        
                await this.rest.put(
                    Routes.applicationGuildCommands(this.clientId, this.guildId),
                    { body: this.commands },
                );
        
                console.log('Successfully reloaded application (/) commands.')
            } catch (error) {
                console.error(error)
            }
        })()
    }

    

    Start() {
        this.client.login(this.token)
    }

    InitClient() {
        this.client = new Client({
            intents:this.intents
        });
        this.client.commands = new Discord.Collection()
        this.client.on('ready', this.DiscordClientOnReady.bind(this))
        this.client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;
            const commandPath = './commands/'+interaction.commandName+'.js'
            if (fs.existsSync(commandPath)){
                require(commandPath).execute(interaction)
            }
        });
    }

    DiscordClientOnReady(client) {
        console.log(`Logged in as ${client.user?.tag}!`)
        this.SetPresence()
    }
                     
      

    SetPresence(presenceData = null) {
        const defaultPresenceData = {
            status:'dnd',
            activities:[
                {
                    name: 'PornHub',
                    type: 'WATCHING'
                },
                {
                    name: 'Games',
                    type: 'PLAYING'
                }
            ],
            afk:true
        }
        this.client.user.setPresence(presenceData ? presenceData : defaultPresenceData)
    }

    LoadDotEnv() {
        if(!fs.existsSync(`${process.cwd()+path.sep}.env`)) {
            this.lastError = `${process.cwd()+path.sep}.env doesn't exist!`
            return false
        }
        if(!process.env.CLIENT_TOKEN) {
            this.lastError = `CLIENT_TOKEN not set in ${process.cwd()+path.sep}.env`
            return false
        }
        if(!process.env.CLIENT_ID) {
            this.lastError = `CLIENT_ID not set in ${process.cwd()+path.sep}.env`
            return false
        }
        if(!process.env.GUILD_ID) {
            this.lastError = `GUILD_ID not set in ${process.cwd()+path.sep}.env`
            return false
        }
        this.clientId = process.env.CLIENT_ID
        this.guildId = process.env.GUILD_ID
        this.token = process.env.CLIENT_TOKEN
        return true
    }
}

const bot = new Bot()
bot.Start()