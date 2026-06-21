# Command Reference

Default prefix: `!` (configurable via `bot.prefix`).

**Permission levels:** `member`(0) · `vip`(10) · `helper`(20) · `moderator`(30)
· `administrator`(40) · `developer`(50) · `owner`(100). A player can use any
command whose required level is **≤** their own.

> Tip: in-game you can always run `!help` to see exactly which commands *you*
> are allowed to use, and `!help <command>` for details on any single one.

---

## General

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!help [command]` | `commands`, `cmds`, `h` | member | List commands or show help for one. |
| `!ping` | `p` | member | Check the bot is responsive (+ latency). |
| `!uptime` | — | member | Process + connection uptime. |
| `!about` | `info`, `botinfo` | member | About this bot. |
| `!stats` | `botstats` | member | Global bot statistics. |
| `!serverinfo` | `server`, `si` | member | Connected server + online players. |
| `!rules` | `rule` | member | Show server rules. |
| `!time` | `clock` | member | Real + in-game time. |
| `!vote` | — | member | Voting links + daily vote reward. |
| `!profile [player]` | `me` | member | View a profile; `setbio <text>` to edit yours. |
| `!rank [player]` | `ranks` | member | Show a rank; `list` to list all ranks. |
| `!seen <player>` | `lastseen` | member | When a player was last seen. |
| `!ai <question>` | `ask`, `gpt` | member | Ask the AI assistant (`reset` to clear memory). |

## Economy

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!balance [player]` | `bal`, `money`, `coins` | member | Check a balance. |
| `!daily` | — | member | Claim the daily reward. |
| `!work` | `job` | member | Earn coins on a cooldown. |
| `!gamble <amount\|all>` | `bet` | member | Risk coins to double them. |
| `!pay <player> <amount>` | `transfer`, `send` | member | Send coins to a player. |
| `!leaderboard` | `lb`, `baltop`, `top` | member | Richest players. |

## Fun

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!coinflip [h/t] [bet]` | `cf`, `flip` | member | Flip a coin, optionally bet. |
| `!roll [sides] [count]` | `dice`, `r` | member | Roll dice. |
| `!8ball <question>` | `eightball`, `8b` | member | Magic 8-ball. |
| `!joke` | `jokes` | member | Random joke. |
| `!fact` | `facts`, `randomfact` | member | Random Minecraft fact. |
| `!trivia [answer]` | `quiz` | member | Trivia question + reward. |
| `!guess [number]` | `guessgame` | member | Guess a 1–100 number. |
| `!rps <choice>` | `rockpaperscissors` | member | Rock-paper-scissors. |

## Messaging

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!say <text>` | `echo` | helper | Make the bot speak publicly. |
| `!msg <player> <text>` | `message`, `whisper`, `w`, `tell` | member | Private message via the bot. |
| `!reply <text>` | `r` | member | Reply to your last messenger. |

## Support

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!ticket ...` | `tickets` | member | `open <cat> <msg>` / `list` / `view <id>` / `reply <id> <text>` / `close <id>`. |
| `!report <player> <reason>` | — | member | Report a player to staff. |
| `!bug <description>` | `bugreport` | member | Submit a bug report. |
| `!suggest <idea>` | `suggestion`, `idea` | member | Submit a suggestion. |
| `!contact <message>` | `staffrequest`, `helpop` | member | Message all online staff. |
| `!faq [search]` | `faqs` | member | Browse/search the FAQ. |
| `!staff` | `stafflist`, `mods` | member | List online staff. |

## Teleport

> The bot must have server permission (OP) to run teleport commands.

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!tp <player>` | `teleport` | moderator | Teleport yourself to a player. |
| `!tpa <player>` | `tprequest` | member | Request to teleport to a player. |
| `!tpaccept` | `tpyes` | member | Accept a teleport request. |
| `!tpdeny` | `tpno` | member | Deny a teleport request. |
| `!sethome [name]` | — | member | Save your current spot as a home. |
| `!home [name]` | `homes` | member | Teleport home; `list` / `del <name>`. |
| `!warp <name>` | `warps` | member | Warp; staff: `set`/`del <name>`, `list`. |

## Moderation

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!kick <player> [reason]` | — | moderator | Kick a player. |
| `!mute <player> [dur] [reason]` | — | moderator | Mute (e.g. `10m`, `1h`, `1d`). |
| `!unmute <player>` | — | moderator | Unmute a player. |
| `!warn <player> <reason>` | — | helper | Warn (auto-kick at limit). |
| `!warnings <player>` | `warns` | helper | List a player's warnings. |
| `!clearwarnings <player>` | `clearwarns`, `unwarn` | moderator | Clear warnings. |
| `!slowmode <secs\|off>` | `slow` | moderator | Set chat slowmode. |
| `!announce <message>` | `ann` | moderator | Announcement. |
| `!broadcast <message>` | `bc` | administrator | Emphasised broadcast. |
| `!lockchat` | `chatlock` | moderator | Lock chat (non-staff blocked). |
| `!unlockchat` | `chatunlock` | moderator | Unlock chat. |
| `!purge [lines]` | `clearchat`, `cc` | moderator | Clear visible chat. |

## Owner / Admin

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!shutdown` | `stop` | owner | Stop the bot process. |
| `!restart` | `reconnect` | owner | Reconnect to the server. |
| `!reload` | `rl` | developer | Reload config/commands/plugins. |
| `!eval <code>` | — | owner | Run JS (opt-in via `bot.enableEval`). |
| `!exec <command>` | `run`, `cmd` | owner | Run a raw server command. |
| `!setrank <player> <rank>` | `rankset`, `promote` | administrator | Assign a rank. |
| `!removerank <player>` | `rankremove`, `demote` | administrator | Reset to default rank. |
| `!addadmin <player>` | — | owner | Grant administrator. |
| `!removeadmin <player>` | — | owner | Revoke administrator. |
| `!backup` | — | owner | Back up the database. |
| `!restore [name]` | — | owner | Restore from a backup. |
| `!maintenance <on\|off>` | `maint` | developer | Toggle maintenance mode. |
| `!config get\|set\|save\|reload` | `cfg` | owner | Inspect/edit config at runtime. |

## Plugin commands (from `example-plugin.js`)

| Command | Aliases | Perm | Description |
|---|---|---|---|
| `!hello` | `hi`, `hey` | member | Greeting from the example plugin. |
| `!flexrich` | — | member | Brag about your balance. |
