const { exec } = require("child_process");
const chokidar = require('chokidar');
const {EventEmitter} = require("events");
var events = require('events');
const {resolve} = require('path');

const deathStrings = ['was shot by', 'was pricked to death', 'walked into a cactus whilst trying to escape', 'was roasted in dragon breath', 'drowned', 'suffocated in a wall', 'was squished too much', 'experienced kinetic energy', 'removed an elytra while flying', 'blew up', 'was blown up by', 'was killed by', 'hit the ground too hard', 'fell from a high place', 'fell off to death', 'fell off a ladder', 'fell off some vines', 'fell out of the water', 'fell into a patch', 'fell into a patch', 'was doomed to fall', 'fell too far and was finished by', 'was shot off some vines by', 'was shot off a ladder by', 'was blown from a high place by', 'was squished by a falling anvil', 'was squashed by a falling anvil', 'webt up in flames', 'burned to death', 'was burnt to a crisp', 'walked into fire whilst fighting', 'went off with a bang', 'tried to swim in lava', 'was struck by lightning', 'discovered the floor was lava', 'walked into danger zone due to', 'was slain by', 'got finished off by', 'was fireballed by', 'was killed by', 'starved to death', 'was killed trying to hurt', 'was impaled by', 'fell out of the world', 'want to live in the same world as', 'withered away', 'was pummeled by'];

class MinecraftServerEvents extends EventEmitter {
  constructor(path) {
    super();
    const filePath = resolve(path);
    let processedLines = 0;
    chokidar.watch(filePath, {usePolling: true, atomic: true}).on('change', (event, path) => {
      exec("wc -l " + filePath, (error, lines, stderr) => {
        if (error) { console.log(`error: ${error.message}`); return; }
        if (stderr) { console.log(`stderr: ${stderr}`); return; }
        let strippedLines = lines.replace(' ', '');
        strippedLines = strippedLines.replace(filePath, '');
        strippedLines = strippedLines.trim();
        strippedLines = parseInt(strippedLines);
        const unprocessed = strippedLines - processedLines;
        if (unprocessed > 0) {
          exec("tail -" + unprocessed + " " + filePath, (error, stdout, stderr) => {
            if (error) { console.log(`error: ${error.message}`); return; }
            if (stderr) { console.log(`stderr: ${stderr}`); return; }
            stdout.split('\n').forEach(i => { process(i, this) });
            processedLines = strippedLines;
          });
        } else {
          processedLines = 0;
        }
      });
    });
  }
}

function process(stdout, emitter) {
  if (getMessage(stdout).includes('logged in with entity id')) {
    const coords = getMessage(stdout).split('at ')[1].replace('(', '').replace(')', '').split(',');
    const payload = {
      user: getMessage(stdout).split('[')[0],
      id: parseInt(getMessage(stdout).split('logged in with entity id ')[1].split(' at')[0]),
      coordinates: {x: parseFloat(coords[0]), y: parseFloat(coords[1]), z: parseFloat(coords[2])},
      status: 'connected',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('connected', payload);
    emitter.emit('all', payload);
  }
  if (getMessage(stdout).includes('left the game')) {
    const payload = {
      user: getMessage(stdout).split(' left the game')[0],
      status: 'disconnected',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('disconnected', payload);
    emitter.emit('all', payload);
  }
  if (getMessage(stdout).includes('Set the time to')) {
    const payload = {
      time: parseInt(getMessage(stdout).split('Set the time to ')[1]),
      status: 'time',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('time', payload);
    emitter.emit('all', payload);
  }
  if (hasDeathString(stdout)) {
    const foundDeathString = deathStrings.find(i => getMessage(stdout).indexOf(i) !== -1);
    const payload = {
      user: getMessage(stdout).split(' ' + foundDeathString)[0],
      reason: foundDeathString,
      status: 'died',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('died', payload);
    emitter.emit('all', payload);
  }
  if (getMessage(stdout).includes('Set') && getMessage(stdout).includes('\'s game mode to') && getMessage(stdout).includes('Mode')) {
    const payload = {
      user: getMessage(stdout).split('Set ')[1].split('\'s')[0],
      mode: getMessage(stdout).split('game mode to ')[1].split(' Mode')[0],
      status: 'mode',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('mode', payload);
    emitter.emit('all', payload);
  }
  if (getMessage(stdout).includes('<') && getMessage(stdout).includes('>')) {
    const payload = {
      user: getChatUser(stdout),
      message: getChatMessage(stdout),
      status: 'chat',
      context: getMessage(stdout),
      timestamp: getTimestamp(stdout)
    }
    emitter.emit('chat', payload);
    emitter.emit('all', payload);
  }
}

function hasDeathString(stdout) {
  if (new RegExp(deathStrings.join("|")).test(getMessage(stdout))) {
    return true;
  } else {
    return false;
  }
}

function getChatMessage(stdout) {
  let payload = getMessage(stdout);
  payload = payload.replace('<' + getChatUser(stdout) + '> ', '');
  return payload;
}

function getChatUser(stdout) {
  const pattern = /\<.*?\>/;
  let name = getMessage(stdout).match(pattern)[0];
  name = name.replace('<', '');
  name = name.replace('>', '');
  return name;
} 

function getTimestamp(stdout) {
  let payload = stdout.substring(0, 10);
  payload = payload.replace('[', '');
  payload = payload.replace(']', '');
  return payload;
}

function getMessage(stdout) {
  let info = stdout.split('[Server thread/INFO]:')[1];
  if (info) {
    info = info.trim();
    return info;
  } else {
    return stdout;
  }
}

module.exports = MinecraftServerEvents;