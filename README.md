# HTB-ObsidianTemplateHeader

A template header for HackTheBox writeups in obisidian. Simply name your note to the machine/challenge name and run the command with `Ctrl+p` and search 'HTB'.

**Note**: _Make sure to use the specific Active or Retired command for the relevant note._

_If there are any features you can think of adding let me know please :)_



## Features

Can get both challenges and machines, split between retired and active.

New Feature, There is a command to copy the curl command to clipboard after putting in a challenge note that requires files. Put in the header first, a notification will prompt to let you know you can run the copy curl command to put in your terminal to download the zip.

Feel free to drop me a message on requested features.

### To do

- Create a more customtsable settings to allow custom list of row information about the machine/challenge and user profiles.
- Figure out a decent way to display ProLab headers

### Active Machine
![image](https://github.com/user-attachments/assets/ffaaf1e7-3e1e-47b5-a5dd-8b505298c19e)

### Retired Machine
![image](https://github.com/user-attachments/assets/24624cd5-1777-433d-b31e-4279f758951f)

### Challenge
![image](https://github.com/user-attachments/assets/3beb41d9-ff2a-4183-9870-be265124e09b)

![image](https://github.com/user-attachments/assets/c37a9269-d946-4693-9700-1c378e03b665)



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
