#!/usr/bin/env node

/**
 * Copyright (c) 2018-present, Joslyn.
 *
 * thanks for facebook/react-native
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * - list simulator or emulator
 * - launch simulator or emulator
 */
'use strict';
const child_process = require("child_process");
const progrm = require('commander')
const chalk = require('chalk')

const PlatformType = {
    ios: 'ios',
    android: 'android',
}

// ---------- command ----------
progrm
    .version('0.1.0')
    .option('-l --list [ios|android]', 'list iOS simulator or android emulator.')

progrm
    .command('run <name>')
    .description('launch simulator or emulator')
    .action((name, options) => {
        let label = formattedDeviceName(name, true)
        let matchEmu = findMatchingSimulator(label) // iOS approximate
        if (matchEmu && matchEmu.name === label) { // iOS
            launchSimulator(name)
        } else {
            launchEmulator(name)
        }
    })
    .on('--help', () => {
        console.log('')
        console.log('Example:')
        console.log('   desc: run on iOS simulator')
        console.log('   cmd: emu run iPhone_XS_Max')
        console.log('')
        console.log('   desc: run on android emulator')
        console.log('   cmd: emu run Nexus_6P_API_28')
    })

progrm.parse(process.argv)

// ---------- command execu ----------
if (progrm.list) {
    const lArg = progrm.list
    if (typeof lArg === 'boolean') {
        listIosDevice()
        listAndroidDevice()
    }
    if (typeof lArg === 'string') {
        if (lArg === PlatformType.ios) {
            listIosDevice()
        }
        if (lArg === PlatformType.android) {
            listAndroidDevice()
        }
    }
}


if (process.argv.length <= 2) progrm.help()



// ---------- list devices ----------
function listIosDevice() {
    console.log(chalk.bold.cyan('iOS: '))
    let sims = listAvailableSimulator()
    for (let i in sims) {
        let simInfo = formattedListDevice(sims[i])
        console.log('    ' + simInfo)
    }

    // console.log('--Physical Devices: ')
    // let physicals = listPhysicalDevice()
    // for (let i in physicals) {
    //     let phyInfo = formattedListDevice(physicals[i])
    //     console.log(phyInfo)
    // }
}

function listAndroidDevice() {
    console.log(chalk.bold.cyan('Android: '))
    let emus = child_process.execFileSync(emulatorLink(), ['-list-avds'], { encoding: 'utf8' })
    emus = emus.split('\n').filter((item) => { return item.length > 0 })
    for (let i in emus) {
        let info = chalk.green(emus[i])
        console.log('    ' + info)
    }
}


function listPhysicalDevice() {
    let devicesList = child_process.execFileSync('xcrun', ['instruments', '-s'], { encoding: 'utf8' })
    var devices = [];
    devicesList.split('\n').forEach(function(line) {
        let device = line.match(/(.*?) \((.*?)\) \[(.*?)\]/);
        let noSimulator = line.match(/(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/);
        if (device != null && noSimulator == null) {
            let name = device[1];
            let version = device[2];
            let udid = device[3];
            devices.push({ udid: udid, name: name, version: version });
        }
    })
    return devices
}

function listAvailableSimulator() {
    var availableSimulators = []
    try {
        var simulators = JSON.parse(
            child_process.execFileSync('xcrun', ['simctl', 'list', '--json', 'devices'], { encoding: 'utf8' })
        );
    } catch (e) {
        throw new Error('Could not parse the simulator list output');
    }
    if (!simulators.devices) {
        return availableSimulators;
    }
    const devices = simulators.devices;
    for (let version in devices) {
        // Making sure the version of the simulator is an iOS or tvOS (Removes Apple Watch, etc)
        if (!version.startsWith('iOS') && !version.startsWith('tvOS')) {
            continue;
        }
        for (let i in devices[version]) {
            let simulator = devices[version][i];
            // Skipping non-available simulator
            if (simulator.availability !== '(available)') {
                continue;
            }
            simulator.version = version
            simulator.booted = simulator.state === 'Booted' // launched
            availableSimulators.push(simulator)
        }
    }
    return availableSimulators
}

// ---------- launch simulator ----------
function launchSimulator(name) {
    let label = formattedDeviceName(name, true)
    const selectedSimulator = findMatchingSimulator(label);
    if (!selectedSimulator) {
        throw new Error(`Could not find ${simulatorLabel} simulator`);
    }
    if (!selectedSimulator.booted) {
        console.log(`Launching${selectedSimulator.name} (${selectedSimulator.version}) ...`);
        try {
            child_process.spawnSync('xcrun', ['instruments', '-w', selectedSimulator.udid]);
        } catch (e) {
            console.log(e)
            // instruments always fail with 255 because it expects more arguments,
            // but we want it to only launch the simulator
        }
    }
}

function launchEmulator(name) {
    try {
        child_process.execFileSync(emulatorLink(), ['-netdelay', 'none', '-netspeed', 'full', '-avd', name], { encoding: 'utf8' })
    } catch (e) {
        console.log(e)
    }
}

function findMatchingSimulator(simulatorLabel) {
    let simList = listAvailableSimulator()
    if (simList.length <= 0) {
        return null
    }
    let match
    for (let i in simList) {
        let simulator = simList[i]
        let booted = simulator.booted
        let version = simulator.version
        if (booted && simulatorLabel === null) {
            return {
                udid: simulator.udid,
                name: simulator.name,
                booted,
                version
            };
        }
        let matchValue = simulator.name
        if (matchValue === simulatorLabel && !match) {
            match = {
                udid: simulator.udid,
                name: simulator.name,
                booted,
                version
            };
        }
        // Keeps track of the first available simulator for use if we can't find one above.
        if (simulatorLabel === null && !match) {
            match = {
                udid: simulator.udid,
                name: simulator.name,
                booted,
                version
            };
        }
    }

    if (match) {
        return match;
    }
    return null;
}


// ---------- tool ----------
function formattedListDevice(device) {
    let launched = device.booted ? '*' : ''
    let name = formattedDeviceName(device.name)
    return `${chalk.green(name)} (${chalk.italic(device.version)}) ${chalk.blue(launched)}`;
}

function formattedDeviceName(name, reverse = false) {
    if (reverse) { return name.replace(/_/g, ' ') }
    return name.replace(/ /g, '_')
}

function emulatorLink() {
    return process.env.ANDROID_HOME + '/tools/emulator'
}