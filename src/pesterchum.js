'use strict'

/**
 *
 * @source: https://github.com/Dpeta/PesterchumOnlineButSilly/blob/main/src/pesterchum.js
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 *
 *  Pesterchum.online / PesterchumOnlineButSilly, a static pure-JavaScript Pesterchum client.
 *  Copyright (C) 2023  Shou/Dpeta
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */

window.onload = init

let allowTags = false

const _amp = /&/g
const _quot = /"/g
const _ampo = /'/g
const _lt = /</g
const _gt = />/g
const ServicesBots = ['NICKSERV', 'CHANSERV', 'MEMOSERV', 'OPERSERV', 'HELPSERV', 'HOSTSERV', 'BOTSERV', 'CALSPRITE', 'RANDOMENCOUNTER']
// const sanitizer = new Sanitizer(allowElements=['span'])
const _chumhandle = /^([a-z]+[A-Z][a-z]*)$/
const _ctagBegin = /(<|&#60;)c=(.*?)(>|&#62;)/g
// const _ctagEnd = /(<|&#60;)\/c(>|&#62;)/g
const _ctagRgb = /(\d+,\d+,\d+)/g
const _ctagHex = /#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3})/g
const _ctagRgbHex = /(\d+,\d+,\d+)|(#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3}))/g
const _colorMsg = /^COLOR (>|&#62;)(\d+,\d+,\d+)$/
const _colorMsgRgb = /\d+,\d+,\d+/
const _memoMsgStart = /^((<|&#60;)c=((\d+,\d+,\d+)|(#([a-fA-F0-9]{6})|(#[a-fA-F0-9]{3})))(>|&#62;)[A-Z]*[A-Z]*:\s)/g
const _memoPrefix = /^(&|#)/
const _initials = /[A-Z]*[A-Z]*:\s/
// const _evilRuleImSoSorry = /^(<|&#60;)c=(.*?)(>|&#62;)-- .+ (<|&#60;)c=(.*?)(>|&#62;)\[..\]<\/c> .+ pestering .+ (<|&#60;)c=(.*?)(>|&#62;)\[..\]<\/c> at \d\d:\d\d --<\/c>$/gi;
const _evilRuleImSoSorry = /.*--.+\[..\].+\[..\].+\d\d:\d\d --.*/gi
const _url = /\b(https:\/\/(\w|\d|\.|\/)*)/gi
const _userPrefix = /^(@|&#38;|~|&|\+)+/
// const _escapeable = /&|"|'|<|>/g
const _honk = /honk/gi
const _smilies = /:rancorous:|:apple:|:bathearst:|:cathearst:|:woeful:|:sorrow:|:pleasant:|:blueghost:|:slimer:|:candycorn:|:cheer:|:duhjohn:|:datrump:|:facepalm:|:bonk:|:mspa:|:gun:|:cal:|:amazedfirman:|:amazed:|:chummy:|:cool:|:smooth:|:distraughtfirman|:distraught:|:insolent:|:bemused:|:3:|:mystified:|:pranky:|:tense:|:record:|:squiddle:|:tab:|:beetip:|:flipout:|:befuddled:|:pumpkin:|:trollcool:|:jadecry:|:ecstatic:|:relaxed:|:discontent:|:devious:|:sleek:|:detestful:|:mirthful:|:manipulative:|:vigorous:|:perky:|:acceptant:|:olliesouty:|:billiards:|:billiardslarge:|:whatdidyoudo:|:brocool:|:trollbro:|:playagame:|:trollc00l:|:suckers:|:scorpio:|:shades:|:honk:/g

// Audio
let alarmMemo
let alarmDm
let alarmMention
let soundCease
let soundHonk

// The important!!
let ircClient
let pcoClient

function init () {
  const connectButton = document.getElementById('connectButton')
  // const handleInput = document.getElementById('handle')
  const connectForm = document.getElementById('connectForm')

  connectButton.addEventListener('click', function (event) {
    event.stopPropagation()
    event.preventDefault()
    runCheck()
  }
  )
  connectForm.addEventListener('submit', function (event) {
    event.stopPropagation()
    event.preventDefault()
    runCheck()
  }
  )

  // Default value
  const tagCheck = document.getElementById('allowUnsafeTags')
  if (tagCheck !== null) {
    tagCheck.checked = false
  }
}

function runCheck () {
  // Get Handle
  const handleInput = document.getElementById('handle')

  if (_chumhandle.test(handleInput.value)) {
    // Valid chumhandle
    run()
  } else {
    // Invalid chumhandle
    alert('NOT A VALID CHUMTAG.')
  }
}

function run () {
  // Load Audio (26kb)
  loadAudio()

  // Get Handle
  const handleInput = document.getElementById('handle')
  const handle = handleInput.value

  // Get escape-allowed setting
  const tagCheck = document.getElementById('allowUnsafeTags')
  if (tagCheck !== null) {
    allowTags = tagCheck.checked
  }

  // Create client + connect
  ircClient = new IrcClient(handle)
  ircClient.connect()

  // Connection opened
  ircClient.socket.addEventListener('open', function (event) {
    ircClient.register()
  })

  // Data incoming
  ircClient.socket.addEventListener('message', function (event) {
    // *ALL* input is sanitized now, the rest of the code needs to account for this.
    parseIRC(sanitizeHTML(event.data))
  })

  // Disconnected
  ircClient.socket.addEventListener('close', function (event) {
    alert('Disconnected, pls reload page :(' +
            `\n    code: ${event.code}` +
            `\n    reason: ${event.reason}` +
            `\n    wasClean: ${event.wasClean}`
    )
    pcoClient.dead = true
    const msgElm = document.getElementById('msg')
    msgElm.disabled = true
    msgElm.className += ' inactive'
  })

  // Create pcoClient
  pcoClient = new PesterchumOnlineClient()
  pcoClient.clear()
  pcoClient.tabify()
  pcoClient.nick = handle

  const msg = document.getElementById('msgform')
  msg.addEventListener('submit', function (event) {
    event.stopPropagation()
    event.preventDefault()
    sendMsg(event)
  })

  const maintab = document.getElementById('maintab')
  maintab.addEventListener('scroll', function (event) {
    updatePartButtonPos()
  })

  const manualJoinForm = document.getElementById('manualJoinForm')
  // const manualJoinInput = document.getElementById('manualJoinInput');
  manualJoinForm.addEventListener('submit', function (event) {
    event.stopPropagation()
    event.preventDefault()
    const manualJoinInput = document.getElementById('manualJoinInput')
    const memostr = manualJoinInput.value
    ircClient.join(`#${memostr}`)
    manualJoinInput.value = ''
    pcoClient.memolist = []
    ircClient.list()
  })

  const partButton = document.getElementById('part')
  partButton.addEventListener('click', function (event) {
    const activeTab = pcoClient.tabs.filter((tab) => tab.active)
    for (let i = 0; i < activeTab.length; i++) {
      // Should only trigger once

      // Del tab button
      const tabButton = document.getElementById(activeTab[i].label)
      tabButton.remove()

      // Hide part button
      event.currentTarget.style.display = 'none'

      // Part / Cease
      if (activeTab[i].memo) {
        ircClient.part(activeTab[i].label)
      } else {
        ircClient.msg(activeTab[i].label, 'PESTERCHUM:CEASE')
      }

      // Remove tab
      pcoClient.tabs.splice(pcoClient.tabs.indexOf(activeTab[i]), 1)

      // Disabled
      setTabEnabled(false)
    }
  }
  )
  connectMemoUserlistSwitch()
}

function loadAudio () {
  alarmMemo = new Audio('sound/aac.m4a/alarm_memo.m4a')
  alarmDm = new Audio('sound/aac.m4a/alarm_direct_message.m4a')
  alarmMention = new Audio('sound/aac.m4a/alarm_mention.m4a')
  soundCease = new Audio('sound/aac.m4a/cease_direct_message.m4a')
  soundHonk = new Audio('sound/aac.m4a/evil.m4a')
}

function sendMsg (event) {
  const msgInput = document.getElementById('msg')
  const nick = ircClient.handle
  const initials = getInitials(nick)

  // let msg = msgInput.value;
  // let baremsg = msg;
  let msg
  let baremsg
  const splitMsg = msgInput.value.match(/.{1,361}/g)
  // msg = '<c=' + pcoClient.color + '>' + initials + ': ' + baremsg + '</c>';
  for (let q = 0; q < splitMsg.length; q++) {
    msg = splitMsg[q]
    baremsg = msg
    if ((msg.indexOf('/me ') !== 0) && (msg.indexOf('/me\'s ') !== 0)) {
      msg = `<c=${pcoClient.color}>${initials}: ${baremsg}</c>`
    }

    // Send to who?
    for (let n = 0; n < pcoClient.tabs.length; n++) {
      if (pcoClient.tabs[n].active) {
        if (pcoClient.tabs[n].memo) {
          ircClient.msg(pcoClient.tabs[n].label, msg)
        } else {
          ircClient.msg(pcoClient.tabs[n].label, baremsg)
        }
        msg = sanitizeHTML(msg)
        msg = parsePesterchumSyntax(null, pcoClient.tabs[n].label, msg)
        if (msg.indexOf('/me ') === 0) {
          if (pcoClient.tabs[n].memo) {
            msg = `<span style='color: rgb(100,100,100)'>-- CURRENT ${nick} <span style='color: ${pcoClient.color};'>[C${getInitials(nick)}]</span> ${msg.slice('/me '.length)} --</span>`
          } else {
            msg = `<span style='color: rgb(100,100,100)'>-- ${nick} <span style='color: ${pcoClient.color};'>[${getInitials(nick)}]</span> ${msg.slice('/me '.length)} --</span>`
          }
        } else if (msg.indexOf('/me\'s ') === 0) {
          if (pcoClient.tabs[n].memo) {
            msg = `<span style='color: rgb(100,100,100)'>-- CURRENT ${nick}'s <span style='color: ${pcoClient.color};'>[C${getInitials(nick)}'S]</span> ${msg.slice('/me\'s '.length)} --</span>`
          } else {
            msg = `<span style='color: rgb(100,100,100)'>-- ${nick}'s <span style='color: ${pcoClient.color};'>[${getInitials(nick)}'S]</span> ${msg.slice('/me\'s '.length)} --</span>`
          }
        }
        pcoClient.tabs[n].tabcontent += `<div>${msg}</div>`
        pcoClient.updateTabs()
      }
    }
  }
  msgInput.value = '' // clear
}

function getInitials (nick) {
  // Initials
  let initials = nick[0].toUpperCase()
  for (let i = 0; i < nick.length; i++) {
    if (nick[i] === nick[i].toUpperCase()) {
      initials += nick[i]
      break
    }
  }
  if (initials.length === 1) {
    initials += nick[0].toUpperCase()
  }
  return initials
}

function time () {
  // Returns current time as 00:00
  const currentdate = new Date()
  const hour = String(currentdate.getHours())
  const minute = String(currentdate.getMinutes())
  let timeStamp = ''
  // console.log('hour', typeof(hour), hour.length)
  if (hour.length === 1) {
    // 1:XX --> 01:XX
    timeStamp += `0${hour}`
  } else {
    // 11:XX
    timeStamp += hour
  }
  timeStamp += ':'
  if (minute.length === 1) {
    // XX:1 --> XX:01
    timeStamp += `0${minute}`
  } else {
    // XX:11
    timeStamp += minute
  }

  // XX:XX
  return timeStamp
}

function parseIRC (data) {
  // Parse IRC message
  // message ::= ['@' <tags> SPACE] [':' <source> SPACE] <command> <parameters> <crlf>
  console.log('Received message from server ', data)
  const parts = data.split(' ')
  let source = ''
  let command = ''
  let params = []
  if (parts[0][0] === ':') {
    // Has source
    source = parts[0]
    command = parts[1]
    if (parts.length > 1) {
      params = parts.slice(2)
    }
  } else {
    // No source
    command = parts[0]
    if (parts.length > 0) {
      params = parts.slice(1)
    }
  }
  // Scope is fucked
  // const client = ''
  let channel = ''
  let target = ''
  let msgparts = ''
  let msg = ''
  let users = 0
  let sourcenick = ''
  let urls = []
  let srcInitials = ''
  let targetInitials = ''
  let updateQue = []
  const memoStartMsg = msg.match(_memoMsgStart)

  switch (command) {
    // Commands
    case 'PING':
      ircClient.send('PONG ' + params[0])
      break
    case 'PRIVMSG':
      // Incoming message
      // :[source] PRIVMSG [target] msg
      sourcenick = source.slice(1).split('!')[0]
      target = params[0]
      msgparts = params.slice(1)
      // console.log('Incoming PRIVMSG ', params);
      // If #pesterchum, return
      if (target === '#pesterchum') {
        return
      }
      // Reassemble message
      msg = msgparts[0]
      if (msg[0] === ':') {
        msg = msg.slice(1)
      }
      for (let i = 1; i < msgparts.length; i++) {
        msg += ' ' + msgparts[i]
      }

      if (msg === 'PESTERCHUM:BEGIN') {
        // -- Horse [HH] began pestering Horse [HH] at 07:19 --
        srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`
        targetInitials = `<c=${pcoClient.chums.getColor(target)}>[${getInitials(target)}]</c>`
        msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} began pestering ${target} ${targetInitials} at ${time()} --</c>`
      } else if (msg === 'PESTERCHUM:CEASE') {
        srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`
        targetInitials = `<c=${pcoClient.chums.getColor(target)}>[${getInitials(target)}]</c>`
        msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} ceased pestering ${target} ${targetInitials} at ${time()} --</c>`
      } else if (msg === 'PESTERCHUM:IDLE') {
        srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`
        msg = `<c=100,100,100>-- ${sourcenick} ${srcInitials} is now an idle chum! --</c>`
      } else if (msg.indexOf('/me ') === 0) {
        // msg = "-- CURRENT " + sourcenick + " [] " + msg.slice(4) + " --"
        if (_memoPrefix.test(target[0])) {
          srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[C${getInitials(sourcenick)}]</c>`
        } else {
          srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}]</c>`
        }
        msg = `<c=100,100,100>-- CURRENT ${sourcenick} ${srcInitials} ${msg.slice(4)} --</c>`
      } else if (msg.indexOf('/me\'s ') === 0) {
        if (_memoPrefix.test(target[0])) {
          srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[C${getInitials(sourcenick)}'S]</c>`
        } else {
          srcInitials = `<c=${pcoClient.chums.getColor(sourcenick)}>[${getInitials(sourcenick)}'S]</c>`
        }
        msg = `<c=100,100,100>-- CURRENT ${sourcenick}'s ${srcInitials} ${msg.slice(6)} --</c>`
      } else if (_colorMsg.test(msg)) {
        // let cMatch = msg.match(_ctagRgb)
        const color = msg.match(_colorMsgRgb)
        console.log('color: ' + color)
        pcoClient.chums.setColor(sourcenick, color)
        return
      } else if (msg.indexOf('PESTERCHUM:') !== -1) {
        return
      }

      if (memoStartMsg !== null) {
        const color = memoStartMsg[0].match(_ctagRgbHex)[0]
        // console.log('wpp', color)
        pcoClient.chums.setColor(sourcenick, color)
      }
      pcoClient.addText(sourcenick, target, msg)
      pcoClient.updateTabs()
      connectButtonEvents()
      break
    case 'NOTICE':
      // Incoming message
      // :[source] PRIVMSG [target] msg
      sourcenick = source.slice(1).split('!')[0]
      target = params[0]
      msgparts = params.slice(1)
      if (msgparts.length > 1) {
        channel = msgparts[0].replace(/:|\[|\]/g, '')
        msg = data.slice(data.indexOf(msgparts[0].slice(1))) // Data from & incl. channel
        urls = msg.match(_url)
        // console.log('urls: ', urls)
        if (urls !== null) {
          for (let i = 0; i < urls.length; i++) {
            msg = msg.replaceAll(urls[i], `<a href=${urls[i]}>${urls[i]}</a>`)
          }
        }
        // console.log(sourcenick, target, msgparts, channel, msg)
        for (let n = 0; n < pcoClient.tabs.length; n++) {
          if (pcoClient.tabs[n].label.toLowerCase() === channel.toLowerCase()) {
            pcoClient.tabs[n].tabcontent += `<div><span style='color: grey;'>${msg}</span></div>`
          } else if ((pcoClient.tabs[n].label.toLowerCase() === sourcenick.toLowerCase()) && (ServicesBots.indexOf(sourcenick.toUpperCase()) !== -1)) {
            // Services messages
            if (((msg.indexOf('Unknown command') !== -1) && (msg.indexOf('PESTERCHUM:BEGIN') !== -1)) === false) {
              pcoClient.tabs[n].tabcontent += `<div><span style='color: black;'>${msg}</span></div>`
            }
          }
        }
        pcoClient.updateTabs()
      }

      break
    case 'KILL':
      // Kicked
      if (params.length > 0) {
        const reason = params.slice(1)
        // if (reason[0] === ':') {
        //    reason = reason.split(':')[1]
        // }
        alert('USER WAS KICKED FROM SERVER' +
                    `\n    HANDLE: ${params[0]}` +
                    `\n    REASON: ${reason}`
        )
      } else {
        alert('USER WAS KICKED FROM SERVER')
      }
      break
    case 'ERROR':
      // About to be disconnected
      alert(data)
      break
    case 'JOIN':
      // hewwo,,
      sourcenick = source.slice(1).split('!')[0]
      console.log('sourcenick: ' + sourcenick)
      for (let i = 0; i < params.length; i++) {
        console.log('params[i]:', params[i])
        if ((params[i] !== ':#pesterchum') && (params[i] !== '#pesterchum')) {
          ircClient.names(params[i])
        }
      }
      break
    case 'PART':
      // goo b,,
      sourcenick = source.slice(1).split('!')[0]
      updateQue = pcoClient.tabs.filter((tab) => tab.userlist.indexOf(sourcenick) !== -1)
      updateQue = updateQue.filter((tab) => params.indexOf(tab.label) !== -1)
      for (let i = 0; i < updateQue.length; i++) {
        // CMM ceased responding to memo.
        const leaveMsg = `<span style='color: black;'>C${getInitials(sourcenick)}</span> <span style='color: #646464;'>ceased responding to memo.</span>`
        updateQue[i].tabcontent += `<div>${leaveMsg}</div>`

        updateQue[i].userlist = []
        ircClient.names(updateQue[i].label)
      }
      break
    case 'QUIT':
      // goo b,,
      sourcenick = source.slice(1).split('!')[0]
      updateQue = pcoClient.tabs.filter((tab) => tab.userlist.indexOf(sourcenick) !== -1)
      // updateQue = pcoClient.tabs.filter(tab => tab.label !== "#pesterchum");
      for (let i = 0; i < updateQue.length; i++) {
        updateQue[i].userlist = []
        ircClient.names(updateQue[i].label)

        // CMM ceased responding to memo.
        const leaveMsg = `<span style='color: black;'>C${getInitials(sourcenick)}</span> <span style='color: #646464;'>ceased responding to memo.</span>`
        updateQue[i].tabcontent += `<div>${leaveMsg}</div>`
      }
      break
    case 'MODE':
      // mode,,
      // OP status may have changed
      updateQue = pcoClient.tabs.filter((tab) => tab.label === params[0])
      for (let i = 0; i < updateQue.length; i++) {
        updateQue[i].userlist = []
        ircClient.names(updateQue[i].label)
      }
      break
      // Numerical replies
    case '001':
      // RPL_WELCOME
      ircClient.join('#pesterchum.online')
      // ircClient.join("#want_to_make_a_new_chum")
      // ircClient.join("#want_to_make_a_new_rp")
      // ircClient.join("#TestingZone");
      // ircClient.join("#TestingZone2");
      // ircClient.join("#TestingZone3");
      ircClient.join('#pesterchum')
      ircClient.list()
      ircClient.send('METADATA * set mood 0')
      ircClient.send('METADATA * set color ' + pcoClient.color)
      break
    case '322':
      // RPL_LIST
      // "<channel> <# visible> :<topic>"
      channel = params[1]
      users = params[2]
      if (channel === '#pesterchum') {
        return
      }
      pcoClient.memolist.push([channel, users])
      // console.log(pcoClient.memolist)
      break
    case '323':
      // RPL_LISTEND
      if (pcoClient.MemosTabOpen) {
        pcoClient.updateMemolist()
      }
      break
    case '353':
      // RPL_NAMREPLY
      // "<channel> :[[@|+]<nick> [[@|+]<nick> [...]]]"
      channel = params[2]
      if (params[3][0] === ':') {
        params[3] = params[3].slice(1)
      }
      users = params.slice(3)

      if (channel !== '#pesterchum') {
        pcoClient.openChannelTab(channel)
        // Add user to list if not present
        for (let n = 0; n < pcoClient.tabs.length; n++) {
          if (pcoClient.tabs[n].label === channel) {
            for (let i = 0; i < users.length; i++) {
              if (pcoClient.tabs[n].userlist.indexOf(users[i]) === -1) {
                pcoClient.tabs[n].userlist.push(users[i])
                // console.log(pcoClient.tabs[n].userlist);
              }
            }
          }
        }
      } else {
        for (let i = 0; i < users.length; i++) {
          const user = users[i].replace(_userPrefix, '')
          if (pcoClient.userlist.indexOf(user) === -1) {
            pcoClient.userlist.push(user)
            // console.log(pcoClient.userlist);
          }
        }
      }
      pcoClient.updateTabs()
      break
    case '366':
      // RPL_ENDOFNAMES
      // client = params[0]
      channel = params[1]
      if (channel === '#pesterchum') {
        ircClient.msg('#pesterchum', 'MOOD >0')
        if (!pcoClient.MemosTabOpen) {
          pcoClient.updateUserlist()
        }
      } else {
        pcoClient.openChannelTab(channel)
        pcoClient.updateTabs()
        connectButtonEvents()
      }
      updateMemoUserlist(channel)
      break
    case '433':
      alert('TH4T H4NDL3 1S T4K3N 4LR34DY >:[')
  }
}

class ChumConstruct {
  constructor (handle, color) {
    this.handle = handle
    this.color = color
    this.mood = 0
  }
}

class ChumsConstruct {
  constructor () {
    this.chums = []
  }

  setColor (handle, color) {
    const chumMatches = this.chums.filter((chum) => chum.handle === handle)
    // console.log(chumMatches)
    if (chumMatches.length > 0) {
      // Change color for matches
      for (let i = 0; i < chumMatches.length; i++) {
        chumMatches[i].color = color
      }
    } else {
      // New chum
      this.chums.push(new ChumConstruct(handle, color))
    }
    // console.log(this.chums)
  }

  getColor (handle) {
    const chumMatches = this.chums.filter((chum) => chum.handle === handle)
    if (chumMatches.length > 0) {
      return chumMatches[0].color
    } else {
      return '0,0,0'
    }
  }
}

class MemoConvoTab {
  constructor (source, target, label) {
    this.target = target // To who
    this.source = source // From who
    this.tabcontent = '' // All msges
    this.userlist = [] // Array of users present
    this.announced = []
    this.active = false

    if (label === null) {
      if (_memoPrefix.test(target[0])) {
        this.memo = true
        this.label = target
      } else {
        this.memo = false
        if (source[0] === ':') {
          this.label = source.slice(1).split('!')[0]
        } else {
          this.label = source.split('!')[0]
        }
      }
    } else {
      this.label = label
      this.memo = false
    }
  }
}

function connectMemoUserlistSwitch () {
  const uButton = document.getElementById('userlistButton')
  const mButton = document.getElementById('memolistButton')

  uButton.addEventListener('click', function (event) {
    if (event.currentTarget.className.indexOf(' active') === -1) {
      event.currentTarget.className += ' active'
    }
    mButton.className = mButton.className.replace(' active', '')
    pcoClient.MemosTabOpen = false
    pcoClient.updateUserlist()
    pcoClient.userlist = []
    ircClient.names('#pesterchum')
  }
  )
  mButton.addEventListener('click', function (event) {
    if (event.currentTarget.className.indexOf(' active') === -1) {
      event.currentTarget.className += ' active'
    }
    uButton.className = uButton.className.replace(' active', '')
    pcoClient.MemosTabOpen = true
    pcoClient.updateMemolist()
    pcoClient.memolist = []
    ircClient.list()
  }
  )
}

function updateMemoUserlist (channel) {
  const targetTab = pcoClient.tabs.filter((tab) => tab.label === channel)
  for (let n = 0; n < targetTab.length; n++) {
    if (targetTab[n].active) {
      // document.getElementById('textarea').innerHTML = targetTab[n].tabcontent;
      const memoUserList = document.getElementById('memoUserlist')
      memoUserList.innerHTML = ''
      targetTab[n].userlist.sort()
      for (let m = 0; m < targetTab[n].userlist.length; m++) {
        let usrStr = `<div class="memoChumContainer"><div class='memoChum'>${targetTab[n].userlist[m]}</div></div>`
        usrStr = usrStr.replace('@', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'op\' src=\'img/op.png\'> ')
        usrStr = usrStr.replace(/&#38;|&/, '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'admin\' src=\'img/admin.png\'> ')
        usrStr = usrStr.replace('+', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'voice\' src=\'img/voice.png\'> ')
        usrStr = usrStr.replace('~', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'founder\' src=\'img/founder.png\'> ')
        // console.log(usrStr)
        // memoUserList.innerHTML += usrStr;
        memoUserList.insertAdjacentHTML('beforeend', usrStr)
      }
    }
  }
}

function updatePartButtonPos () {
  const partButton = document.getElementById('part')
  const activeTab = pcoClient.tabs.filter((tab) => tab.active)
  for (let i = 0; i < activeTab.length; i++) {
    // Should only trigger once
    partButton.style.display = 'inline'
    const label = activeTab[i].label
    const elm = document.getElementById(label)
    const elmRect = elm.getBoundingClientRect()
    partButton.style.left = (elmRect.right - 20) + 'px'
    // partButton.style.top = (elmRect.y + 4) + 'px';
    partButton.style.top = (((elmRect.bottom - elmRect.y) / 2) + 4) + 'px' // the +4 is to offset the magin/padding
  }
}

function connectButtonEvents () {
  const tablinks = pcoClient.maintab.getElementsByClassName('tablinks') // Tab buttons
  // let parts = pcoClient.maintab.getElementsByClassName('part');        // Close tab buttons
  const parts = []
  for (let i = 0; i < tablinks.length; i++) {
    const button = tablinks[i]
    button.addEventListener('click', function (event) {
      const buttontext = event.currentTarget.innerHTML
      for (let n = 0; n < pcoClient.tabs.length; n++) {
        // console.log("pcoClient.tabs[n].label === buttontext", pcoClient.tabs[n].label, buttontext)
        if (pcoClient.tabs[n].label === buttontext) {
          while (pcoClient.textarea.firstChild) {
            pcoClient.textarea.removeChild(pcoClient.textarea.firstChild)
          }
          pcoClient.textarea.insertAdjacentHTML('beforeend', pcoClient.tabs[n].tabcontent)
          const memoUserList = document.getElementById('memoUserlist')
          while (memoUserList.firstChild) {
            memoUserList.removeChild(memoUserList.firstChild)
          }
          pcoClient.tabs[n].userlist.sort()
          for (let m = 0; m < pcoClient.tabs[n].userlist.length; m++) {
            let usrStr = `<div class="memoChumContainer"><div class='memoChum'>${pcoClient.tabs[n].userlist[m]}</div></div>`
            usrStr = usrStr.replace('@', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'op\' src=\'img/op.png\'> ')
            usrStr = usrStr.replace(/&#38;|&/, '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'admin\' src=\'img/admin.png\'> ')
            usrStr = usrStr.replace('+', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'voice\' src=\'img/voice.png\'> ')
            usrStr = usrStr.replace('~', '<img class=\'userstatus\' height=\'16px\' width=\'16px\' alt=\'founder\' src=\'img/founder.png\'> ')
            // console.log(usrStr)
            // memoUserList.innerHTML += usrStr;
            memoUserList.insertAdjacentHTML('beforeend', usrStr)
          }
          pcoClient.tabs[n].active = true
        } else {
          pcoClient.tabs[n].active = false
        }
      }

      // Set button active class for style
      for (let n = 0; n < pcoClient.tabs.length; n++) {
        const tabby = document.getElementById(pcoClient.tabs[n].label)
        if (pcoClient.tabs[n].active) {
          if (tabby.className.indexOf(' active') === -1) {
            tabby.className += ' active'
          }
        } else {
          tabby.className = tabby.className.replace(' active', '')
        }
      }

      // Manage the close button
      updatePartButtonPos()

      // We're doing active stuff
      setTabEnabled(true)
    }
    )
  }

  // Add events for close buttons
  for (let i = 0; i < parts.length; i++) {
    const button = parts[i]
    button.addEventListener('click', function (event) {
      const id = event.currentTarget.id.slice(6)
      // const tabby = document.getElementById(id)
      // console.log(event.currentTarget.id.slice(6), tabby)
      for (let t = 0; t < pcoClient.tabs.length; t++) {
        if (pcoClient.tabs[t].label === id) {
          pcoClient.tabs = pcoClient.tabs.splice(t, 1)
        }
      }
      // tabby.remove();
      // event.currentTarget.remove();
      pcoClient.updateTabs()
      setTabEnabled(false)
    }
    )
  }
}

function setTabEnabled (enabled) {
  const msgElm = document.getElementById('msg')
  const txtElm = document.getElementById('textarea')
  const mUserElm = document.getElementById('memoUserlist')
  if (enabled) {
    // We're doing active stuff
    msgElm.disabled = false
    msgElm.className = msgElm.className.replace(' inactive', '')
    txtElm.className = txtElm.className.replace(' inactive', '')
    mUserElm.className = mUserElm.className.replace(' inactive', '')
  } else {
    msgElm.disabled = true
    const allclassnames = msgElm.className + txtElm.className + mUserElm.className
    if (allclassnames.indexOf(' inactive') === -1) {
      msgElm.className += ' inactive'
      txtElm.className += ' inactive'
      mUserElm.className += ' inactive'
    }
    while (txtElm.firstChild) {
      txtElm.removeChild(txtElm.firstChild)
    }
    while (mUserElm.firstChild) {
      mUserElm.removeChild(mUserElm.firstChild)
    }
  }

  if (pcoClient.dead) {
    // Dead session, don't allow input
    msgElm.disabled = true
    if (msgElm.className.indexOf(' inactive') === -1) {
      msgElm.className += ' inactive'
    }
  }
}

function parsePesterchumSyntax (source, target, msg) {
  // Escapes tags, turns <c=#ffffff> to span, adds prefixes.
  let output = msg

  // Timeline
  if (target !== null) {
    if ((target[0] === '#') || (target[0] === '&')) {
      // Memo
      // Add timeline
      // console.log(output)
      let start = output.match(_memoMsgStart)
      if (start !== null) {
        start = start[0]
        const initials = start.match(_initials)
        start = start.replace(_initials, 'C' + initials)
        output = output.replace(_memoMsgStart, start)
      }
    }
  }
  const ctags = output.match(_ctagBegin)
  const smilies = output.match(_smilies)
  if (ctags !== null) {
    for (let i = 0; i < ctags.length; i++) {
      const rgb = ctags[i].match(_ctagRgb)
      if (rgb !== null) {
        output = output.replace(ctags[i], '<span style=\'color: rgb(' + rgb[0] + ');\'>')
      }
      const hex = ctags[i].match(_ctagHex)
      if (hex !== null) {
        output = output.replace(ctags[i], '<span style=\'color: ' + hex[0] + ';\'>')
      }
    }
  }
  output = output.replaceAll('</c>', '</span>')
  output = output.replaceAll(sanitizeHTML('</c>'), '</span>')

  // Smilies
  if (smilies !== null) {
    for (let i = 0; i < smilies.length; i++) {
      const smilename = smilies[i].replaceAll(':', '')
      const filename = smilename + '.gif'
      const replaceStr = `<img src='smilies/${filename}' alt='${smilename}' title='${smilename}'>`
      output = output.replaceAll(smilies[i], replaceStr)
    }
  }

  if (target !== null) {
    if ((target[0] === '#') || (target[0] === '&')) {
      // Memo
      // output = output
    } else if (source !== null) {
      // Convo
      // Get nick
      let nick = ''
      if (source[0] === ':') {
        nick = source.slice(1)
        if (nick.indexOf('!') !== -1) {
          nick = nick.split('!')[0]
        }
      } else {
        nick = source
      }
      // console.log(source, target, msg)
      // if (_evilRuleImSoSorry.test(msg) === false) {
      if (msg.search(_evilRuleImSoSorry) === -1) {
        // console.log('yea')
        const initials = getInitials(nick)
        output = initials + ': ' + output
      }
    }
  }
  return output
}

class PesterchumOnlineClient {
  constructor () {
    this.body = document.getElementsByTagName('body').item(0)
    this.color = document.getElementById('bloodcaste').value
    this.MemosTabOpen = true
    this.dead = false // Input is not allowed
    this.nick = null // FIXME, is this used?
    this.chums = new ChumsConstruct() // Stores data on individual others like color
    this.tabs = []
    this.userlist = []
    this.memolist = []
    // this.chum = new Object()
  }

  openChannelTab (channel) {
    // We open tabs with this and addText
    // Iterate through tabs, and check if it's present, add if not
    let found = false
    for (let i = 0; i < this.tabs.length; i++) {
      // This is to a memo
      if ((channel === this.tabs[i].label) && (this.tabs[i].memo)) {
        found = true
      }
    }
    // If we don't have a tab for the source, make one.
    if (!found) {
      // console.log('New tab ', channel);
      const newtab = new MemoConvoTab(channel, channel, null)
      const board = channel.slice(1).toUpperCase()
      newtab.tabcontent += `<span style='color: ${this.color};'>C${getInitials(this.nick)}</span> RIGHT NOW opened memo on board ${board}.`
      this.tabs.push(newtab)
    }
  }

  updateMemolist () {
    // Server memolist
    this.memolist.sort() // abc sort
    this.memolist.sort((a, b) => b[1] - a[1]) // Sort by usercount
    const chumroll = document.getElementById('chumroll')
    while (chumroll.firstChild) {
      chumroll.removeChild(chumroll.firstChild)
    }
    for (let i = 0; i < this.memolist.length; i++) {
      if (this.memolist[i] !== '') {
        const memostr = `${this.memolist[i][0]} (${this.memolist[i][1]})`
        // chumroll.innerHTML += "<div class='userlistChum'><button class='userlistButton'>" + memostr + "</button></div>";
        chumroll.insertAdjacentHTML('beforeend', '<div class=\'userlistChum\'><button class=\'userlistButton\'>' + memostr + '</button></div>')
      }
    }

    // Button clicks
    // let userButtons = document.getElementsByClassName('userlistButton')
    const userlistChum = document.getElementsByClassName('userlistChum')
    /* for (let i = 0; i < userButtons.length; i++) {
            userButtons[i].addEventListener('click', function (event) {
                let buttontext = event.currentTarget.innerHTML;
                ircClient.join(buttontext.split(',')[0])
                connectButtonEvents()
            }
            );
        } */
    for (let i = 0; i < userlistChum.length; i++) {
      userlistChum[i].addEventListener('click', function (event) {
        const userButton = event.currentTarget.getElementsByClassName('userlistButton')[0]
        const buttontext = userButton.innerHTML
        ircClient.join(buttontext.split(',')[0])
        connectButtonEvents()
      }
      )
    }
  }

  updateUserlist () {
    // Server userlist
    this.userlist.sort() // abc sort
    this.userlist.sort((a, b) => {
      // Put invalid handles last
      const aIsHandle = _chumhandle.test(a)
      const bIsHandle = _chumhandle.test(b)
      if (aIsHandle === bIsHandle) {
        return 0
      } else if ((aIsHandle) || (!bIsHandle)) {
        return -1
      } else if ((!aIsHandle) || (bIsHandle)) {
        return 1
      } else {
        return 0 // Shouldn't happen
      }
    })
    const chumroll = document.getElementById('chumroll')
    while (chumroll.firstChild) {
      chumroll.removeChild(chumroll.firstChild)
    }
    for (let i = 0; i < this.userlist.length; i++) {
      if (this.userlist[i] !== '') {
        // chumroll.innerHTML += "<div class='userlistChum'><button class='userlistButton'>" + this.userlist[i] + "</button></div>";
        chumroll.insertAdjacentHTML('beforeend', '<div class=\'userlistChum\'><button class=\'userlistButton\'>' + this.userlist[i] + '</button></div>')
      }
    }

    // Button clicks
    // let userButtons = document.getElementsByClassName('userlistButton')
    const userlistChum = document.getElementsByClassName('userlistChum')
    /* for (let i = 0; i < userlistChum.length; i++) {
            let userButton = userlistChum[i].getElementsByClassName('userlistButton')[0]
            userButton.addEventListener('click', function (event) {
                let buttontext = event.currentTarget.innerHTML;
                ircClient.msg(buttontext, "PESTERCHUM:BEGIN")
                pcoClient.addText(ircClient.handle, buttontext, "PESTERCHUM:BEGIN")
                pcoClient.updateTabs()
                connectButtonEvents()
            }
            )
        }
        console.log(userlistChum) */
    for (let i = 0; i < userlistChum.length; i++) {
      userlistChum[i].addEventListener('click', function (event) {
        const userButton = event.currentTarget.getElementsByClassName('userlistButton')[0]
        const buttontext = userButton.innerHTML
        ircClient.msg(buttontext, 'PESTERCHUM:BEGIN')
        pcoClient.addText(ircClient.handle, buttontext, 'PESTERCHUM:BEGIN')
        pcoClient.updateTabs()
        connectButtonEvents()
      }
      )
    }
  }

  updateTabs () {
    // Checks if we have all tabs in the doc

    // Tab buttons
    const tablinks = this.maintab.getElementsByClassName('tablinks')
    const tablinksInner = []
    for (let i = 0; i < tablinks.length; i++) {
      tablinksInner.push(tablinks[i].innerHTML)
    }
    for (let i = 0; i < this.tabs.length; i++) {
      const label = this.tabs[i].label
      const pos = tablinksInner.indexOf(label)
      if (_memoPrefix.test(label)) {
        // Memo
        if (pos === -1) {
          // Not present
          // this.maintab.innerHTML += `<button id='${label}' class='tablinks'>${label}</button>`;
          this.maintab.insertAdjacentHTML('beforeend', `<button id='${label}' class='tablinks'>${label}</button>`)
          // this.maintab.innerHTML += `<button id='leave_${label}' class='part'>X</button>`;
        }
      } else {
        // Convo
        if (pos === -1) {
          // Not present
          // this.maintab.innerHTML += `<button id='${label}' class='tablinks'>${label}</button>`;
          this.maintab.insertAdjacentHTML('beforeend', `<button id='${label}' class='tablinks'>${label}</button>`)
          // this.maintab.innerHTML += `<button id='leave_${label}' class='part'>X</button>`;
        }
      }
    }

    // Close buttons position
    /* for (let i = 0; i < this.tabs.length; i++) {
            let label = this.tabs[i].label;
            let elm = document.getElementById(label);
            let elmRect = elm.getBoundingClientRect();
            let closeElm = document.getElementById(`leave_${label}`);
            closeElm.style.left = (elmRect.right - 20) + 'px';
            closeElm.style.top = (elmRect.y + 4) + 'px';
            //console.log('woowa', closeElm, elm)
        } */

    // Check if closed
    const alllabels = []
    for (let i = 0; i < this.tabs.length; i++) {
      alllabels.push(this.tabs[i].label)
    }
    // console.log('alllabels: ', alllabels)
    // for (let i = 0; i < this.tabs.length; i++) {

    // }

    // textarea
    for (let n = 0; n < this.tabs.length; n++) {
      // console.log(this.tabs[n])
      if (this.tabs[n].active) {
        // this.textarea.innerHTML = this.tabs[n].tabcontent;
        while (this.textarea.firstChild) {
          this.textarea.removeChild(this.textarea.firstChild)
        }
        this.textarea.insertAdjacentHTML('beforeend', this.tabs[n].tabcontent)
        this.textarea.scrollTop = this.textarea.scrollHeight // Scroll to bottom
      }
    }
  }

  addText (source, target, msg) {
    // pchum begin
    if (msg === 'PESTERCHUM:BEGIN') {
      // -- Horse [HH] began pestering Horse [HH] at 07:19 --
      // msg = "-- " + source + "[] began pestering " + target + " [] at 00:00 --";
      // msg = `-- ${source}[${getInitials(source)}] began pestering ${target} [${getInitials(target)}] at ${time()} --`;

      const srcInitials = `<c=${pcoClient.chums.getColor(source)}>[${getInitials(source)}]</c>`
      const targetInitials = `<c=${pcoClient.chums.getColor(target)}>[${getInitials(target)}]</c>`
      msg = `<c=100,100,100>-- ${source} ${srcInitials} began pestering ${target} ${targetInitials} at ${time()} --</c>`
    }

    // Iterate through tabs, and check if it's present, add if not
    let found = false
    for (let i = 0; i < this.tabs.length; i++) {
      if (_memoPrefix.test(target[0])) {
        // This is to a memo
        if ((target === this.tabs[i].target) && (this.tabs[i].memo)) {
          found = true
        }
      } else if (source !== this.nick) {
        // This is not to a memo
        if ((source === this.tabs[i].label) && (!this.tabs[i].memo)) {
          found = true
        }
      } else if (source === this.nick) {
        // This is not to a memo
        if ((target === this.tabs[i].label) && (!this.tabs[i].memo)) {
          found = true
        }
      }
    }
    // If we don't have a tab for the source, make one.
    if (!found) {
      let newtab
      if (source !== this.nick) {
        newtab = new MemoConvoTab(source, target, null)
      } else {
        newtab = new MemoConvoTab(source, target, target)
      }
      if (newtab.memo) {
        newtab.tabcontent += `C${getInitials(this.nick)} RIGHT NOW opened memo on board ${target}.`
      }
      this.tabs.push(newtab)
    }
    // console.log(this.tabs)
    // Iterate through tabs, and add text
    for (let i = 0; i < this.tabs.length; i++) {
      // X RESPONSED TO MEMO
      if ((_memoPrefix.test(target[0])) && (target === this.tabs[i].target) && (this.tabs[i].announced.indexOf(source) === -1)) {
        this.tabs[i].announced.push(source)
        this.tabs[i].tabcontent += `<div>CURRENT ${source} [C${getInitials(source)}] RIGHT NOW responded to memo.</div>`
      }

      // Add text
      if (_memoPrefix.test(target[0])) {
        // This is to a memo
        if ((target === this.tabs[i].target) && (this.tabs[i].memo)) {
          // console.log('Add to tab (memo) ', target, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          // this.tabs[i].tabcontent += msg + '<br>'
          this.tabs[i].tabcontent += `<div>${msg}</div>`
          audioCheck(true, msg)
        }
      } else if (source !== this.nick) {
        // This is not to a memo, we didn't send this msg.
        if ((source === this.tabs[i].label) && (!this.tabs[i].memo)) {
          // console.log('Add to tab (convo) ', source, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          // this.tabs[i].tabcontent += msg + '<br>'
          this.tabs[i].tabcontent += `<div><span style="color: rgb(${this.chums.getColor(source)});">${msg}</span></div>`
          audioCheck(false, msg)
        }
      } else if (source === this.nick) {
        // This is not to a memo, we send this msg.
        if ((target === this.tabs[i].label) && (!this.tabs[i].memo)) {
          // console.log('Add to tab (convo) ', source, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          this.tabs[i].tabcontent += `<div>${msg}</div>`
        }
      }
    }
    // console.log(this.tabs);
    // console.log("found is ", found);
  }

  tabify () {
    this.body.insertAdjacentHTML('beforeend',
      '<div id=\'chonkers\'>' +
                                     '<button id=\'part\'>X</button>' +
                                     '<div id=\'chumrollContainer\'>' +
                                     '<button id=\'memolistButton\' class=\'MemosChumsTabs active\'>MEMOS</button>' +
                                     '<button id=\'userlistButton\' class=\'MemosChumsTabs\'>CHUMS</button>' +
                                     '<div id=\'chumroll\'>' +
                                     '</div>' +
                                     '<div class=\'manualJoin\'><div>JOIN MEMO:</div>' +
                                     '<form id=\'manualJoinForm\'>' +
                                     '<input id=\'manualJoinInput\' minlength=\'1\' required>' +
                                     '</form>' +
                                     '</div>' +
                                     '</div>' +
                                     '<button class=\'hidebutton\' id=\'hideChumroll\'>&#8594;</button>' + // -->
                                     '<div id=\'tabContainer\'>' +
                                     '<div id=\'maintab\' class=\'tab\'></div>' +
                                     '<div id=\'textAndInputBox\'>' +
                                     '<div id=\'textarea\' class=\'textarea inactive\'></div>' +
                                     '<form id=\'msgform\'>' +
                                     '<input id=\'msg\' class=\'msg inactive\' minlength=\'1\' required disabled>' +
                                     '</form>' +
                                     '</div>' +
                                     '<button class=\'hidebutton\' id=\'hideMemoUsers\'>&#8594;</button>' + // -->
                                     '<div id=\'memoUserlist\' class=\'memoUserlist inactive\'></div>' +
                                     '</div>' +
                                     '</div>')
    this.maintab = document.getElementById('maintab')
    this.textarea = document.getElementById('textarea')

    this.hideMemoUserlist = document.getElementById('hideMemoUsers')
    this.hideChumroll = document.getElementById('hideChumroll')

    this.hideMemoUserlist.addEventListener('click', function (event) {
      const memoUserlist = document.getElementById('memoUserlist')
      const textAndInputBox = document.getElementById('textAndInputBox')
      const elmTxt = event.currentTarget.innerHTML
      if (['&#8594;', '???'].indexOf(elmTxt) !== -1) { // -->
        memoUserlist.style.display = 'none'
        event.currentTarget.innerHTML = '&#8592;' // <--
        // console.log(textAndInputBox.style.width)
        switch (textAndInputBox.style.width) {
          case '':
            textAndInputBox.style.width = '85%'
            break
          case '65%':
            textAndInputBox.style.width = '85%'
            break
        }
      } else {
        memoUserlist.style.display = 'initial'
        event.currentTarget.innerHTML = '&#8594;' // -->
        switch (textAndInputBox.style.width) {
          case '85%':
            textAndInputBox.style.width = '65%'
            break
        }
      }
    }
    )

    this.hideChumroll.addEventListener('click', function (event) {
      const tabContainer = document.getElementById('tabContainer')
      const chumrollContainer = document.getElementById('chumrollContainer')
      const elmTxt = event.currentTarget.innerHTML
      if (['&#8594;', '???'].indexOf(elmTxt) !== -1) { // -->
        chumrollContainer.style.display = 'none'
        event.currentTarget.innerHTML = '&#8592;' // <--
        switch (tabContainer.style.width) {
          case '':
            tabContainer.style.width = '100%'
            break
          case '75%':
            tabContainer.style.width = '100%'
            break
        }
      } else {
        chumrollContainer.style.display = 'initial'
        event.currentTarget.innerHTML = '&#8594;' // -->
        switch (tabContainer.style.width) {
          case '100%':
            tabContainer.style.width = '75%'
            break
        }
      }
    }
    )
  }

  clear () {
    this.body.innerHTML = ''
  }
}

function audioCheck (isToMemo, msg) {
  /* Check if we should play a goofy silly sound. */
  if (_honk.test(msg)) {
    // We were honked!!
    soundHonk.play()
  }
  if (isToMemo) {
    if ((msg.indexOf(ircClient.handle) !== -1) || (msg.indexOf(getInitials(ircClient.handle)) !== -1)) {
      // We were mentioned!!
      alarmMention.play()
    }
    alarmMemo.play()
  } else {
    if (_evilRuleImSoSorry.test(msg)) {
      soundCease.play()
    } else {
      alarmDm.play()
    }
  }
}

class IrcClient {
  constructor (handle) {
    this.handle = handle
  }

  // Register to server
  register () {
    this.socket.send('NICK ' + this.handle)
    this.socket.send('USER pco 0 * :pco')
  }

  connect () {
    // create websocket connection
    this.socket = new WebSocket('wss://irc.pesterchum.xyz:8443')
  }

  send (data) {
    // Send raw data
    // console.log('Send message to server ', data);
    this.socket.send(data)
  }

  msg (target, message) {
    // Shorthand for PRIVMSG
    // <target>{,<target>} <text to be sent>
    this.socket.send('PRIVMSG ' + target + ' :' + message)
  }

  join (channel) {
    // Join a channel
    // <channel>{,<channel>} [<key>{,<key>}]
    this.socket.send('JOIN ' + channel)
  }

  part (channel) {
    // Leave a channel
    // <channel>{,<channel>}
    this.socket.send('PART ' + channel)
  }

  names (channel) {
    // Get channel users
    this.socket.send('NAMES ' + channel)
  }

  list () {
    // Get channels
    this.socket.send('LIST')
  }
}

const sanitizeHTML = function (str) {
  if (!allowTags) {
    str = str.replace(_amp, '&#38;')
    str = str.replace(_quot, '&quot;')
    str = str.replace(_ampo, '&#039;')
    str = str.replace(_lt, '&#60;')
    str = str.replace(_gt, '&#62;')
    return str
  } else {
    return str
  }
}
