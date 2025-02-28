# HTB-ObsidianTemplateHeader

A template header for HackTheBox writeups in obisidian. Simply name your note to the machine/challenge name and run the command with `Ctrl+p` and search 'HTB'.

**Note**: _Make sure to use the specific Active or Retired command for the relevant note._

_If there are any features you can think of adding let me know please :)_

### To do
- Sort retired machine tags to not break when there's a symbol in it

## Features

Can get both challenges and machines, split between retired and active.

### Active Machine
![image](https://github.com/user-attachments/assets/8e030168-240c-4fef-989e-e8d48fd69642)


### Retired Machine
![image](https://github.com/user-attachments/assets/3a597827-d533-4def-9f89-5bc4b3403b25)


### Challenge
![image](https://github.com/user-attachments/assets/6aa27ba8-e70d-40a1-b3d0-73fde317698b)

![image](https://github.com/user-attachments/assets/50b46f5a-04c5-4155-ab6c-1aeea27f8cc1)


# Installation

Git clone to your `YOURVAULT\.obsidian\plugins\`

So folder structure is:

```
.obsidian/
  ↳plugins/
    ↳HTB-TemplateGenerator/
      ↳main.js
      ↳manifest.json
```

Restart your Obsidian app and enable in Settings -> Community Plugins

Then in settings, look near the bottom where your plugins are and put your api key and desired writeup author name in the settings.

Get your HackTheBox api key from https://app.hackthebox.com/profile/settings 

**CREATE AN APP TOKEN** - _NOT YOUR HTB IDENTIFIER_
