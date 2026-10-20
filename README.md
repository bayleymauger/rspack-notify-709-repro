# rspack native watcher: "Invalid argument (os error 22)" on Linux

Minimal reproduction of [notify-rs/notify#709](https://github.com/notify-rs/notify/issues/709) in rspack's native watcher (`experiments.nativeWatcher: true`). Linux (inotify) only.

## Run

```sh
npm install
npm run repro
```

`repro.mjs` runs `rspack build --watch` and makes these changes:

1. `src/index.js` imports `./dir/missing/a.js`. `src/dir` exists, but `src/dir/missing` does not, so rspack watches `src/dir` recursively.
2. It creates `src/dir/sub` and then deletes it.
3. It removes the import, so rspack stops watching `src/dir`.

## Result

```
>>> remove the missing import from src/index.js
Rspack compiled successfully in 4 ms
[rspack-cli] [Error: Watcher error: Invalid argument (os error 22) about ["/home/coder/rspack-notify-709-repro/src/dir/sub"]] {
  code: 'GenericFailure'
}
```

After this error the watcher stops working. Later file changes don't trigger a rebuild, and the process has to be restarted. With `nativeWatcher: false`, the same steps don't fail.
