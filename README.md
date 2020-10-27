# Minecraft Server Events
A simple Node event emitter I made because one didn't exist yet.

## Emission Types
- all
- connected
- disconnected
- time (time set changes)
- died
- mode (game mode changes)
- chat

## How it works
 1. Uses Chokidar to listen for change events on the server log file.
 2. When a change is detected, it finds out how many new lines have been added and processes each line individually using `tail` to get only the relevant lines.
 3. Parses the message and emits a Node event if a relevant message is found.

## Example Usage
	const McServerEvents = require('mc-server-events');
	const events = new McServerEvents('../minecraft-server/logs/latest.log');

	events.on('all', data  => {
		console.log(data.status, data);
	});

## Example Output
	connected {
	  user: 'kyjus25',
	  id: 248,
	  coordinates: { x: 224.5, y: 66, z: 110.5 },
	  status: 'connected',
	  context: 'kyjus25[/127.0.0.1:61599] logged in with entity id 248 at (224.5, 66.0, 110.5)',
	  timestamp: '11:53:50'
	}
	disconnected {
	  user: 'kyjus25',
	  status: 'disconnected',
	  context: 'kyjus25 left the game',
	  timestamp: '11:54:07'
	}
	time {
	  time: 13000,
	  status: 'time',
	  context: 'Set the time to 13000',
	  timestamp: '11:54:17'
	}
	died {
	  user: 'kyjus25',
	  reason: 'drowned',
	  status: 'died',
	  context: 'kyjus25 drowned',
	  timestamp: '11:54:57'
	}
	mode {
	  user: 'kyjus25',
	  mode: 'Creative',
	  status: 'mode',
	  context: "Set kyjus25's game mode to Creative Mode",
	  timestamp: '12:16:22'
	}
	chat {
	  user: 'kyjus25',
	  message: 'Hello world!',
	  status: 'chat',
	  context: '<kyjus25> Hello world!',
	  timestamp: '12:16:44'
	}

## Requirements
- Created using the latest Minecraft (1.16.3), no support prior to this release.
- Needs the `tail` command, so you probably need Linux or OSX
- Needs access to the Minecraft server log file, so it needs to be running on the same machine as the one running the Minecraft server.

## Need an event added?
Create an issue ticket on this repo, or feel free to add it yourself and send me a PR
