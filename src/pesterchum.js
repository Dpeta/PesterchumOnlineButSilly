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
  // this was commented by ale since this is not used anymore
  // const maintab = document.getElementById('maintab')
  /*
  maintab.addEventListener('scroll', function (event) {
    updatePartButtonPos()
  })
*/
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
      // deleted by ale not needed anymore
      // event.currentTarget.style.display = 'none'

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
        // pcoClient.tabs[n].tabcontent += `<div>${msg}</div>`
        pcoClient.tabs[n].textfield.insertAdjacentHTML('beforeend', `<div>${msg}</div>`)
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
            // pcoClient.tabs[n].tabcontent += `<div><span style='color: grey;'>${msg}</span></div>`
          } else if ((pcoClient.tabs[n].label.toLowerCase() === sourcenick.toLowerCase()) && (ServicesBots.indexOf(sourcenick.toUpperCase()) !== -1)) {
            // Services messages
            if (((msg.indexOf('Unknown command') !== -1) && (msg.indexOf('PESTERCHUM:BEGIN') !== -1)) === false) {
              // pcoClient.tabs[n].tabcontent += `<div><span style='color: black;'>${msg}</span></div>`
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
        // updateQue[i].tabcontent += `<div>${leaveMsg}</div>`
        updateQue[i].textfield.insertAdjacentHTML('beforeend', `<div>${leaveMsg}</div>`)

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
        // updateQue[i].tabcontent += `<div>${leaveMsg}</div>`
        updateQue[i].textfield.insertAdjacentHTML('beforeend', `<div>${leaveMsg}</div>`)
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
    //    this.tabcontent = '' // All msges
    this.userlist = [] // Array of users present
    this.announced = []
    this.active = false
    this.textfield = null

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
      //      // document.getElementById('textarea').innerHTML = targetTab[n].tabcontent;
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
// this code was hidden by ale, since button now is fixed, no needed anymore
/*
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
*/
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
          /*
          while (pcoClient.textarea.firstChild) {
            pcoClient.textarea.removeChild(pcoClient.textarea.firstChild)
          }
          //pcoClient.textarea.insertAdjacentHTML('beforeend', pcoClient.tabs[n].tabcontent)
          */
          for (let n = 0; n < pcoClient.tabs.length; n++) {
            if (pcoClient.tabs[n].active) {
              pcoClient.tabs[n].textfield.hidden = false
            } else {
              pcoClient.tabs[n].textfield.hidden = true
            }
          }
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
      // deleted by ale not needed anymore
      // updatePartButtonPos()

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
    // while (txtElm.firstChild) {
    //  txtElm.removeChild(txtElm.firstChild)
    // }
    // Hide all tabtexts
    const texts = document.getElementsByClassName('tabtext')
    for (let i = 0; i < texts.length; i++) {
      texts[i].hidden = true
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
    this.body = document.getElementsByTagName('main').item(0)
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
      //      newtab.tabcontent += `<div><span style='color: ${this.color};'>C${getInitials(this.nick)}</span> RIGHT NOW opened memo on board ${board}.</div>`
      pcoClient.textarea.insertAdjacentHTML('beforeend', `<div class="tabtext" id="text_${newtab.label}"></div>`)
      newtab.textfield = document.getElementById(`text_${newtab.label}`)
      newtab.textfield.insertAdjacentHTML('beforeend', `<div><span style='color: ${this.color};'>C${getInitials(this.nick)}</span> RIGHT NOW opened memo on board ${board}.</div>`)
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
        this.tabs[n].textfield.hidden = false
      } else {
        this.tabs[n].textfield.hidden = true
      }
    }
    this.textarea.scrollTop = this.textarea.scrollHeight // Scroll to bottom
  }

  addText (source, target, msg) {
    // pchum begin
    if (msg === 'PESTERCHUM:BEGIN') {
      // -- Horse [HH] began pestering Horse [HH] at 07:19 --
      // msg = "-- " + source + "[] began pestering " + target + " [] at 00:00 --";
      // msg = `-- ${source}[${getInitials(source)}] began pestering ${target} [${getInitials(target)}] at ${time()} --`;

      const srcInitials = `<c=${pcoClient.chums.getColor(source)}>[${getInitials(source)}]</c>`
      const targetInitials = `<c=${pcoClient.chums.getColor(target)}>[${getInitials(target)}]</c>`
      msg = `<div><c=100,100,100>-- ${source} ${srcInitials} began pestering ${target} ${targetInitials} at ${time()} --</c></div>`
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
      pcoClient.textarea.insertAdjacentHTML('beforeend', `<div class="tabtext" id="text_${newtab.label}"></div>`)
      newtab.textfield = document.getElementById(`text_${newtab.label}`)
      if (newtab.memo) {
        // newtab.tabcontent += `<div>C${getInitials(this.nick)} RIGHT NOW opened memo on board ${target}.</div>`
        newtab.textfield.insertAdjacentHTML('beforeend', `<div>C${getInitials(this.nick)} RIGHT NOW opened memo on board ${target}.</div>`)
      }
      this.tabs.push(newtab)
    }
    // console.log(this.tabs)
    // Iterate through tabs, and add text
    for (let i = 0; i < this.tabs.length; i++) {
      // X RESPONSED TO MEMO
      if ((_memoPrefix.test(target[0])) && (target === this.tabs[i].target) && (this.tabs[i].announced.indexOf(source) === -1)) {
        this.tabs[i].announced.push(source)
        // this.tabs[i].tabcontent += `<div>CURRENT ${source} [C${getInitials(source)}] RIGHT NOW responded to memo.</div>`
        this.tabs[i].textfield.insertAdjacentHTML('beforeend', `<div>CURRENT ${source} [C${getInitials(source)}] RIGHT NOW responded to memo.</div>`)
      }

      // Add text
      if (_memoPrefix.test(target[0])) {
        // This is to a memo
        if ((target === this.tabs[i].target) && (this.tabs[i].memo)) {
          // console.log('Add to tab (memo) ', target, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          // this.tabs[i].tabcontent += msg + '<br>'
          // this.tabs[i].tabcontent += `<div>${msg}</div>`
          this.tabs[i].textfield.insertAdjacentHTML('beforeend', `<div>${msg}</div>`)
          audioCheck(true, msg)
        }
      } else if (source !== this.nick) {
        // This is not to a memo, we didn't send this msg.
        if ((source === this.tabs[i].label) && (!this.tabs[i].memo)) {
          // console.log('Add to tab (convo) ', source, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          // this.tabs[i].tabcontent += msg + '<br>'
          // this.tabs[i].tabcontent += `<div><span style="color: rgb(${this.chums.getColor(source)});">${msg}</span></div>`
          this.tabs[i].textfield.insertAdjacentHTML('beforeend', `<div><span style="color: rgb(${this.chums.getColor(source)});">${msg}</span></div>`)
          audioCheck(false, msg)
        }
      } else if (source === this.nick) {
        // This is not to a memo, we send this msg.
        if ((target === this.tabs[i].label) && (!this.tabs[i].memo)) {
          // console.log('Add to tab (convo) ', source, msg);
          msg = parsePesterchumSyntax(source, target, msg)
          // this.tabs[i].tabcontent += `<div>${msg}</div>`
          this.tabs[i].textfield.insertAdjacentHTML('beforeend', `<div>${msg}</div>`)
        }
      }
    }
    // console.log(this.tabs);
    // console.log("found is ", found);
  }

  tabify () {
    this.body.insertAdjacentHTML('beforeend',
      '<div id=\'chonkers\' class=\'border-radius-effect\'>' +
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
                                     '<div class=\'mainContainer\'>' +
                                     '<div id=\'maintab\' class=\'tab\'>' +
                                     '<div class=\'tab-arrow-container\'>' +
                                     '<button id=\'part\' class=\'tab-arrow\' >X</button>' +
                                     '<button class=\'tab-arrow\' > <- </button>' +
                                     '<button class=\'tab-arrow\' > -> </button>' +
                                     '</div>' +
                                     '</div>' +
                                     '<div id=\'textAndInputBox\'>' +
                                     '<div id=\'textarea\' class=\'textarea inactive border-radius-effect\'></div>' +
                                     '<form id=\'msgform\'>' +
                                     '<input id=\'msg\' class=\'msg inactive border-radius-effect\' minlength=\'1\' required disabled>' +
                                     '</form>' +
                                     '<div class="action-button-wrapper">' +
                                     '<button class="menu-button">Silence</button>' +
                                     '<button class="menu-button">Edit theme</button>' +
                                     '</div>' +
                                     '</div>' +
                                     '<button class=\'hidebutton\' id=\'hideMemoUsers\'>&#8594;</button>' + // -->
                                     '</div>' +
                                     '</div>' +
                                     '<div id=\'memoUserlist\' class=\'memoUserlist inactive border-radius-effect\'></div>')
    this.maintab = document.getElementById('maintab')
    this.textarea = document.getElementById('textarea')

    //
    //
    // This coded was added by laaledesiempre, this does not respect the original
    // convetions this code had, so sorry for that, this still WIP

    const maintabScrollValues = {
      x: 0
    }
    document.querySelectorAll('.tab-arrow')[2].addEventListener('click', () => {
      const box = document.querySelector('#maintab')
      console.log(maintabScrollValues.x)
      if (maintabScrollValues.x > box.scrollLeft + 71) {
        maintabScrollValues.x = box.scrollLeft
        box.scrollLeft = maintabScrollValues.x
      } else {
        maintabScrollValues.x += 70
        box.scrollLeft = +maintabScrollValues.x
      }
    })
    document.querySelectorAll('.tab-arrow')[1].addEventListener('click', () => {
      const box = document.querySelector('#maintab')
      console.log(maintabScrollValues.x)
      if (maintabScrollValues.x < 0) {
        maintabScrollValues.x = 0
        box.scrollLeft = maintabScrollValues.x
      } else {
        maintabScrollValues.x -= 70
        box.scrollLeft = maintabScrollValues.x
      }
    })

    // action buttons
    const actionWrapperButtons = document.querySelectorAll('.action-button-wrapper button')
    const toggleAudioSound = () => {
      toggleAudio = !toggleAudio
      actionWrapperButtons[0].innerHTML = toggleAudio ? 'Silence' : 'Unsilence'
    }
    actionWrapperButtons[0].addEventListener('click', () => toggleAudioSound())
    actionWrapperButtons[1].addEventListener('click', () => document.querySelector("#color-dialog").showModal())

    // Here is where the WIP ends
    //
    //
    this.hideMemoUserlist = document.getElementById('hideMemoUsers')
    this.hideChumroll = document.getElementById('hideChumroll')

    this.hideMemoUserlist.addEventListener('click', function (event) {
      const memoUserlist = document.getElementById('memoUserlist')
      const textAndInputBox = document.getElementById('textAndInputBox')
      const elmTxt = event.currentTarget.innerHTML
      if (['&#8594;', '→'].indexOf(elmTxt) !== -1) { // -->
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
      if (['&#8594;', '→'].indexOf(elmTxt) !== -1) { // -->
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
let toggleAudio = true

function audioCheck (isToMemo, msg) {
  /* Check if we should play a goofy silly sound. */
  if (toggleAudio) {
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
/*
  ____             _                                   _     
 |  _ \           | |                                 | |    
 | |_) | __ _  ___| | ____ _ _ __ ___  _   _ _ __   __| |___ 
 |  _ < / _` |/ __| |/ / _` | '__/ _ \| | | | '_ \ / _` / __|
 | |_) | (_| | (__|   < (_| | | | (_) | |_| | | | | (_| \__ \
 |____/ \__,_|\___|_|\_\__, |_|  \___/ \__,_|_| |_|\__,_|___/
                        __/ |                                
                       |___/  
*/

const backgroundWrapper = document.querySelector('.background-wrapper')
const backgroundImage = document.querySelectorAll('.background-image')
const backgroundImageWrapper = document.querySelector('#background-image-wrapper')
const storedBackground = window.localStorage.getItem('background')

// Theming model
class BackgroundImage {
  constructor (
    name,
    path,
    alt
  ) {
    this.name = name
    this.path = path
    this.alt = alt
  }

  /** Changes the current background src into this one */
  changeBackground () {
    customTheme.colors.background=Background.instances.findIndex(e=>e.name===this.name)
    backgroundImage.forEach(e => {
      e.src = this.path
    })
    backgroundImageWrapper.style.display = "flex"
  }
}
// Theme factory
class Background {
  static instances = []

  /** Creates a new background image instance and adds it to the instance count
   *  Args:
   *  name : String => Image name, used for id
   *  path: String => image source, example: "backgrounds/pesterchum_icon.png"
   *  alt : alt text for screen reader
   * */
  static new (name, path, alt) {
    const newInstance = new BackgroundImage(name, path, alt)
    this.instances.push(newInstance)
    return newInstance
  }
}

// here comes the background instances
Background.new('beta', 'backgrounds/beta_kids_background.webp', 'beta kids icons, artist: paleWreath')
Background.new('alpha', 'backgrounds/alpha_kids_background.webp', 'alpha kids icons, artist: paleWreath')
Background.new('mixed', 'backgrounds/mix_kids_background.webp', 'mixed kids icons, artist: paleWreath')
Background.new('derse', 'backgrounds/derse_background.webp', 'derse buildings themed, artist: paleWreath')
Background.new('prospit', 'backgrounds/prospit_background.webp', 'prospit buildings, artist: paleWreath')
Background.new('karkat', 'backgrounds/karkat_background.webp', 'karkat themed, artist: paleWreath')
Background.new('karkalicious', 'backgrounds/karkalicious_background.webp', 'karkalicious so delicious, artist: paleWreath')
Background.new('aradia', 'backgrounds/aradia_background.webp', 'aradia themed, artist: paleWreath')
Background.new('tavros', 'backgrounds/tavros_background.webp', 'tavro themed, artist: paleWreath')
Background.new('sollux', 'backgrounds/sollux_background.webp', 'sollux themed, artist: paleWreath')
Background.new('nepeta', 'backgrounds/nepeta_background.webp', 'nepeta themed, artist: paleWreath')
Background.new('kanaya', 'backgrounds/kanaya_background.webp', 'kanaya themed, artist: paleWreath')
Background.new('terezi', 'backgrounds/terezi_background.webp', 'terezi themed, artist: paleWreath')
Background.new('vriska', 'backgrounds/vriska_background.webp', 'vriska themed, artist: paleWreath')
Background.new('equius', 'backgrounds/equius_background.webp', 'equius themed, artist: paleWreath')
Background.new('gamzee', 'backgrounds/gamzee_background.webp', 'gamzee themed, artist: paleWreath')
Background.new('eridan', 'backgrounds/eridian_background.webp', 'eridan themed, artist: paleWreath')
Background.new('feferi', 'backgrounds/feferi_background.webp', 'feferi themed, artist: paleWreath')
Background.new('red-juju', 'backgrounds/red_juju_background.webp', 'a red spiral')
Background.new('green-juju', 'backgrounds/green_juju_background.webp', 'a green spiral')
Background.new('pool', 'backgrounds/pool_background.webp', 'pool balls')
Background.new('caliborn', 'backgrounds/caliborn_background.webp', 'doodles and drawings made by caliborn, artist:')
Background.new('strider', 'backgrounds/strider_background.webp', 'strider vinil icon scratched and whole')
Background.new('lalonde', 'backgrounds/lalonde_background.webp', 'both lalonde icons, a squid and a muttant kitten')
Background.new('signs', 'backgrounds/signs_rainbow_background.webp', 'main troll zodiac signs')
Background.new('sbahj', 'backgrounds/sbahj_background.webp', 'warned you about the stairs meme')
Background.new('egbert', 'backgrounds/egbert_background.webp', 'jonh egbert pogo icon')
Background.new('squiddles', 'backgrounds/squiddles_background.webp', 'a bunch of squiddles')
Background.new('dirk-brr', 'backgrounds/dirkbrr_background.webp', 'a circle of dirk faces, artist: au dave')
Background.new('dave-brr', 'backgrounds/davebrr_background.webp', 'a circle of handrawed dave discs, artist: au dave')

// background buttons
Background.instances.forEach(e => {
  backgroundWrapper.innerHTML += `
  <button class="background-button" type="button" id="${e.name}">
    <img src="${e.path}" alt="${e.path}"/> 
  </button>
`
})

// Background buttons actions
const buttons = document.querySelectorAll('.background-button')
buttons.forEach((e, i) => {
  e.addEventListener('click', () => {
    Background.instances[i].changeBackground()
    backgroundImageWrapper.style.display = 'flex'
  })
})

// Reset background action
document.querySelector('#reset-background').addEventListener('click', () => {
  backgroundImageWrapper.style.display = 'none'
})
/*
  _______ _                              
 |__   __| |                             
    | |  | |__   ___ _ __ ___   ___  ___ 
    | |  | '_ \ / _ \ '_ ` _ \ / _ \/ __|
    | |  | | | |  __/ | | | | |  __/\__ \
    |_|  |_| |_|\___|_| |_| |_|\___||___/
*/

const hexTransparency=(float)=>{
  return parseInt(255*parseFloat(float)).toString(16)
}
const setCssProperty=(name,value)=>{
    document.documentElement.style.setProperty(name,value)
}

// Theming model
class ColorScheme {
  constructor (
    colors,
    image) {
    this.name = colors.name
    this.image = image
    this.colors = colors
  }

  /** Changes the current color scheme into this one */
  changeTheme () {
    const inputs = document.querySelectorAll('#color-dialog input')
    //name does not change bc of shenanigans

    //outsideColor
    inputs[1].value=this.colors["outsideColor"]
    inputs[2].value=this.colors["outsideColorOpacity"]
    setCssProperty("--outside-color",this.colors["outsideColor"]+hexTransparency(this.colors["outsideColorOpacity"]))

    //insideColor
    inputs[3].value=this.colors["insideColor"]
    inputs[4].value=this.colors["insideColorOpacity"]
    setCssProperty("--inside-color",this.colors["insideColor"]+hexTransparency(this.colors["insideColorOpacity"]))

    //buttonAndBorderAscent
    inputs[5].value=this.colors["buttonAndBorderAscent"]
    inputs[6].value= this.colors["buttonAndBorderAscentOpacity"]
    setCssProperty("--button-and-border-ascent",this.colors["buttonAndBorderAscent"]+hexTransparency(this.colors["buttonAndBorderAscentOpacity"]))

    //unselectedColor
    inputs[7].value=this.colors["unselectedColor"]
    inputs[8].value= this.colors["unselectedColorOpacity"]
    setCssProperty("--unselected-color",this.colors["unselectedColor"]+hexTransparency(this.colors["unselectedColorOpacity"]))

    //black
    inputs[9].value=this.colors["black"]
    inputs[10].value=this.colors["blackOpacity"]
    setCssProperty("--black",this.colors["black"]+hexTransparency(this.colors["blackOpacity"]))

    //white
    inputs[11].value=this.colors["white"]
    inputs[12].value=this.colors["whiteOpacity"]
    setCssProperty("--white",this.colors["white"]+hexTransparency(this.colors["whiteOpacity"]))

    //buttonBorderColor
    inputs[13].value=this.colors["buttonBorderColor"]
    inputs[14].value=this.colors["buttonBorderColorOpacity"]
    setCssProperty("--button-border-color",this.colors["buttonBorderColor"]+hexTransparency(this.colors["buttonBorderColorOpacity"]))

    //borderRadius
    inputs[15].value=this.colors["borderRadius"]
    setCssProperty("--border-radius",this.colors["borderRadius"]+"rem")

    //Background
    if (this.colors.background!=null){
      Background.instances[this.colors.background].changeBackground() 
    } else {
      customTheme.colors.background=null
      backgroundImageWrapper.style.display = 'none'
    } 

    Theme.loadedThemes.currentTheme=this.colors.name
    Theme.saveChanges()
  }
}

// Themes Color Schemes
const pesterchumColors = {
  name: 'pesterchum',
  outsideColor: '#d59700',
  outsideColorOpacity: '1',
  insideColor: '#ffb500',
  insideColorOpacity: '1',
  buttonAndBorderAscent: '#fff700',
  buttonAndBorderAscentOpacity: '1',
  unselectedColor: '#5f5f5f',
  unselectedColorOpacity: '1',
  black: '#000001',
  blackOpacity: '1',
  white: '#ffffff',
  whiteOpacity: '1',
  buttonBorderColor: '#c59400',
  buttonBorderColorOpacity: '1',
  borderRadius:0,
  background: null
}

const trollianColors = {
  name: 'trollian',
  outsideColor: '#c2c2c2',
  outsideColorOpacity: '1',
  insideColor: '#e30421',
  insideColorOpacity: '1',
  buttonAndBorderAscent: '#ffa5a4',
  buttonAndBorderAscentOpacity: '1',
  unselectedColor: '#5f5f5f',
  unselectedColorOpacity: '1',
  black: '#000001',
  blackOpacity: '1',
  white: '#ffffff',
  whiteOpacity: '1',
  buttonBorderColor: '#b00e14',
  buttonBorderColorOpacity: '1',
  borderRadius:0,
  background:null
}

// defining the customTheme variable
let customTheme;

// Reset the theming system if is an old one, please delete this in some time
window.localStorage.getItem("customTheme") && window.localStorage.clear()

// Creating the save if it doesnt exist
!window.localStorage.getItem("themes") && window.localStorage.setItem("themes",'{"currentTheme":"Pesterchum","themes":{}}')

// Theme factory
class Theme {
  static instances = []
  static loadedThemes= {}

  /** Creates a new Color Scheme instance and adds it to the instance count use this only for official colors not custom
   * @param {Object} colors Colors object
   * @param {String||null} image Image path or null
   * @example Theme.new({
   *    name: 'trollian',
   *    outsideColor: '#c2c2c2',
   *    outsideColorOpacity: '1',
   *    insideColor: '#e30421',
   *    insideColorOpacity: '1',
   *    buttonAndBorderAscent: '#ffa5a4',
   *    buttonAndBorderAscentOpacity: '1',
   *    unselectedColor: '#5f5f5f',
   *    unselectedColorOpacity: '1',
   *    black: '#000001',
   *    blackOpacity: '1',
   *    white: '#ffffff',
   *    whiteOpacity: '1',
   *    buttonBorderColor: '#b00e14',
   *    buttonBorderColorOpacity: '1',
   *    borderRadius:0
   * },null)
   * */
  static new (colors, image=null) {
    const newInstance = new ColorScheme(colors,image) // Creates the new color instance

    const instanceRepetitionIndex=this.instances.findIndex(e=>e.colors.name===colors.name) // Finds a theme on the instance list with same name and returns index

    if (instanceRepetitionIndex!==-1) { // if its not found (-1) it adds it to instances, else, if refresh the old one with new values
      this.instances[instanceRepetitionIndex]=newInstance
    } else {
      this.instances.push(newInstance)
    }
    return newInstance
  }

  /**
   *  Reset all the theming, deleting all the saved data and current state 
   */
  static reset(){
    window.localStorage.setItem("themes",'{"currentTheme":"Pesterchum","themes":{}}')
    Theme.defaultState()
    Theme.load()
    Theme.buildList()
    Theme.instances[0].changeTheme()
  }

  /**
   * Saves a Custom theme on the localStorage and updates the html
   * @param {Object} colors a color object 
   */
  static save(colors){
    Theme.new(colors)
    const newTheme={}
    newTheme.name=colors.name
    newTheme.colors=colors
    this.loadedThemes.themes[`${colors.name}`]=newTheme
    this.loadedThemes.currentTheme=colors.name
    Theme.saveChanges()
  }

  /**
   * Cleans the instance count and sets the default themes
   */
  static defaultState(){
    Theme.instances=[]
    Theme.new(pesterchumColors, 'img/pesterchum_icon.png')
    Theme.new(trollianColors, 'img/trollian_icon.png')
    const customValues= {...pesterchumColors}
    customValues["name"]="custom"
    customTheme= Theme.new(customValues)
  }

  /**
   * Load custom themes from the json
   * @param {JSON} [themes=localStorage.getItem("themes")] 
   */
  static load(themes=localStorage.getItem("themes")){
    let themeSystem=JSON.parse(themes)
    this.loadedThemes=themeSystem
    
    if (Object.keys(this.loadedThemes.themes).length) {
      for (let x in this.loadedThemes.themes) {
        let theme=this.loadedThemes.themes[x]
        Theme.new(theme.colors)
      }
      let current= Theme.instances.find(e=>e.colors.name===Theme.loadedThemes.currentTheme)
      current.changeTheme()
      Theme.buildList()
    }  
  }

  /**
   * Builds the list of themes you can find in '.theme-wrapper' based on the current Theme.instances state
   */
  static buildList(){
    try {
    const themeWrapper = document.querySelector('.theme-wrapper')
    themeWrapper.innerHTML = ''
    Theme.instances.forEach(
      e => {
        themeWrapper.innerHTML += `
          <button class='theme-button' id='${'theme-' + e.colors.name.toLowerCase().replaceAll(" ","")}'>
            ${e.image ? `<img src=${e.image} width="50rem"/>` : e.name}
          </button>
      `}
    )
    document.querySelectorAll('.theme-button').forEach(
      (e, i) => {
        e.addEventListener(
          'click', () => {
            Theme.setCurrentTheme(Theme.instances[i].colors.name)
            Theme.instances[i].changeTheme()
          }
        )
      }
    )
    } catch(e){ //this is for client editor
    }
    
  }

  /** Updates the lodalStorage json with the Themes.loadedThemes current state */
  static updateJSON(){
    window.localStorage.setItem("themes",JSON.stringify(this.loadedThemes))
  }

  /**
   * Sets the currentTheme value in the memory and json based on the index at Theme.instances
   * @param {String} name
   */
  static setCurrentTheme(name){
    this.loadedThemes.currentTheme=name
    document.querySelector("#name").value=name
    Theme.buildList()
  }

  /**Save changes and rebuild json and theme list*/
  static saveChanges(){
    Theme.updateJSON() 
    Theme.buildList()
  }
}

// Default themes
Theme.defaultState()
Theme.load()
Theme.buildList()

// Color dialog elements
const colorDialog = document.querySelector('#color-dialog')
const colorDialogForm = document.querySelector('#color-dialog form')
const inputs = document.querySelectorAll('#color-dialog input')
const modalButtons = document.querySelectorAll('#color-dialog button')

// Color dialog functions

/** Changes current custom theme colors into the Dialog form input values */
const dialogChangeColor = () => {
  const customColor = customTheme.colors
  for (const x of inputs) {
    customColor[x.id] = x.value
  }
  customColor["name"]="custom"
  customTheme.changeTheme()
}

// color dialog form submit
colorDialogForm.addEventListener('submit', () => {
  dialogChangeColor()
  let dialogColors=structuredClone(customTheme.colors)
  dialogColors["name"]=document.querySelector("#name").value
  Theme.save(dialogColors) 
  Theme.buildList()
  colorDialog.close()
})

// close button
modalButtons[1].addEventListener('click', e => {
  colorDialog.close()
})

// Adds change trigger on dialog inputs
inputs.forEach(e => e.addEventListener('change', () => dialogChangeColor()))

// customThemeButton behaviour
const customThemeButton = document.querySelector('#theme-custom-button')
customThemeButton.addEventListener('click', () => {
  colorDialog.showModal()
})

// customResetButton behaviour
const customResetButton = document.querySelector('#theme-reset-button')
customResetButton.addEventListener('click', () => {
  let deleteThemes=confirm("Are you sure you wanna delete all your themes???")
  deleteThemes && Theme.reset()
})



