#!/usr/bin/env bash
# Sounds are converted from the normal Pesterchum client.
ffmpeg -y -i src/alarm2.wav -c:a aac -b:a 50k aac.m4a/alarm_memo.m4a
ffmpeg -y -i src/alarm.wav -c:a aac -b:a 50k aac.m4a/alarm_direct_message.m4a
ffmpeg -y -i src/namealarm.wav -c:a aac -b:a 50k aac.m4a/alarm_mention.m4a
ffmpeg -y -i src/cease.wav -c:a aac -b:a 50k aac.m4a/cease_direct_message.m4a
ffmpeg -y -i src/honk.wav -c:a aac -b:a 50k aac.m4a/evil.m4a
