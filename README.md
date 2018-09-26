# [emu](https://github.com/JoslynWu/emu) &middot; [![npm version](https://badge.fury.io/js/run-emu.svg)](https://badge.fury.io/js/run-emu)

Launch iOS simulator or android emulator.

### Feature

- Lis simulator or emulator
- launch simulator or emulator

## Install

```
npm i run-emu -g
```

## Usage

- List iOS simulator and android emulator.

```
run-emu -l
```

- Launch simulator or emulator

```
run-emu run <name>

e.g.
run-emu run iPhone_XS_Max
```

- Help

```
run-emu -h
```

```
sage: run-emu [options] [command]

Options:

  -V, --version            output the version number
  -l --list [ios|android]  list iOS simulator or android emulator.
  -h, --help               output usage information

Commands:

  run <name>               launch simulator or emulator
```

## Thanks

Thanks for [facebook/react-native](https://github.com/facebook/react-native)

### License

[MIT licensed](./LICENSE)