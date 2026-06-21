# Minecraft Support Bot

A production-ready **support, utility, moderation, economy and entertainment bot
for offline-mode (cracked) Minecraft servers**. It connects as a normal player
using [mineflayer](https://github.com/PrismarineJS/mineflayer), listens to chat,
and responds to `!` commands — think of it as a Discord bot, but living inside
Minecraft chat.

It includes automatic reconnection, a permission/rank system, a virtual economy,
a ticket/report support system, moderation tools, fun games, a JSON database, a
plugin architecture, and an optional built-in AI assistant powered by
[OpenRouter](https://openrouter.ai/).

---

## ✨ Features

- **Always online** — auto-connect, auto-reconnect with exponential backoff,
  auto-rejoin after kicks/crashes/deaths, and anti-AFK.
- **Command framework** — every command declares name, description, aliases,
  usage, cooldown, permission level and category.
- **Permission system** — 7 inheriting ranks (Member → Owner) with anti-escalation
  protection and config-bootstrapped owners.
- **Economy** — balances, `!daily`, `!work`, `!gamble`, `!pay`, leaderboards.
- **Support** — tickets, reports, bug reports, suggestions, FAQ, staff contact.
- **Moderation** — kick, mute, warn (auto-kick), slowmode, lockchat, purge, etc.
- **Owner tools** — reload, restart, shutdown, backup/restore, config editing,
  maintenance mode, and (opt-in) eval/exec.
- **Fun** — coinflip, dice, 8-ball, jokes, facts, trivia, number guessing, RPS.
- **Teleport** — `!tp`, `!tpa`/`!tpaccept`/`!tpdeny`, `!home`/`!sethome`, `!warp`.
- **AI** — `!ai <question>` with short conversational memory (OpenRouter).
- **Anti-spam & rate limiting**, category-based logging (chat, joins, commands,
  economy, moderation, tickets), and a JSON database with autosave + backups.
- **Plugin architecture** — drop a file in `src/plugins/` to add commands and
  event listeners without editing any core file.

---

## 📦 Requirements

- **Node.js 18+** (developed on Node 22)
- An offline-mode / "cracked" Minecraft server you have permission to use.
- (Optional) An OpenRouter API key for the AI commands.

---

## 🚀 Installation

```bash
# 1. Clone and enter the project
git clone <your-repo-url> minecraft-support-bot
cd minecraft-support-bot

# 2. Install dependencies
npm install

# 3. Generate config files + runtime folders
npm run setup

# 4. Edit your configuration
#    - config/config.json  -> set server.host, server.username, bot.owners
#    - .env (optional)      -> set OPENROUTER_API_KEY for AI

# 5. Start the bot
npm start
```

During development you can use `npm run dev` (auto-restarts on file changes).

---

## ⚙️ Configuration

All settings live in `config/config.json` (copied from
`config/config.example.json`). Secrets and connection details can also be set in
`.env`, which **overrides** the JSON file:

| `.env` variable      | Overrides                |
|----------------------|--------------------------|
| `MC_HOST`            | `server.host`            |
| `MC_PORT`            | `server.port`            |
| `MC_USERNAME`        | `server.username`        |
| `MC_VERSION`         | `server.version`         |
| `OPENROUTER_API_KEY` | `ai.apiKey`              |
| `OPENROUTER_MODEL`   | `ai.model`               |

Key fields to set on first run:

```jsonc
{
  "server": { "host": "play.example.net", "port": 25565, "username": "SupportBot" },
  "bot":    { "prefix": "!", "owners": ["YourMinecraftName"] }
}
```

> **Owners** listed in `bot.owners` always have the `owner` rank, so you can
> never lock yourself out.

Ranks are defined in `config/ranks.json` (copied from `ranks.example.json`).
Each rank has a numeric `level`; a player may run any command whose required
level is **≤** their own level (this is how inheritance works).

### Enabling `eval`

`!eval` is **disabled by default** because it allows arbitrary code execution.
To enable it, set `"enableEval": true` inside the `bot` object in
`config/config.json`. Only do this if you understand the risk and trust every
`owner`.

### Teleport & moderation commands

The bot issues server commands like `/tp`, `/kick`, `/mute` **as itself**, so it
must have the appropriate permissions (usually OP) on your server. The exact
command formats are configurable under `config.teleport` and
`config.moderation` so you can adapt them to vanilla, EssentialsX, or any other
plugin. `!sethome`/`!warp set` read a player's position from the bot's view, so
the player must be within render distance of the bot.

---

## 🗂️ Project structure

```
minecraft-support-bot/
├── package.json
├── README.md
├── .env.example
├── .gitignore
├── config/
│   ├── config.example.json     # copy -> config.json
│   └── ranks.example.json      # copy -> ranks.json
├── scripts/
│   ├── setup.js                # npm run setup
│   └── backup.js               # npm run backup
├── docs/
│   └── COMMANDS.md             # full command reference
└── src/
    ├── index.js                # entry point — boots everything
    ├── core/
    │   ├── Bot.js              # mineflayer wrapper, reconnect, send queue
    │   ├── Logger.js           # timestamped + category logging
    │   ├── ConfigManager.js    # config + ranks loading, env overrides
    │   ├── Database.js         # JSON document store, autosave, backups
    │   ├── PermissionManager.js
    │   ├── EconomyManager.js
    │   ├── AntiSpam.js
    │   ├── AIManager.js        # OpenRouter integration
    │   ├── CommandManager.js   # framework: load/register/dispatch
    │   └── PluginLoader.js
    ├── commands/
    │   ├── general/  economy/  fun/  support/
    │   ├── teleport/ moderation/ messaging/ owner/
    ├── plugins/
    │   └── example-plugin.js
    ├── data/                   # static content (jokes, facts, trivia)
    └── utils/                  # helpers, teleport + moderation builders
```

Runtime data is written to `data/`, `logs/` and `backups/` (all git-ignored).

---

## 🎮 Usage examples

```
!help                     # list commands you can use
!help gamble              # detailed help for one command
!balance                  # check your coins
!daily                    # claim your daily reward
!work                     # earn coins
!gamble 100               # risk 100 coins
!pay Steve 50             # send 50 coins to Steve
!coinflip heads 50        # bet on a coin flip
!trivia                   # start a trivia question, then: !trivia <answer>
!ticket open bug The shop is broken
!report Griefer destroying spawn
!tpa Steve                # ask to teleport to Steve; they !tpaccept
!sethome base             # save your current spot (stand near the bot)
!ai how do I make a beacon?

# Staff
!mute Spammer 10m flooding chat
!warn Steve breaking rules
!slowmode 5
!announce Event starting in 5 minutes!

# Owner
!setrank Steve moderator
!maintenance on
!backup
!reload
```

---

## 🧩 Writing a plugin

Create `src/plugins/my-plugin.js`:

```js
export default {
  name: 'my-plugin',
  version: '1.0.0',
  async load(api) {
    api.registerCommand({
      name: 'wave',
      description: 'Wave at everyone.',
      category: 'fun',
      permission: 0,
      cooldown: 5,
      async execute(ctx) {
        ctx.bot.sendMessage(`${ctx.sender} waves at everyone! 👋`);
      }
    });
  }
};
```

It loads automatically on startup, or run `!reload` in-game. See
[`src/plugins/example-plugin.js`](src/plugins/example-plugin.js) for a full
example including event listeners.

---

## 🛡️ Security notes

- Permissions are enforced in the dispatcher **before** a command runs and cannot
  be bypassed by aliases or arguments.
- Rank changes are anti-escalation protected: you can't grant or modify a rank
  at or above your own level.
- All player-supplied arguments used in server commands are validated
  (`isValidUsername`) and sanitised (control characters / newlines stripped) to
  prevent command injection through the bot.
- `!say`, `!announce` and `!broadcast` refuse messages starting with `/`.
- `!eval` is opt-in and owner-only; `!exec` is owner-only.

---

## 📚 Full command reference

See [`docs/COMMANDS.md`](docs/COMMANDS.md) for every command, its aliases,
permission level and usage.

---

## 📝 License

MIT — see headers in source files.
