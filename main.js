
/* 
HackTheBox Writeup Header generator.

Made by Speer. v0.1.8

*/

const { Plugin, requestUrl, PluginSettingTab, Setting, TFile } = require("obsidian");

module.exports = class HTBTemplateGenerator extends Plugin {
    async onload() {
        console.log("HTB-TemplateGenerator Loaded!");

        await this.loadSettings();

        this.addSettingTab(new HTBSettingsTab(this));

        this.addCommand({
            id: "htb-template-active",
            name: "Machine:Active",
            editorCallback: (editor, view) => this.fetchActiveMachine(editor, view.file),
        });

        this.addCommand({
            id: "htb-template-retired",
            name: "Machine:Retired",
            editorCallback: (editor, view) => this.fetchRetiredMachine(editor, view.file),
        });

        this.addCommand({
            id: "htb-challenge-retired",
            name: "Challenge:Retired",
            editorCallback: (editor, view) => this.fetchChallengeRetired(editor, view.file),
        });

        this.addCommand({
            id: "htb-challenge",
            name: "Challenge:Active",
            editorCallback: (editor, view) => this.fetchChallenge(editor, view.file),
        });
        this.addCommand({
            id: "copy-challenge-download-curl",
            name: "Copy Challenge Zip command",
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) {
                    return false;
                }
        
                if (checking) return true;
        
                // Read the file contents to find the challenge link
                this.app.vault.read(activeFile).then(content => {
                    const match = content.match(/\[.*?\]\(https:\/\/app\.hackthebox\.com\/challenges\/(\d+)\)/);
        
                    if (!match || match.length < 2) {
                        new Notice("No valid challenge link found in the current note.");
                        return;
                    }
        
                    const challengeId = match[1];
                    const apiToken = this.settings.apiToken;
        
                    if (!apiToken) {
                        new Notice("API Token is missing in plugin settings.");
                        return;
                    }
        
                    const curlCommand = `curl 'https://www.hackthebox.com/api/v4/challenge/download/${challengeId}' -H 'Authorization: Bearer ${apiToken}' -o challenge.zip && unzip challenge.zip`;
        
                    navigator.clipboard.writeText(curlCommand).then(() => {
                        new Notice("Curl command copied to clipboard! Password is hackthebox");
                    }).catch(err => {
                        console.error("Failed to copy curl command:", err);
                        new Notice("Failed to copy to clipboard.");
                    });
                });
        
                return true;
            }
        });
        
        
    }

    async fetchChallenge(editor, file) {
        if (!this.settings.apiToken) {
            console.log("API Token is not set");
            editor.replaceSelection("\n> Error: API token not configured in settings.\n");
            return;
        }
    
        console.log(`Fetching Challenge data for: ${file.basename}`);
    
        const apiUrl = "https://labs.hackthebox.com/api/v4/challenge/list";
        try {
            const response = await requestUrl({
                url: apiUrl,
                headers: { Authorization: `Bearer ${this.settings.apiToken}` },
            });
    
            // Log full response
            console.log("Full API Response:", response.json);
    
            const challenges = response.json.challenges;
    
            if (!Array.isArray(challenges)) {
                console.error("Expected 'challenges' to be an array, but got:", typeof challenges);
                editor.replaceSelection("\n> **Error:** Invalid response format from HTB API.\n");
                return;
            }
    
            const challenge = challenges.find((c) => c.name.toLowerCase() === file.basename.toLowerCase());
    
            if (!challenge) {
                console.log(`Challenge '${file.basename}' not found in returned data.`);
                editor.replaceSelection(`\nNo HTB challenge found with the name: ${file.basename}\n`);
                return;
            }
    
            console.log("Found Challenge:", challenge);
    
            const challengeInfo = await this.fetchChallengeInfo(challenge.id);
            this.insertChallengeDetails(editor, challenge, challengeInfo);
        } catch (error) {
            console.error("Error fetching challenge data:", error);
            editor.replaceSelection("\n> **Error:** Failed to fetch HTB challenge data. Check console logs.\n");
        }
    }
    
    async fetchChallengeRetired(editor, file) {
        if (!this.settings.apiToken) {
            console.log("API Token is not set");
            editor.replaceSelection("\n> Error: API token not configured in settings.\n");
            return;
        }
    
        console.log(`Fetching Challenge data for: ${file.basename}`);
    
        const apiUrl = "https://labs.hackthebox.com/api/v4/challenge/list/retired";
        try {
            const response = await requestUrl({
                url: apiUrl,
                headers: { Authorization: `Bearer ${this.settings.apiToken}` },
            });

            console.log("Full API Response:", response.json);
            const challenges = response.json.challenges;
    
            if (!Array.isArray(challenges)) {
                console.error("Expected 'challenges' to be an array, but got:", typeof challenges);
                editor.replaceSelection("\n> **Error:** Invalid response format from HTB API.\n");
                return;
            }
    
            const challenge = challenges.find((c) => c.name.toLowerCase() === file.basename.toLowerCase());
    
            if (!challenge) {
                console.log(`Challenge '${file.basename}' not found in returned data.`);
                editor.replaceSelection(`\nNo HTB challenge found with the name: ${file.basename}\n`);
                return;
            }
    
            console.log("Found Challenge:", challenge);
    
            const challengeInfo = await this.fetchChallengeInfo(challenge.id);
            this.insertChallengeDetails(editor, challenge, challengeInfo);
        } catch (error) {
            console.error("Error fetching challenge data:", error);
            editor.replaceSelection("\n> **Error:** Failed to fetch HTB challenge data. Check console logs.\n");
        }
    }
    
    async fetchChallengeInfo(challengeId) {
        const apiUrl = `https://www.hackthebox.com/api/v4/challenge/info/${challengeId}`;
        try {
            const response = await requestUrl({
                url: apiUrl,
                headers: { Authorization: `Bearer ${this.settings.apiToken}` },
            });
            return response.json.challenge;
        } catch (error) {
            console.error("Error fetching challenge info:", error);
            return null;
        }
    }

    async insertChallengeDetails(editor, challenge, challengeInfo) {
        const category = challengeInfo.category_name.replace(/\s+/g, '-').toLowerCase();
        const avatarUrl = `https://app.hackthebox.com/images/icons/ic-challenge-categ/ic-${category}.svg`;
        const challengeLink = `[${challenge.name}](https://app.hackthebox.com/challenges/${challenge.id})`;
        const releaseDateISO = challengeInfo.release_date.split("T")[0];
        const [year, month, day] = releaseDateISO.split("-");
        const releaseDate = `${day}-${month}-${year}`;
        const points = challengeInfo.points;
        const description = challengeInfo.description;
        const writeupAuthor = this.settings.writeupAuthor || "a hooman, not a cat";

        let downloadCell = "No Files to Download";
        if (challengeInfo.download === true) {
            const downloadTrue = "Zip file available to download.";
            const downloadPass = "Password: `hackthebox`"
            new Notice("Run the copy command and paste in your terminal to download the zip!");
            const downloadName = challenge.name.replace(/\s+/g, '%2520')
            downloadCell = `[${downloadTrue}](https://app.hackthebox.com/challenges/${downloadName}) ${downloadPass}.`;
        }
    
        const avatarMarkdown = `<p align="center"><img src="${avatarUrl}" width="150"></p>`;

        function getSegmentedRatingBar(stars) {
            if (stars === null || stars === undefined) {
                return "No rating assigned";
            }
        
            const totalSegments = 5;
            const fullSegments = Math.floor(stars);          
            const partialFill = (stars % 1);
        
            let segmentsHTML = '<div style="display: flex; align-items: center; width: 100%;">';
            segmentsHTML += `<div style="margin-right: 10px; font-weight: bold; font-size: 0.9em; white-space: nowrap;">${stars} / 5.0  </div>`;
        
            segmentsHTML += `<div style="display: flex; gap: 3px; width: 85%;">`;
        
            for (let i = 0; i < totalSegments; i++) {
                if (i < fullSegments) {
                    segmentsHTML += `<div style="flex: 1; height: 20px; background-color: rgb(116, 174, 0); border-radius: 10px; border: 4px solid rgb(38, 49, 67);"></div>`;
                } else if (i === fullSegments && partialFill > 0) {
                    segmentsHTML += `<div style="flex: 1; height: 20px; position: relative; border-radius: 10px; overflow: hidden; border: 4px solid rgb(38, 49, 67);"><div style="position: absolute; top: 0; left: 0; height: 100%; width: ${partialFill * 100}%; background-color: rgb(116, 174, 0);"></div><div style="position: absolute; top: 0; left: ${partialFill * 100}%; height: 100%; width: ${100 - (partialFill * 100)}%; background-color: rgb(17, 25, 39);"></div></div>`;
                } else {
                    segmentsHTML += `<div style="flex: 1; height: 20px; background-color: rgb(17, 25, 39); border-radius: 10px; border: 4px solid rgb(38, 49, 67);"></div>`;
                }
            }
        
            segmentsHTML += `</div>`;
            segmentsHTML += `</div>`;
        
            return segmentsHTML;
        }
        
        const ratingHTML = getSegmentedRatingBar(challengeInfo.stars);

        const difficultyColor = {
            'Very Easy': 'rgb(160, 0, 255)',
            'Easy': 'rgb(159, 239, 0)',
            'Medium': 'rgb(255, 175, 0)',
            'Hard': 'rgb(255, 61, 74)',
            'Insane': 'rgb(164, 177, 205)'
        }[challengeInfo.difficulty] || 'rgb(255, 255, 255)';
    
        const difficulty = `<span style='color:${difficultyColor}; font-weight:bold;'>${challengeInfo.difficulty} [${points}]</span>`;
    

        const challengeTable = `
| ${avatarMarkdown} | <div style='text-align: center; font-size: 2em;'>${challengeLink}</div><br/><div style='text-align: center; font-size: 0.9em;'>Write up written by **${writeupAuthor}**</div> |
|-----------------|----------------|
| **Release Date** | ${releaseDate} |
| **Category** | ${challengeInfo.category_name} |
| **Difficulty** | ${difficulty} |
| **Rating** | ${ratingHTML} |
| **Files** | ${downloadCell} |
| **Description** | _${description}_ |

---

    `;
    
        editor.replaceSelection("\n" + challengeTable.trim() + "\n");
        
    }
    
    async loadSettings() {
        this.settings = Object.assign({ apiToken: "" }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async fetchActiveMachine(editor, file) {
        if (!this.settings.apiToken) {
            console.log("API Token is not set");
            editor.replaceSelection("\n> Error: API token not configured in settings.\n");
            return;
        }

        console.log(`Getting Active data for: ${file.basename}`);

        const apiUrl = "https://labs.hackthebox.com/api/v4/machine/paginated?page=1";
        try {
            const response = await requestUrl({
                url: apiUrl,
                headers: { Authorization: `Bearer ${this.settings.apiToken}` },
            });

            const machines = response.json.data;
            const machine = machines.find((m) => m.name.toLowerCase() === file.basename.toLowerCase());

            if (!machine) {
                editor.replaceSelection(`\nNo HTB machine found with the name: ${file.basename}\n`);
                return;
            }

            console.log("Machine found:", machine);
            this.insertMachineDetails(editor, machine);
        } catch (error) {
            console.error("Error fetching data:", error);
            editor.replaceSelection("\n> **Error:** Failed to fetch HTB data. Check console logs.\n");
        }
    }

    async fetchRetiredMachine(editor, file) {
        if (!this.settings.apiToken) {
            console.log("API Token is not set");
            editor.replaceSelection("\n> **Error:** API token not configured in settings.\n");
            return;
        }

        console.log(`Searching for Retired machine: ${file.basename}`);

        const maxPages = 28;
        for (let page = 1; page <= maxPages; page++) {
            const apiUrl = `https://labs.hackthebox.com/api/v4/machine/list/retired/paginated?page=${page}`;
            try {
                const response = await requestUrl({
                    url: apiUrl,
                    headers: { Authorization: `Bearer ${this.settings.apiToken}` },
                });

                const machines = response.json.data;
                const machine = machines.find((m) => m.name.toLowerCase() === file.basename.toLowerCase());

                if (machine) {
                    // all the debugging makes me want to throw my keyboard - speer
                    console.log("Retired Machine found:", machine);
                    this.insertMachineDetails(editor, machine);
                    return;
                }
            } catch (error) {
                console.error(`Error fetching retired machine data on page ${page}:`, error);
            }
        }

        editor.replaceSelection(`\n> No Retired HTB machine found with the name: **${file.basename}**\n`);
    }


// Commented out this so people can put own tags. Old feature, may bring back if HTB add tags after Feb 2024.
/*async fetchMachineTags(machineId) {
    const tagsUrl = `https://www.hackthebox.com/api/v4/machine/tags/${machineId}`;
    try {
        const response = await requestUrl({
            url: tagsUrl,
            headers: { Authorization: `Bearer ${this.settings.apiToken}` },
        });
        const tagMapping = {
            // Categories
            "Mobile": "Category",
            "Forensics": "Category",
            "Vulnerability Assessment": "Category",
            "Person": "Category",
            "Cloud": "Category",
            "Threat Intelligence": "Category",
            "Web Application": "Category",
            "Enterprise Network": "Category",
            "Security Operations": "Category",
            "Niche Technologies": "Category",
            "Incident Response": "Category",
        
            // Areas of Interest
            "Databases": "Area",
            "Browser": "Area",
            "Common Applications": "Area",
            "Custom Applications": "Area",
            "Active Directory": "Area",
            "Common Services": "Area",
            "Virtualization": "Area",
            "Protocols": "Area",
            "Telecom": "Area",
            "Client Side": "Area",
            "Host": "Area",
            "Log Analysis": "Area",
            "Steganography": "Area",
            "Source Code Analysis": "Area",
            "Common Security Controls": "Area",
            "Cryptography": "Area",
            "Security Tools": "Area",
            "Authentication": "Area",
            "Social Engineering": "Area",
            "Programming": "Area",
            "Azure": "Area",
            "AWS": "Area",
            "Kubernetes": "Area",
            "Broken Authentication and Authorization": "Area",
            "Session Management and Hijacking": "Area",
            "Injections": "Area",
            "Wireless": "Area",
            "Malware Analysis": "Area",
            "Software & OS exploitation": "Area",
            "Reverse Engineering": "Area",
            "AI/ML": "Area",
            "Log Management": "Area",
            "Intrusion Detection": "Area",
            "Network Traffic Analysis (NTA)": "Area",
            "Threat Hunting": "Area",
            "Server Side": "Area",
            "Disk": "Area",
            "Memory": "Area",
            "Network": "Area",
            "Mobile Devices": "Area",
            "Data Analysis": "Area",
            "Protocol Analysis": "Area",
            "Documentation Review": "Area",
            "GCP": "Area",
            "Automotive": "Area",
            "IoT": "Area",
            "Blockchain": "Area",
            "ICS/Scada": "Area",
            "Satellite": "Area",
            "Preparation": "Area",
            "Detection and Identification": "Area",
            "Containment and Eradication": "Area",
            "Communication and Notification": "Area",
            "Evidence Gathering and Preservation": "Area",
            "Analysis and Triage": "Area",
            "Recovery and Restoration": "Area",
            "Post-Incident Review and Improvement": "Area",
            "Legal and Regulatory Compliance": "Area",
            "Intrusion Prevention": "Area",
            "Anomaly Detection": "Area",
            "User and Entity Behavior Analytics (UEBA)": "Area",
            "File Integrity Monitoring (FIM)": "Area",
            "Data Loss Prevention (DLP) Monitoring": "Area",
            "Endpoint Detection and Response (EDR)": "Area",
            "Technical": "Area",
            "Indicators of Compromise (IoC)": "Area",
            "Threat Actor": "Area",
            "Dark Web": "Area",
            "Open-Source Threat Intelligence (OSINT)": "Area",
        
            // Vulnerabilities
            "SQL Injection": "Vulnerability",
            "Buffer Overflow": "Vulnerability",
            "Local File Inclusion": "Vulnerability",
            "Remote File Inclusion": "Vulnerability",
            "Arbitrary File Read": "Vulnerability",
            "Weak Credentials": "Vulnerability",
            "Remote Code Execution": "Vulnerability",
            "Clear Text Credentials": "Vulnerability",
            "OS Command Injection": "Vulnerability",
            "Arbitrary File Upload": "Vulnerability",
            "Directory Listing": "Vulnerability",
            "Deserialization": "Vulnerability",
            "Path Normalization": "Vulnerability",
            "XXE Injection": "Vulnerability",
            "Cross Site Scripting (XSS)": "Vulnerability",
            "Group Membership": "Vulnerability",
            "Server Side Request Forgery (SSRF)": "Vulnerability",
            "Weak Authentication": "Vulnerability",
            "Information Disclosure": "Vulnerability",
            "Code Execution": "Vulnerability",
            "Cross Site Request Forgery (CSRF)": "Vulnerability",
            "Host Header Injection": "Vulnerability",
            "File System Configuration": "Vulnerability",
            "Default Credentials": "Vulnerability",
            "Insecure Direct Object Reference (IDOR)": "Vulnerability",
            "Misconfiguration": "Vulnerability",
            "Server Side Template Injection (SSTI)": "Vulnerability",
            "Prototype Pollution Injection": "Vulnerability",
            "Arbitrary File Write": "Vulnerability",
            "Directory Traversal": "Vulnerability",
            "Cross-Origin Resource Sharing (CORS)": "Vulnerability",
            "Argument Injection": "Vulnerability",
            "Weak Permissions": "Vulnerability",
            "Log Poisoning": "Vulnerability",
            "Code Injection": "Vulnerability",
            "HQL Injection": "Vulnerability",
            "Race Condition": "Vulnerability",
            "TicketTrick": "Vulnerability",
            "Weak Cryptography": "Vulnerability",
            "Anonymous/Guest Access": "Vulnerability",
            "CRLF Injection": "Vulnerability",
            "Hard-coded Credentials": "Vulnerability",
            "NoSQL Injection": "Vulnerability",
            "XPath Injection": "Vulnerability",
            "Path Hijacking": "Vulnerability",
            "Format String": "Vulnerability",
            "PHP type juggling": "Vulnerability",
            "Heap Overflow": "Vulnerability",
            "Cross Site Websocket Hijacking (CSWH)": "Vulnerability",
            "SQL Truncation": "Vulnerability",
            "Sensitive Data Exposure": "Vulnerability",
            "LDAP Injection": "Vulnerability",
            "Zone Transfer": "Vulnerability",
            "Autologon Credentials": "Vulnerability",
            "Command Execution": "Vulnerability",
            "Execution After Redirect (EAR)": "Vulnerability",
            "HTTP request smuggling": "Vulnerability",
            "Server Side Includes (SSI) Injection": "Vulnerability",
            "SpEL Expression Injection": "Vulnerability",
            "Mass Assignment": "Vulnerability",
            "Business Logic": "Vulnerability",
            "Port Knocking": "Vulnerability",
            "Insecure Design": "Vulnerability",
            "Improper Input Validation": "Vulnerability",
            "HTML Injection": "Vulnerability",
            "PostScript injection": "Vulnerability",
            "Integer Overflow": "Vulnerability"
        };
        const tagsData = response.json.info;
        if (!tagsData) return { categories: "None", areas: "None", vulnerabilities: "None" };

        let categories = [];
        let areas = [];
        let vulnerabilities = [];

        for (const tagObj of Object.values(tagsData)) {
            let originalTag = tagObj.name;
            let processedTag = originalTag;

            const match = originalTag.match(/\(([^)]+)\)/);
            if (match) {
                const insideParens = match[1]; 
                const afterParens = originalTag.split(')').pop().trim(); 
                
                if (afterParens) {
                    processedTag = `${insideParens} ${afterParens}`;
                } else {
                    processedTag = insideParens;
                }
            }
            processedTag = processedTag.replace(/&/g, 'and');
            const formattedTag = `#HTB-${processedTag.replace(/\s+/g, '-')}`;

            const tagType = tagMapping[originalTag];

            if (tagType === "Category") {
                categories.push(formattedTag);
            } else if (tagType === "Area") {
                areas.push(formattedTag);
            } else if (tagType === "Vulnerability") {
                vulnerabilities.push(formattedTag);
            }
        }

        return {
            categories: categories.length ? categories.join(", ") : "Not yet assigned.",
            areas: areas.length ? areas.join(", ") : "Not yet assigned.",
            vulnerabilities: vulnerabilities.length ? vulnerabilities.join(", ") : "Not yet assigned."
        };
    } catch (error) {
        console.error("Error fetching machine tags:", error);
        return { 
            categories: "Not yet assigned.", 
            areas: "Not yet assigned.", 
            vulnerabilities: "Not yet assigned." 
        };
    }
}*/

async fetchMachineInfo(machineId) {
    if (!this.settings.apiToken) {
        console.log("API Token is not set");
        return null;
    }
    
    const apiUrl = `https://www.hackthebox.com/api/v4/machine/profile/${machineId}`;
    try {
        const response = await requestUrl({
            url: apiUrl,
            headers: { Authorization: `Bearer ${this.settings.apiToken}` },
        });
        return response.json.info;
    } catch (error) {
        console.error("Error fetching machine info:", error);
        return null;
    }
}

async insertMachineDetails(editor, machine) {
    if (!machine.id) {
        console.error("Machine ID is missing:", machine);
        editor.replaceSelection(`\n> Error: No ID found for machine **${machine.name}**\n`);
        return;
    }

    const machineInfo = await this.fetchMachineInfo(machine.id);
    if (!machineInfo) {
        console.error("Machine details not retrieved:", machine);
        editor.replaceSelection(`\n> Error fetching machine details for **${machine.name}**\n`);
        return;
    }

    const avatarUrl = `https://labs.hackthebox.com${machine.avatar}`;
    const machineLink = `[${machine.name}](https://app.hackthebox.com/machines/${machine.name})`;
    const releaseDateISO = machine.release.split("T")[0];
    const [year, month, day] = releaseDateISO.split("-");
    const releaseDate = `${day}-${month}-${year}`;
    const os = machine.os;
    const writeupAuthor = this.settings.writeupAuthor || "a hooman, not a cat";
    const avatarMarkdown = `<img src="${avatarUrl}" width="200">`;

    function getSegmentedRatingBar(stars) {
        if (!stars) return "No rating assigned";
        
        const totalSegments = 5;
        const fullSegments = Math.floor(stars);
        const partialFill = (stars % 1);
        
        let segmentsHTML = '<div style="display: flex; align-items: center; width: 100%;">';
        segmentsHTML += `<div style="margin-right: 10px; font-weight: bold; font-size: 0.9em; white-space: nowrap;">${stars} / 5.0</div>`;
        segmentsHTML += `<div style="display: flex; gap: 3px; width: 85%;">`;
        
        for (let i = 0; i < totalSegments; i++) {
            if (i < fullSegments) {
                segmentsHTML += `<div style="flex: 1; height: 20px; background-color: rgb(116, 174, 0); border-radius: 10px; border: 4px solid rgb(38, 49, 67);"></div>`;
            } else if (i === fullSegments && partialFill > 0) {
                segmentsHTML += `<div style="flex: 1; height: 20px; position: relative; border-radius: 10px; overflow: hidden; border: 4px solid rgb(38, 49, 67);"><div style="position: absolute; top: 0; left: 0; height: 100%; width: ${partialFill * 100}%; background-color: rgb(116, 174, 0);"></div><div style="position: absolute; top: 0; left: ${partialFill * 100}%; height: 100%; width: ${100 - (partialFill * 100)}%; background-color: rgb(17, 25, 39);"></div></div>`;
            } else {
                segmentsHTML += `<div style="flex: 1; height: 20px; background-color: rgb(17, 25, 39); border-radius: 10px; border: 4px solid rgb(38, 49, 67);"></div>`;
            }
        }
        segmentsHTML += `</div>`;
        segmentsHTML += `</div>`;
        
        return segmentsHTML;
    }

    const ratingHTML = getSegmentedRatingBar(machineInfo.stars);

    const difficultyColor = {
        'Easy': 'rgb(159, 239, 0)',
        'Medium': 'rgb(255, 175, 0)',
        'Hard': 'rgb(255, 61, 74)',
        'Insane': 'rgb(164, 177, 205)'
    }[machine.difficultyText] || 'rgb(255, 255, 255)';

    const difficulty = `<span style='color:${difficultyColor}; font-weight:bold;'>${machine.difficultyText} [${machine.static_points}]</span>`;

    const machineTable = `
| ${avatarMarkdown} | <div style='text-align: center; font-size: 2em;'>${machineLink}</div><br/><div style='text-align: center; font-size: 0.9em;'>Write up written by **${writeupAuthor}**</div> |
|-----------------|----------------|
| **Box IP** |  |
| **Release Date** | ${releaseDate} |
| **OS** | ${os} |
| **Difficulty** | ${difficulty} |
| **Public Rating** | ${ratingHTML} |
| **Custom Tags** |  |

---
`;

    editor.replaceSelection("\n" + machineTable.trim() + "\n");
}

    async loadSettings() {
        this.settings = Object.assign({ apiToken: "", writeupAuthor: "" }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
};

class HTBSettingsTab extends PluginSettingTab {
    constructor(plugin) {
        super(plugin.app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "HTB Template Generator Settings" });

        new Setting(containerEl)
            .setName("HTB API Token")
            .setDesc("Enter your HackTheBox API token.")
            .addText((text) =>
                text.setPlaceholder("Paste API token here...")
                    .setValue(this.plugin.settings.apiToken)
                    .onChange(async (value) => {
                        this.plugin.settings.apiToken = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Writeup Author")
            .setDesc("This will be the name used for writeups.")
            .addText((text) =>
                text.setPlaceholder("Put your name here")
                    .setValue(this.plugin.settings.writeupAuthor)
                    .onChange(async (value) => {
                        this.plugin.settings.writeupAuthor = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
