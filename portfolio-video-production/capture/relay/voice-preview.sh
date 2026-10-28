#!/bin/sh
# Builds the Relay voice-chapter preview: recorded audio laid onto the captured frames, at 1920 wide.
# Usage: sh capture/relay/voice-preview.sh [take-dir]
set -e
cd "$(dirname "$0")/../.."
T=${1:-projects/relay/captures/journey/take-01}
FF=node_modules/ffmpeg-static/ffmpeg
node capture/relay/voice-audio.mjs "$T" projects/relay/voice/live-01/session.json projects/relay/voice/maya-q1.wav
mkdir -p ../output/portfolio-videos/previews
"$FF" -y -v error -i "$T/01-voice.mp4" -i "$T/01-voice.audio.wav" -map 0:v -map 1:a -vf scale=1920:-2 \
  -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -shortest \
  ../output/portfolio-videos/previews/relay-voice-preview.mp4
echo ../output/portfolio-videos/previews/relay-voice-preview.mp4
