# FIRST TASKS

- [ ] Cleaner code, messages more centralized and homogeneous

- [ ] Sanitize thoroughly the inputs

- [ ] More ergonomic commands (eg, short version or alias) and any caps

- [ ] (configurable, ON/OFF) Send an appropriate copy of the TX messages to a different channel to serve as a TX log where
      another bot can extract useful statistics etc

- [ ] Support more tokens, preferably taken from the official Solana list (eg, SOLAB)

- [ ] Allow to set limits & settings for each token in a CONFIG file, make it so the bot doesn't have to be restarted when it changes

      Right now we are using this consts from CONFIG: SOL_FEE_LIMIT, SAIL_Emoji, gSAIL_Emoji, SOL_Emoji and
      some code (specific functions) to operate with a token and deal with min and max allowed amounts
      SOL:   MIN: 0.000001    MAX: 5
      SAIL:  MIN: 0.000001    MAX: 1000
      gSAIL: MIN: 0.000000001 MAX: 100

- [ ] Implement queueing to better deal with transactions exceeding RPC or Discord API limits

- [ ] Implement some checks during transactions including fat-finger protection or requiring confirmation in some cases (for large amounts)
