"use strict";

window.onload = init;

var outputtext = "";
var allowTags = false;

const _amp = /\&/g;
const _quot = /\"/g;
const _ampo = /\'/g;
const _lt = /\</g;
const _gt = /\>/g;
const ServicesBots = ["NICKSERV", "CHANSERV", "MEMOSERV", "OPERSERV", "HELPSERV", "HOSTSERV", "BOTSERV", "CALSPRITE", "RANDOMENCOUNTER"]
//const sanitizer = new Sanitizer(allowElements=['span'])
const _chumhandle = /^([a-z]+[A-Z][a-z]*)$/;
const _ctag_begin = /(<|&#60;)c=(.*?)(>|&#62;)/g;
const _ctag_end = /(<|&#60;)\/c(>|&#62;)/g;
const _ctag_rgb = /(\d+,\d+,\d+)/g;
const _ctag_hex = /#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3})/g;
const _ctag_rgbhex = /(\d+,\d+,\d+)|(#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3}))/g;
const _color_msg = /^COLOR (>|&#62;)(\d+,\d+,\d+)$/;
const _color_msg_rgb = /\d+,\d+,\d+/;
const _memomsg_start = /^((<|&#60;)c=((\d+,\d+,\d+)|(#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3})))(>|&#62;)[A-Z]*[A-Z]*:\s)/g;
const _memoprefix = /^(&|#)/;
const _initials = /[A-Z]*[A-Z]*:\s/;
//const _evil_rule_im_so_sorry = /^(<|&#60;)c=(.*?)(>|&#62;)-- .+ (<|&#60;)c=(.*?)(>|&#62;)\[..\]<\/c> .+ pestering .+ (<|&#60;)c=(.*?)(>|&#62;)\[..\]<\/c> at \d\d:\d\d --<\/c>$/gi;
const _evil_rule_im_so_sorry = /.*--.+\[..\].+\[..\].+\d\d:\d\d --.*/gi;
const _url = /\b(https:\/\/(\w|\d|\.|\/)*)/gi;
const _user_prefix = /^(@|&#38;|~|&|\+)+/;
const _escapeable = /&|"|'|<|>/g;
const _smilies = /:rancorous:|:apple:|:bathearst:|:cathearst:|:woeful:|:sorrow:|:pleasant:|:blueghost:|:slimer:|:candycorn:|:cheer:|:duhjohn:|:datrump:|:facepalm:|:bonk:|:mspa:|:gun:|:cal:|:amazedfirman:|:amazed:|:chummy:|:cool:|:smooth:|:distraughtfirman|:distraught:|:insolent:|:bemused:|:3:|:mystified:|:pranky:|:tense:|:record:|:squiddle:|:tab:|:beetip:|:flipout:|:befuddled:|:pumpkin:|:trollcool:|:jadecry:|:ecstatic:|:relaxed:|:discontent:|:devious:|:sleek:|:detestful:|:mirthful:|:manipulative:|:vigorous:|:perky:|:acceptant:|:olliesouty:|:billiards:|:billiardslarge:|:whatdidyoudo:|:brocool:|:trollbro:|:playagame:|:trollc00l:|:suckers:|:scorpio:|:shades:|:honk:/g;

function init() {
    const connectButton = document.getElementById('connectButton');
    const handleInput = document.getElementById('handle');
    const connectForm = document.getElementById('connectForm');
    
    connectButton.addEventListener('click', function (event) {
        event.stopPropagation();
        event.preventDefault();
        runCheck();
    }
    );
    connectForm.addEventListener('submit', function (event) {
        event.stopPropagation();
        event.preventDefault();
        runCheck();
    }
    );

    // Default value
    const tagCheck = document.getElementById('allowUnsafeTags');
    if (tagCheck != null) {
        tagCheck.checked = false;
    }
}

function runCheck() {
    // Get Handle
    let handleInput = document.getElementById('handle');

    if (_chumhandle.test(handleInput.value) == true) {
        // Valid chumhandle
        run();
    }
    else {
        // Invalid chumhandle
        alert("NOT A VALID CHUMTAG.")
    }
}

function run() {
    // Get Handle
    const handleInput = document.getElementById('handle');
    var handle = handleInput.value;

    // Get escape-allowed setting
    const tagCheck = document.getElementById('allowUnsafeTags');
    if (tagCheck != null) {
        allowTags = tagCheck.checked;
    }
    
    // Create client + connect
    var irc = new ircClient(handle);
    irc.connect()
    
     // Connection opened
    irc.socket.addEventListener('open', function (event) {
        irc.register();
    });
    
    // Data incoming
    irc.socket.addEventListener('message', function (event) {
        // *ALL* input is sanitized now, the rest of the code needs to account for this.
        parseIRC(irc, gui, sanitizeHTML(event.data));
    });

    // Disconnected
    irc.socket.addEventListener('close', function (event) {
        alert("Disconnected, pls reload page :("
            + `\n    code: ${event.code}`
            + `\n    reason: ${event.reason}`
            + `\n    wasClean: ${event.wasClean}`
        );
        gui.dead = true;
        let msgElm = document.getElementById('msg');
        msgElm.disabled = true;
        msgElm.className += " inactive";
    });
    
    // Create gui
    var gui = new clientGUI();
    gui.clear()
    gui.tabify()
    gui.nick = handle;
    
    const msg = document.getElementById('msgform');
    msg.addEventListener('submit', function (event) {
        event.stopPropagation();
        event.preventDefault();
        sendMsg(irc, gui, event)
    });

    const maintab = document.getElementById('maintab');
    maintab.addEventListener('scroll', function (event) {
        updatePartButtonPos(gui);
    })

    const manualJoinForm = document.getElementById('manualJoinForm');
    //const manualJoinInput = document.getElementById('manualJoinInput');
    manualJoinForm.addEventListener('submit', function (event) {
        event.stopPropagation();
        event.preventDefault();
        let manualJoinInput = document.getElementById('manualJoinInput');
        let memostr = manualJoinInput.value;
        irc.join(`#${memostr}`);
        manualJoinInput.value = '';
        gui.memolist = [];
        irc.list();
    })


    const partButton = document.getElementById('part');
    partButton.addEventListener('click', function (event) {
        let activeTab = gui.tabs.filter(tab => tab.active == true);
        for (let i = 0; i < activeTab.length; i++) {
            // Should only trigger once

            // Del tab button
            let tabButton = document.getElementById(activeTab[i].label);
            tabButton.remove();

            // Hide part button
            event.currentTarget.style.display = 'none';

            // Part / Cease
            if (activeTab[i].memo == true) {
                irc.part(activeTab[i].label);
            }
            else {
                irc.msg(activeTab[i].label, "PESTERCHUM:CEASE")
            }

            // Remove tab
            gui.tabs.splice(gui.tabs.indexOf(activeTab[i]), 1);

            // Disabled
            setTabEnabled(gui, false)
        }
    }
    )
    connectMemoUserlistSwitch(irc, gui);
}

function sendMsg(irc, gui, event) {
    let msgInput = document.getElementById('msg');
    let nick = irc.handle;
    let initials = getInitials(nick);
    
    //let msg = msgInput.value;
    //let baremsg = msg;
    let msg;
    let baremsg;
    let splitMsg = msgInput.value.match(/.{1,361}/g);
    //msg = '<c=' + gui.color + '>' + initials + ': ' + baremsg + '</c>';
    for (let q = 0; q < splitMsg.length; q++) {
        msg = splitMsg[q];
        baremsg = msg;
        if ((msg.indexOf('/me ') != 0) && (msg.indexOf("/me's ") != 0)) {
            msg = `<c=${gui.color}>${initials}: ${baremsg}</c>`;
        }

        // Send to who?
        for (let n = 0; n < gui.tabs.length; n++) {
            if (gui.tabs[n].active == true) {
                if (gui.tabs[n].memo == true)
                {
                    irc.msg(gui.tabs[n].label, msg);
                }
                else {
                    irc.msg(gui.tabs[n].label, baremsg);
                }
                msg = sanitizeHTML(msg)
                msg = parsePesterchumSyntax(null, gui.tabs[n].label, msg);
                if (msg.indexOf('/me ') == 0) {
                    if (gui.tabs[n].memo == true) {
                        msg = `<span style='color: rgb(100,100,100)'>-- CURRENT ${nick} <span style='color: ${gui.color};'>[C${getInitials(nick)}]</span> ${msg.slice('/me '.length)} --</span>`;
                    }
                    else {
                        msg = `<span style='color: rgb(100,100,100)'>-- ${nick} <span style='color: ${gui.color};'>[${getInitials(nick)}]</span> ${msg.slice('/me '.length)} --</span>`;
                    }
                }
                else if (msg.indexOf("/me's ") == 0) {
                    if (gui.tabs[n].memo == true) {
                        msg = `<span style='color: rgb(100,100,100)'>-- CURRENT ${nick}'s <span style='color: ${gui.color};'>[C${getInitials(nick)}'S]</span> ${msg.slice("/me's ".length)} --</span>`;
                    }
                    else {
                        msg = `<span style='color: rgb(100,100,100)'>-- ${nick}'s <span style='color: ${gui.color};'>[${getInitials(nick)}'S]</span> ${msg.slice("/me's ".length)} --</span>`;
                    }
                }
                gui.tabs[n].tabcontent += `<div>${msg}</div>`
                gui.updateTabs();
            }
        }
    }
    msgInput.value = ''; // clear
}

function getInitials(nick) {
    // Initials
    let initials = nick[0].toUpperCase();
    for (let i = 0; i < nick.length; i++) {
        if (nick[i] == nick[i].toUpperCase()) {
            initials += nick[i]
            break;
        }
    }
    if (initials.length == 1) {
        initials += nick[0].toUpperCase();
    }
    return initials;
}

function time() {
    // Returns current time as 00:00
    let currentdate = new Date();
    let hour = String(currentdate.getHours());
    let minute = String(currentdate.getMinutes());
    let timeStamp = '';
    //console.log('hour', typeof(hour), hour.length)
    if (hour.length == 1) {
        // 1:XX --> 01:XX
        timeStamp += `0${hour}`;
    }
    else {
        // 11:XX
        timeStamp += hour;
    }
    timeStamp += ':';
    if (minute.length == 1) {
        // XX:1 --> XX:01
        timeStamp += `0${minute}`;
    }
    else {
        // XX:11
        timeStamp += minute;
    }

    // XX:XX
    return timeStamp;
}

function parseIRC(irc, gui, data) {
    // Parse IRC message
    // message ::= ['@' <tags> SPACE] [':' <source> SPACE] <command> <parameters> <crlf>
    console.log('Received message from server ', data);
    let parts = data.split(' ');
    let source = '';
    let command = '';
    let params = [];
    if (parts[0][0] == ':') {
        // Has source
        source = parts[0]
        command = parts[1]
        if (parts.length > 1) {
            params = parts.slice(2)
        }
    }
    else {
        // No source
        command = parts[0]
        if (parts.length > 0) {
            params = parts.slice(1)
        }
    }
    // Scope is fucked
    let client = '';
    let channel = '';
    let target = '';
    let msgparts = '';
    let msg = '';
    let users = 0;
    let sourcenick = '';
    let urls = [];
    let srcInitials = '';
    let targetInitials = '';
    let updateQue = [];

    switch (command) {
        // Commands
        case "PING":
            irc.send('PONG ' + params[0]);
            break;
        case "PRIVMSG":
            // Incoming message
            // :[source] PRIVMSG [target] msg
            sourcenick = source.slice(1).split('!')[0];
            target = params[0]
            msgparts = params.slice(1)
            //console.log('Incoming PRIVMSG ', params);
            // If #pesterchum, return
            if (target == '#pesterchum') {
                return;
            }
            // Reassemble message
            msg = msgparts[0]
            if (msg[0] == ':') {
                msg = msg.slice(1)
            }
            for (let i = 1; i < msgparts.length; i++) {
                msg += ' ' + msgparts[i]
            }

            if (msg == "PESTERCHUM:BEGIN") {
                //-- Horse [HH] began pestering Horse [HH] at 07:19 --
                srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`;
                targetInitials = `<c=${gui.chums.getColor(target)}>[${getInitials(target)}]</c>`;
                msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} began pestering ${target} ${targetInitials} at ${time()} --</c>`;
            }
            else if (msg == "PESTERCHUM:CEASE") {
                srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`;
                targetInitials = `<c=${gui.chums.getColor(target)}>[${getInitials(target)}]</c>`;
                msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} ceased pestering ${target} ${targetInitials} at ${time()} --</c>`;
            }
            else if (msg == "PESTERCHUM:IDLE") {
                srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`;
                msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} is now an idle chum! --</c>`;
            }
            else if (msg.indexOf('/me ') == 0) {
                //msg = "-- CURRENT " + sourcenick + " [] " + msg.slice(4) + " --"
                if (_memoprefix.test(target[0])) {
                    srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[C${getInitials(sourcenick)}]</c>`;
                }
                else {
                    srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`;
                }
                msg = `<c=100,100,100>-- CURRENT ${sourcenick} ${srcInitials} ${msg.slice(4)} --</c>`;
            }
            else if (msg.indexOf("/me's ") == 0) {
                if (_memoprefix.test(target[0])) {
                    srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[C${getInitials(sourcenick)}'S]</c>`;
                }
                else {
                    srcInitials = `<c=${gui.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}'S]</c>`;
                }
                msg = `<c=100,100,100>-- CURRENT ${sourcenick}'s ${srcInitials} ${msg.slice(6)} --</c>`;
            }
            else if (_color_msg.test(msg) == true) {
                //let cMatch = msg.match(_ctag_rgb)
                let color = msg.match(_color_msg_rgb);
                console.log('color: ' + color)
                gui.chums.setColor(sourcenick, color);
                return;
            }
            else if (msg.indexOf("PESTERCHUM:") != -1) {
                return;
            }

            let start = msg.match(_memomsg_start)
            if (start != null) {
                let color = start[0].match(_ctag_rgbhex)[0]
                //console.log('wpp', color)
                gui.chums.setColor(sourcenick, color)
            }
            gui.addText(gui, sourcenick, target, msg)
            gui.updateTabs()
            connectButtonEvents(irc, gui)
            break;
        case "NOTICE":
            // Incoming message
            // :[source] PRIVMSG [target] msg
            sourcenick = source.slice(1).split('!')[0];
            target = params[0]
            msgparts = params.slice(1)
            if (msgparts.length > 1) {
                channel = msgparts[0].replace(/:|\[|\]/g, '');
                msg = data.slice(data.indexOf(msgparts[0].slice(1))); // Data from & incl. channel
                urls = msg.match(_url);
                //console.log('urls: ', urls)
                if (urls != null) {
                    for (let i = 0; i < urls.length; i++) {
                        msg = msg.replaceAll(urls[i], `<a href=${urls[i]}>${urls[i]}</a>`);
                    }
                }
                //console.log(sourcenick, target, msgparts, channel, msg)
                for (let n = 0; n < gui.tabs.length; n++) {
                    if (gui.tabs[n].label.toLowerCase() == channel.toLowerCase()) {
                        gui.tabs[n].tabcontent += `<div><span style='color: grey;'>${msg}</span></div>`;
                    }
                    else if ((gui.tabs[n].label.toLowerCase() == sourcenick.toLowerCase()) && (ServicesBots.indexOf(sourcenick.toUpperCase()) != -1)) {
                        // Services messages
                        if (((msg.indexOf('Unknown command') != -1) && (msg.indexOf('PESTERCHUM:BEGIN') != -1)) == false) {
                            gui.tabs[n].tabcontent += `<div><span style='color: black;'>${msg}</span></div>`;
                        }
                    }
                }
                gui.updateTabs();
            }

            break;
        case "KILL":
            // Kicked
            if (params.length > 0) {
                let reason = params.slice(1);
                //if (reason[0] == ':') {
                //    reason = reason.split(':')[1]
                //}
                alert("USER WAS KICKED FROM SERVER"
                    + `\n    HANDLE: ${params[0]}`
                    + `\n    REASON: ${reason}`
                )
            }
            else {
                alert("USER WAS KICKED FROM SERVER")
            }
            break;
        case "ERROR":
            // About to be disconnected
            alert(data)
            break;
        case "JOIN":
            // hewwo,,
            sourcenick = source.slice(1).split('!')[0];
            console.log("sourcenick: " + sourcenick)
            for (let i = 0; i < params.length; i++) {
                console.log("params[i]:", params[i])
                if ((params[i] != ":#pesterchum") && (params[i] != "#pesterchum")) {
                    irc.names(params[i]);
                }
            }
            break;
        case "PART":
            // goo b,,
            sourcenick = source.slice(1).split('!')[0];
            updateQue = gui.tabs.filter(tab => tab.userlist.indexOf(sourcenick) != -1);
            updateQue = updateQue.filter(tab => params.indexOf(tab.label) != -1);
            for (let i = 0; i < updateQue.length; i++) {
                //CMM ceased responding to memo.
                let leaveMsg = `<span style='color: black;'>C${getInitials(sourcenick)}</span> <span style='color: #646464;'>ceased responding to memo.</span>`;
                updateQue[i].tabcontent += `<div>${leaveMsg}</div>`

                updateQue[i].userlist = [];
                irc.names(updateQue[i].label)
            }
            break;
        case "QUIT":
            // goo b,,
            sourcenick = source.slice(1).split('!')[0];
            updateQue = gui.tabs.filter(tab => tab.userlist.indexOf(sourcenick) != -1);
            //updateQue = gui.tabs.filter(tab => tab.label != "#pesterchum");
            for (let i = 0; i < updateQue.length; i++) {
                updateQue[i].userlist = [];
                irc.names(updateQue[i].label)

                //CMM ceased responding to memo.
                let leaveMsg = `<span style='color: black;'>C${getInitials(sourcenick)}</span> <span style='color: #646464;'>ceased responding to memo.</span>`;
                updateQue[i].tabcontent += `<div>${leaveMsg}</div>`
            }
            break;
        case "MODE":
            // mode,,
            // OP status may have changed
            updateQue = gui.tabs.filter(tab => tab.label == params[0]);
            for (let i = 0; i < updateQue.length; i++) {
                updateQue[i].userlist = [];
                irc.names(updateQue[i].label)
            }
            break;
        // Numerical replies
        case "001":
            // RPL_WELCOME
            irc.join("#pesterchum.online");
            //irc.join("#want_to_make_a_new_chum")
            //irc.join("#want_to_make_a_new_rp")
            //irc.join("#TestingZone");
            //irc.join("#TestingZone2");
            //irc.join("#TestingZone3");
            irc.join("#pesterchum");
            irc.list();
            irc.send("METADATA * set mood 0");
            irc.send("METADATA * set color " + gui.color);
            break;
        case "322":
            // RPL_LIST
            // "<channel> <# visible> :<topic>"
            channel = params[1];
            users = params[2];
            if (channel == "#pesterchum") {
                return;
            }
            gui.memolist.push([channel, users])
            //console.log(gui.memolist)
            break;
        case "323":
            // RPL_LISTEND
            if (gui.MemosTabOpen == true) {
                gui.updateMemolist(irc, gui)
            }
            break;
        case "353":
            // RPL_NAMREPLY
            // "<channel> :[[@|+]<nick> [[@|+]<nick> [...]]]"
            channel = params[2];
            if (params[3][0] == ':') {
                params[3] = params[3].slice(1)
            }
            users = params.slice(3);

            if (channel != "#pesterchum") {
                gui.openChannelTab(channel);
                // Add user to list if not present
                for (let n = 0; n < gui.tabs.length; n++) {
                    if (gui.tabs[n].label == channel) {
                        for (let i = 0; i < users.length; i++) {
                            if (gui.tabs[n].userlist.indexOf(users[i]) == -1)
                            {
                                gui.tabs[n].userlist.push(users[i]);
                                //console.log(gui.tabs[n].userlist);
                            }
                        }
                    }
                }
            } else {
                for (let i = 0; i < users.length; i++) {
                    let user = users[i].replace(_user_prefix, '')
                    if (gui.userlist.indexOf(user) == -1)
                    {
                        gui.userlist.push(user);
                        //console.log(gui.userlist);
                    }
                }

            }
            gui.updateTabs();
            break;
        case "366":
            // RPL_ENDOFNAMES
            client = params[0]
            channel = params[1]
            if (channel == "#pesterchum") {
                irc.msg("#pesterchum", "MOOD >0")
                if (gui.MemosTabOpen == false) {
                    gui.updateUserlist(irc, gui)
                }
            }
            else {
                gui.openChannelTab(channel);
                gui.updateTabs();
                connectButtonEvents(irc, gui);
            }
            updateMemoUserlist(gui, channel);
            break;
        case "433":
            alert("TH4T H4NDL3 1S T4K3N 4LR34DY >:[")
        }
}

class chum {
    constructor (handle, color) {
        this.handle = handle;
        this.color = color;
        this.mood = 0;
    }
}

class chums {
    constructor () {
        this.chums = [];
    }

    setColor (handle, color) {
        let chumMatches = this.chums.filter(chum => chum.handle == handle);
        //console.log(chumMatches)
        if (chumMatches.length > 0) {
            // Change color for matches
            for (let i = 0; i < chumMatches.length; i++) {
                chumMatches[i].color = color;
            }
        }
        else {
            // New chum
            this.chums.push(new chum(handle, color))
        }
        //console.log(this.chums)
    }

    getColor (handle) {
        let chumMatches = this.chums.filter(chum => chum.handle == handle);
        if (chumMatches.length > 0) {
            return chumMatches[0].color;
        }
        else {
            return "0,0,0";
        }
    }
}

class memoConvoTab {
    constructor (source, target, label) {
        this.target = target; // To who
        this.source = source; // From who
        this.tabcontent = ''; // All msges
        this.userlist = [];   // Array of users present
        this.announced = [];
        this.active = false;
        
        if (label == null) {
            if (_memoprefix.test(target[0])) {
                this.memo = true;
                this.label = target;
            }
            else {
                this.memo = false;
                if (source[0] == ':')
                {
                    this.label = source.slice(1).split('!')[0];
                }
                else
                {
                    this.label = source.split('!')[0];
                }
            }
        }
        else {
            this.label = label;
            this.memo = false;
        }
    }
}

function connectMemoUserlistSwitch(irc, gui) {
    let uButton = document.getElementById('userlistButton');
    let mButton = document.getElementById('memolistButton');

    uButton.addEventListener('click', function (event) {

        if (event.currentTarget.className.indexOf(" active") == -1) {
            event.currentTarget.className += " active";
        }
        mButton.className = mButton.className.replace(" active", "");
        gui.MemosTabOpen = false;
        gui.updateUserlist(irc, gui)
        gui.userlist = [];
        irc.names("#pesterchum")
    }
    )
    mButton.addEventListener('click', function (event) {
        if (event.currentTarget.className.indexOf(" active") == -1) {
            event.currentTarget.className += " active";
        }
        uButton.className = uButton.className.replace(" active", "");
        gui.MemosTabOpen = true;
        gui.updateMemolist(irc, gui);
        gui.memolist = [];
        irc.list();
    }
    )
}

function updateMemoUserlist (gui, channel) {
    let targetTab = gui.tabs.filter(tab => tab.label == channel);
    for (let n = 0; n < targetTab.length; n++) {
        if (targetTab[n].active == true) {
            //document.getElementById('textarea').innerHTML = targetTab[n].tabcontent;
            const memoUserList = document.getElementById('memoUserlist');
            memoUserList.innerHTML = '';
            targetTab[n].userlist.sort();
            for (let m = 0; m < targetTab[n].userlist.length; m++) {
                let usrStr = `<div class="memoChumContainer"><div class='memoChum'>${targetTab[n].userlist[m]}</div></div>`;
                usrStr = usrStr.replace('@', "<img class='userstatus' height='16px' width='16px' alt='op' src='img/op.png'> ")
                usrStr = usrStr.replace(/&#38;|&/, "<img class='userstatus' height='16px' width='16px' alt='admin' src='img/admin.png'> ")
                usrStr = usrStr.replace('+', "<img class='userstatus' height='16px' width='16px' alt='voice' src='img/voice.png'> ")
                usrStr = usrStr.replace('~', "<img class='userstatus' height='16px' width='16px' alt='founder' src='img/founder.png'> ")
                //console.log(usrStr)
                //memoUserList.innerHTML += usrStr;
                memoUserList.insertAdjacentHTML("beforeend", usrStr);
            }
        }
    }
}

function updatePartButtonPos (gui) {
    let partButton = document.getElementById('part');
    let activeTab = gui.tabs.filter(tab => tab.active == true);
    for (let i = 0; i < activeTab.length; i++) {
        // Should only trigger once
        partButton.style.display = 'inline';
        let label = activeTab[i].label;
        let elm = document.getElementById(label);
        let elmRect = elm.getBoundingClientRect();
        partButton.style.left = (elmRect.right - 20) + 'px';
        //partButton.style.top = (elmRect.y + 4) + 'px';
        partButton.style.top = (((elmRect.bottom - elmRect.y) / 2) + 4) + 'px'; // the +4 is to offset the magin/padding
    }
}

function connectButtonEvents (irc, gui) {
    let tablinks = gui.maintab.getElementsByClassName('tablinks'); // Tab buttons
    //let parts = gui.maintab.getElementsByClassName('part');        // Close tab buttons
    let parts = [];
    for (let i = 0; i < tablinks.length; i++) {
        let button = tablinks[i]
        button.addEventListener('click', function (event) {
            let buttontext = event.currentTarget.innerHTML;
            for (let n = 0; n < gui.tabs.length; n++) {
                //console.log("gui.tabs[n].label == buttontext", gui.tabs[n].label, buttontext)
                if (gui.tabs[n].label == buttontext) {
                    while(gui.textarea.firstChild) {
                        gui.textarea.removeChild(gui.textarea.firstChild);
                    }
                    gui.textarea.insertAdjacentHTML("beforeend", gui.tabs[n].tabcontent);
                    const memoUserList = document.getElementById('memoUserlist');
                    while(memoUserList.firstChild) {
                        memoUserList.removeChild(memoUserList.firstChild);
                    }
                    gui.tabs[n].userlist.sort();
                    for (let m = 0; m < gui.tabs[n].userlist.length; m++) {
                        let usrStr = `<div class="memoChumContainer"><div class='memoChum'>${gui.tabs[n].userlist[m]}</div></div>`;
                        usrStr = usrStr.replace('@', "<img class='userstatus' height='16px' width='16px' alt='op' src='img/op.png'> ")
                        usrStr = usrStr.replace(/&#38;|&/, "<img class='userstatus' height='16px' width='16px' alt='admin' src='img/admin.png'> ")
                        usrStr = usrStr.replace('+', "<img class='userstatus' height='16px' width='16px' alt='voice' src='img/voice.png'> ")
                        usrStr = usrStr.replace('~', "<img class='userstatus' height='16px' width='16px' alt='founder' src='img/founder.png'> ")
                        //console.log(usrStr)
                        //memoUserList.innerHTML += usrStr;
                        memoUserList.insertAdjacentHTML("beforeend", usrStr);
                    }
                    gui.tabs[n].active = true;
                }
                else {
                    gui.tabs[n].active = false;
                }
            }

            // Set button active class for style
            for (let n = 0; n < gui.tabs.length; n++) {
                const tabby = document.getElementById(gui.tabs[n].label)
                if (gui.tabs[n].active == true) {
                    if (tabby.className.indexOf(" active") == -1) {
                        tabby.className += " active";
                    }
                }
                else
                {
                    tabby.className = tabby.className.replace(" active", "");
                }
            }

            // Manage the close button
            updatePartButtonPos(gui)

            // We're doing active stuff
            setTabEnabled(gui, true);
        }
        )
    }

    // Add events for close buttons
    for (let i = 0; i < parts.length; i++) {
        let button = parts[i]
        button.addEventListener('click', function (event) {
            let id = event.currentTarget.id.slice(6)
            let tabby = document.getElementById(id);
            //console.log(event.currentTarget.id.slice(6), tabby)
            for (let t = 0; t < gui.tabs.length; t++) {
                if (gui.tabs[t].label == id) {
                    gui.tabs = gui.tabs.splice(t, 1);
                }
            }
            //tabby.remove();
            //event.currentTarget.remove();
            gui.updateTabs();
            setTabEnabled(gui, false);
        }
        )
    }
}

function setTabEnabled (gui, enabled) {
    let msgElm = document.getElementById('msg');
    let txtElm = document.getElementById('textarea');
    let mUserElm = document.getElementById('memoUserlist');
    if (enabled == true) {
    // We're doing active stuff
        msgElm.disabled = false;
        msgElm.className = msgElm.className.replace(" inactive", "");
        txtElm.className = txtElm.className.replace(" inactive", "");
        mUserElm.className = mUserElm.className.replace(" inactive", "");
    }
    else if (enabled == false) {
        msgElm.disabled = true;
        let allclassnames = msgElm.className + txtElm.className + mUserElm.className;
        if (allclassnames.indexOf(" inactive") == -1) {
            msgElm.className += " inactive";
            txtElm.className += " inactive";
            mUserElm.className += " inactive";
        }
        while(txtElm.firstChild) {
            txtElm.removeChild(txtElm.firstChild);
        }
        while(mUserElm.firstChild) {
            mUserElm.removeChild(mUserElm.firstChild);
        }
    }

    if (gui.dead == true) {
        // Dead session, don't allow input
        msgElm.disabled = true;
        if (msgElm.className.indexOf(" inactive") == -1) {
            msgElm.className += " inactive";
        }
    }
}

function parsePesterchumSyntax (source, target, msg) {
    // Escapes tags, turns <c=#ffffff> to span, adds prefixes.
    let output = msg;

    // Timeline
    if (target != null) {
        if ((target[0]=='#') || (target[0]=='&')) {
            // Memo
            // Add timeline
            //console.log(output)
            let start = output.match(_memomsg_start)
            if (start != null) {
                start = start[0]
                let initials = start.match(_initials)
                start = start.replace(_initials, 'C' + initials)
                output = output.replace(_memomsg_start, start)
            }
        }
    }
    let ctags = output.match(_ctag_begin);
    let smilies = output.match(_smilies);
    if (ctags != null) {
        for (let i = 0; i < ctags.length; i++) {
            let rgb = ctags[i].match(_ctag_rgb)
            if (rgb != null) {
                output = output.replace(ctags[i], "<span style='color: rgb(" + rgb[0] + ");'>")
            }
            let hex = ctags[i].match(_ctag_hex)
            if (hex != null) {
                output = output.replace(ctags[i], "<span style='color: " + hex[0] + ";'>")
            }
        }
    }
    output = output.replaceAll('</c>', '</span>')
    output = output.replaceAll(sanitizeHTML('</c>'), '</span>')
    
    // Smilies
    if (smilies != null) {
        for (let i = 0; i < smilies.length; i++) {
            let smilename = smilies[i].replaceAll(':', '')
            let filename = smilename + '.gif'
            let replaceStr = `<img src='smilies/${filename}' alt='${smilename}' title='${smilename}'>`
            output = output.replaceAll(smilies[i], replaceStr)
        }
    }

    if (target != null) {
        if ((target[0]=='#') || (target[0]=='&')) {
            // Memo
            output = output;
        }
        else if (source != null){
            // Convo
            // Get nick
            let nick = '';
            if (source[0] == ':') {
                nick = source.slice(1)
                if (nick.indexOf('!') != -1) {
                    nick = nick.split('!')[0]
                }
            }
            else {
                nick = source;
            }
            //console.log(source, target, msg)
            //if (_evil_rule_im_so_sorry.test(msg) == false) {
            if (msg.search(_evil_rule_im_so_sorry) == -1) {
                //console.log('yea')
                let initials = getInitials(nick)
                output = initials + ': ' + output;
            }
        }
    }
    return output;
}

class clientGUI {
    constructor () {
        this.body = document.getElementsByTagName('body').item(0);
        this.color = document.getElementById('bloodcaste').value;
        this.MemosTabOpen = true;
        this.dead = false; // Input is not allowed
        this.nick;
        this.chums = new chums(); // Stores data on individual others like color
        this.tabs = [];
        this.userlist = [];
        this.memolist = [];
        //this.chum = new Object()
    }
    openChannelTab (channel) {
        // We open tabs with this and addText
        // Iterate through tabs, and check if it's present, add if not
        var found = false
        for (let i = 0; i < this.tabs.length; i++) {
                // This is to a memo
                if ((channel == this.tabs[i].label) && (this.tabs[i].memo == true)) {
                    var found = true
                }
        }
        // If we don't have a tab for the source, make one.
        if (found == false) {
            //console.log('New tab ', channel);
            let newtab = new memoConvoTab(channel, channel, null);
            let board = channel.slice(1).toUpperCase();
            newtab.tabcontent += `<span style='color: ${this.color};'>C${getInitials(this.nick)}</span> RIGHT NOW opened memo on board ${board}.`
            this.tabs.push(newtab)
        }
    }
    updateMemolist(irc, gui) {
        // Server memolist
        this.memolist.sort() // abc sort
        this.memolist.sort((a, b) => b[1] - a[1] ); // Sort by usercount
        let chumroll = document.getElementById('chumroll')
        while(chumroll.firstChild) {
            chumroll.removeChild(chumroll.firstChild);
        }
        for (let i = 0; i < this.memolist.length; i++) {
            if (this.memolist[i] != '') {
                let memostr = `${this.memolist[i][0]} (${this.memolist[i][1]})`
                //chumroll.innerHTML += "<div class='userlistChum'><button class='userlistButton'>" + memostr + "</button></div>";
                chumroll.insertAdjacentHTML("beforeend", "<div class='userlistChum'><button class='userlistButton'>" + memostr + "</button></div>");
            }
        }

        // Button clicks
        //let userButtons = document.getElementsByClassName('userlistButton')
        let userlistChum = document.getElementsByClassName('userlistChum')
        /*for (let i = 0; i < userButtons.length; i++) {
            userButtons[i].addEventListener('click', function (event) {
                let buttontext = event.currentTarget.innerHTML;
                irc.join(buttontext.split(',')[0])
                connectButtonEvents(irc, gui)
            }
            );
        }*/
        for (let i = 0; i < userlistChum.length; i++) {
            userlistChum[i].addEventListener('click', function (event) {
                let userButton = event.currentTarget.getElementsByClassName('userlistButton')[0]
                let buttontext = userButton.innerHTML;
                irc.join(buttontext.split(',')[0])
                connectButtonEvents(irc, gui)
            }
            );
        }
    }
    updateUserlist(irc, gui) {
        // Server userlist
        this.userlist.sort(); // abc sort
        this.userlist.sort((a, b) => {
            // Put invalid handles last
            let aIsHandle = _chumhandle.test(a);
            let bIsHandle = _chumhandle.test(b);
            if (aIsHandle == bIsHandle) {
                return 0;
            }
            else if ((aIsHandle == true) || (bIsHandle == false)) {
                return -1;
            }
            else if ((aIsHandle == false) || (bIsHandle == true)) {
                return 1;
            }
        });
        let chumroll = document.getElementById('chumroll');
        while(chumroll.firstChild) {
            chumroll.removeChild(chumroll.firstChild);
        }
        for (let i = 0; i < this.userlist.length; i++) {
            if (this.userlist[i] != '') {
                //chumroll.innerHTML += "<div class='userlistChum'><button class='userlistButton'>" + this.userlist[i] + "</button></div>";
                chumroll.insertAdjacentHTML("beforeend", "<div class='userlistChum'><button class='userlistButton'>" + this.userlist[i] + "</button></div>");
            }
        }

        // Button clicks
        //let userButtons = document.getElementsByClassName('userlistButton')
        let userlistChum = document.getElementsByClassName('userlistChum')
        /*for (let i = 0; i < userlistChum.length; i++) {
            let userButton = userlistChum[i].getElementsByClassName('userlistButton')[0]
            userButton.addEventListener('click', function (event) {
                let buttontext = event.currentTarget.innerHTML;
                irc.msg(buttontext, "PESTERCHUM:BEGIN")
                gui.addText(irc.handle, buttontext, "PESTERCHUM:BEGIN")
                gui.updateTabs()
                connectButtonEvents(irc, gui)
            }
            )
        }
        console.log(userlistChum)*/
        for (let i = 0; i < userlistChum.length; i++) {
            userlistChum[i].addEventListener('click', function (event) {
                let userButton = event.currentTarget.getElementsByClassName('userlistButton')[0]
                let buttontext = userButton.innerHTML;
                irc.msg(buttontext, "PESTERCHUM:BEGIN")
                gui.addText(gui, irc.handle, buttontext, "PESTERCHUM:BEGIN")
                gui.updateTabs()
                connectButtonEvents(irc, gui)
            }
            );
        }
    }
    updateTabs() {
        // Checks if we have all tabs in the doc
        
        // Tab buttons
        let tablinks = this.maintab.getElementsByClassName('tablinks')
        let tablinksInner = []
        for (let i = 0; i < tablinks.length; i++) {
            tablinksInner.push(tablinks[i].innerHTML)
        }
        for (let i = 0; i < this.tabs.length; i++) {
            let label = this.tabs[i].label;
            let pos = tablinksInner.indexOf(label)
            if (_memoprefix.test(label)) {
                // Memo
                if (pos == -1) {
                    // Not present
                    //this.maintab.innerHTML += `<button id='${label}' class='tablinks'>${label}</button>`;
                    this.maintab.insertAdjacentHTML("beforeend", `<button id='${label}' class='tablinks'>${label}</button>`);
                    //this.maintab.innerHTML += `<button id='leave_${label}' class='part'>X</button>`;
                    
                }
            }
            else {
                // Convo
                if (pos == -1) {
                    // Not present
                    //this.maintab.innerHTML += `<button id='${label}' class='tablinks'>${label}</button>`;
                    this.maintab.insertAdjacentHTML("beforeend", `<button id='${label}' class='tablinks'>${label}</button>`);
                    //this.maintab.innerHTML += `<button id='leave_${label}' class='part'>X</button>`;
                }
            }
        }

        // Close buttons position
        /*for (let i = 0; i < this.tabs.length; i++) {
            let label = this.tabs[i].label;
            let elm = document.getElementById(label);
            let elmRect = elm.getBoundingClientRect();
            let closeElm = document.getElementById(`leave_${label}`);
            closeElm.style.left = (elmRect.right - 20) + 'px';
            closeElm.style.top = (elmRect.y + 4) + 'px';
            //console.log('woowa', closeElm, elm)
        }*/

        // Check if closed
        let alllabels = [];
        for (let i = 0; i < this.tabs.length; i++) {
            alllabels.push(this.tabs[i].label)
        }
        //console.log('alllabels: ', alllabels)
        //for (let i = 0; i < this.tabs.length; i++) {

        //}

        // textarea
        for (let n = 0; n < this.tabs.length; n++) {
            //console.log(this.tabs[n])
            if (this.tabs[n].active == true) {
                //this.textarea.innerHTML = this.tabs[n].tabcontent;
                while(this.textarea.firstChild) {
                    this.textarea.removeChild(this.textarea.firstChild);
                }
                this.textarea.insertAdjacentHTML("beforeend", this.tabs[n].tabcontent);
                this.textarea.scrollTop = this.textarea.scrollHeight; // Scroll to bottom
            }
        }
    }
    addText(gui, source, target, msg) {
        //pchum begin
        if (msg == "PESTERCHUM:BEGIN") {
            //-- Horse [HH] began pestering Horse [HH] at 07:19 --
            //msg = "-- " + source + "[] began pestering " + target + " [] at 00:00 --";
            //msg = `-- ${source}[${getInitials(source)}] began pestering ${target} [${getInitials(target)}] at ${time()} --`;

            let srcInitials = `<c=${gui.chums.getColor(source)}>[${getInitials(source)}]</c>`;
            let targetInitials = `<c=${gui.chums.getColor(target)}>[${getInitials(target)}]</c>`;
            msg = `<c=100,100,100>-- ${source} ${srcInitials} began pestering ${target} ${targetInitials} at ${time()} --</c>`;
        }

        // Iterate through tabs, and check if it's present, add if not
        var found = false
        for (let i = 0; i < this.tabs.length; i++) {
            if (_memoprefix.test(target[0])) {
                // This is to a memo
                if ((target == this.tabs[i].target) && (this.tabs[i].memo == true)) {
                    var found = true
                }
            }
            else if (source != this.nick) {
                // This is not to a memo
                if ((source == this.tabs[i].label) && (this.tabs[i].memo == false)) {
                    var found = true
                }
            }
            else if (source == this.nick) {
                // This is not to a memo
                if ((target == this.tabs[i].label) && (this.tabs[i].memo == false)) {
                    var found = true
                }
            }
        }
        // If we don't have a tab for the source, make one.
        if (found == false) {
            let newtab;
            if (source != this.nick) {
                newtab = new memoConvoTab(source, target, null);
            }
            else {
                newtab = new memoConvoTab(source, target, target);
            }
            if (newtab.memo == true) {
                newtab.tabcontent += `C${getInitials(this.nick)} RIGHT NOW opened memo on board ${target}.`;
            }
            this.tabs.push(newtab);
        }
        //console.log(this.tabs)
        // Iterate through tabs, and add text
        for (let i = 0; i < this.tabs.length; i++) {
            // X RESPONSED TO MEMO
            if ((_memoprefix.test(target[0])) && (target == this.tabs[i].target) && (this.tabs[i].announced.indexOf(source) == -1)) {
                this.tabs[i].announced.push(source)
                this.tabs[i].tabcontent += `<div>CURRENT ${source} [C${getInitials(source)}] RIGHT NOW responded to memo.</div>`
            }

            // Add text
            if (_memoprefix.test(target[0])) {
                // This is to a memo
                if ((target == this.tabs[i].target) && (this.tabs[i].memo == true)) {
                    //console.log('Add to tab (memo) ', target, msg);
                    msg = parsePesterchumSyntax(source, target, msg)
                    //this.tabs[i].tabcontent += msg + '<br>'
                    this.tabs[i].tabcontent += `<div>${msg}</div>`
                }
            }
            else if (source != this.nick) {
                // This is not to a memo, we didn't send this msg.
                if ((source == this.tabs[i].label) && (this.tabs[i].memo == false)) {
                    //console.log('Add to tab (convo) ', source, msg);
                    msg = parsePesterchumSyntax(source, target, msg)
                    //this.tabs[i].tabcontent += msg + '<br>'
                    this.tabs[i].tabcontent += `<div><span style="color: rgb(${this.chums.getColor(source)});">${msg}</span></div>`
                }
            }
            else if (source == this.nick) {
                // This is not to a memo, we send this msg.
                if ((target == this.tabs[i].label) && (this.tabs[i].memo == false)){
                    //console.log('Add to tab (convo) ', source, msg);
                    msg = parsePesterchumSyntax(source, target, msg)
                    this.tabs[i].tabcontent += `<div>${msg}</div>`
                }
            }
        }
        //console.log(this.tabs);
        //console.log("found is ", found);
    }
    tabify () {
        this.body.insertAdjacentHTML('beforeend',
                                     "<div id='chonkers'>"
                                     + "<button id='part'>X</button>"
                                     + "<div id='chumrollContainer'>"
                                     + "<button id='memolistButton' class='MemosChumsTabs active'>MEMOS</button>"
                                     + "<button id='userlistButton' class='MemosChumsTabs'>CHUMS</button>"
                                     + "<div id='chumroll'>"
                                     + "</div>"
                                     + "<div class='manualJoin'><div>JOIN MEMO:</div>"
                                     + "<form id='manualJoinForm'>"
                                     + "<input id='manualJoinInput' minlength='1' required>"
                                     + "</form>"
                                     + "</div>"
                                     + "</div>"
                                     + `<button class='hidebutton' id='hideChumroll'>&#8594;</button>` // -->
                                     + "<div id='tabContainer'>"
                                     + "<div id='maintab' class='tab'></div>"
                                     + "<div id='textAndInputBox'>"
                                     + "<div id='textarea' class='textarea inactive'></div>"
                                     + "<form id='msgform'>"
                                     + "<input id='msg' class='msg inactive' minlength='1' required disabled>"
                                     + "</form>"
                                     + "</div>"
                                     + `<button class='hidebutton' id='hideMemoUsers'>&#8594;</button>` // -->
                                     + "<div id='memoUserlist' class='memoUserlist inactive'></div>"
                                     + "</div>"
                                     + "</div>");
        this.maintab = document.getElementById('maintab');
        this.textarea = document.getElementById('textarea');

        this.hideMemoUserlist = document.getElementById('hideMemoUsers');
        this.hideChumroll = document.getElementById('hideChumroll');

        this.hideMemoUserlist.addEventListener('click', function (event) {
            let memoUserlist = document.getElementById('memoUserlist');
            let textAndInputBox = document.getElementById('textAndInputBox');
            let elmTxt= event.currentTarget.innerHTML;
            if (['&#8594;', '→'].indexOf(elmTxt) != -1) { // -->
                memoUserlist.style.display = 'none';
                event.currentTarget.innerHTML = "&#8592;" // <--
                //console.log(textAndInputBox.style.width)
                switch (textAndInputBox.style.width) {
                    case '':
                        textAndInputBox.style.width = '85%';
                        break;
                    case '65%':
                        textAndInputBox.style.width = '85%';
                        break;
                }
            }
            else {
                memoUserlist.style.display = 'initial';
                event.currentTarget.innerHTML = "&#8594;" // -->
                switch (textAndInputBox.style.width) {
                    case '85%':
                        textAndInputBox.style.width = '65%';
                        break;
                }
            }
        }
        )

        this.hideChumroll.addEventListener('click', function (event) {
            let tabContainer = document.getElementById('tabContainer');
            let chumrollContainer = document.getElementById('chumrollContainer');
            let elmTxt = event.currentTarget.innerHTML;
            if (['&#8594;', '→'].indexOf(elmTxt) != -1) { // -->
                chumrollContainer.style.display = 'none';
                event.currentTarget.innerHTML = "&#8592;" // <--
                switch (tabContainer.style.width) {
                    case '':
                        tabContainer.style.width = '100%';
                        break;
                    case '75%':
                        tabContainer.style.width = '100%';
                        break;
                }
            }
            else {
                chumrollContainer.style.display = 'initial';
                event.currentTarget.innerHTML = "&#8594;" // -->
                switch (tabContainer.style.width) {
                    case '100%':
                        tabContainer.style.width = '75%';
                        break;
                }
            }
        }
        )
    }
    clear () {
        this.body.innerHTML = ""
    }
}

class ircClient {
    constructor (handle) {
        this.handle = handle
    }
    // Register to server
    register () {
        this.socket.send('NICK ' + this.handle);
        this.socket.send('USER pco 0 * :pco');
    }
    connect () {
        // create websocket connection
        this.socket = new WebSocket('wss://irc.pesterchum.xyz:8443'); 
    }
    send (data) {
        // Send raw data
        //console.log('Send message to server ', data);
        this.socket.send(data)
    }
    msg (target, message) {
        // Shorthand for PRIVMSG
        // <target>{,<target>} <text to be sent>
        this.socket.send("PRIVMSG " + target + ' :' + message)
    }
    join (channel) {
        // Join a channel
        // <channel>{,<channel>} [<key>{,<key>}]
        this.socket.send("JOIN " + channel)
    }
    part (channel) {
        // Leave a channel
        // <channel>{,<channel>}
        this.socket.send("PART " + channel)
    }
    names (channel) {
        // Get channel users
        this.socket.send("NAMES " + channel)
    }
    list () {
        // Get channels
        this.socket.send("LIST")
    }
}

var sanitizeHTML = function (str) {
    if (allowTags != true)
    {
        str = str.replace(_amp, '&#38;');
        str = str.replace(_quot, "&quot;");
        str = str.replace(_ampo, "&#039;");
        str = str.replace(_lt, '&#60;');
        str = str.replace(_gt, '&#62;');
        return str;
    }
    else {
        return str
    }
};
