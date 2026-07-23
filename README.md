# smart-cpmpr README

![smart-logo](images/logo_smart.png)

This extension adds syntax highlighting for SmartyKit Smart programming.


## Features

Add a coloration for comment, char, str, function (void), label, and variable.

Also provides 2 commands to work with Smart-SmartyKit:

- Run the current `.sma` file with `smart_emulator` (Linux: `/usr/bin/smart_emulator`, Windows: `smart_emulator.exe`)
- Build (compile) the current `.sma` file with `smart_build` (Linux: `/usr/bin/smart_build`, Windows: `smart_build.exe`)

![feature-colors](images/feature-colors.png)


## Requirements

To run/build Smart programs, install Smart-SmartyKit from:

- https://github.com/smartin187/smartykit_compiler

By default, the extension looks for executables in:

**Linux:**
- `/usr/bin/smart_emulator`
- `/usr/bin/smart_build`

**Windows:**
- `%LOCALAPPDATA%\Smart-SmartyKit\smart_emulator.exe`
- `%LOCALAPPDATA%\Smart-SmartyKit\smart_build.exe`

You can override paths using the settings below.

## Configuration

- `smart.emulatorPath`: full path to `smart_emulator` (Linux: `/usr/bin/smart_emulator`, Windows: `smart_emulator.exe`) (optional)
- `smart.compilerPath`: full path to `smart_build` (Linux: `/usr/bin/smart_build`, Windows: `smart_build.exe`) (optional)
- `smart.toolchainPath`: folder containing `smart_emulator` and/or `smart_build` (Linux) or `smart_emulator.exe` and/or `smart_build.exe` (Windows) (optional)



## Release Notes

### 1.0.0

Initial release of Smart SmartyKit coloration.

---

**Enjoy!**
