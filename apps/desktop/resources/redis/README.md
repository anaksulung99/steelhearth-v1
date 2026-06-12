# Redis Server Binaries

Place the `redis-server` binary for each platform in the corresponding folder:

```
redis/
  win32/
    redis-server.exe    ← Windows x64
  darwin/
    redis-server        ← macOS (universal or arm64/x64)
  linux/
    redis-server        ← Linux x64 (static binary)
```

## Download Links

### Windows (x64)
Download from: https://github.com/tporadowski/redis/releases
- Get the `.zip` release (e.g. `Redis-7.x.x-Windows-x64.zip`)
- Extract and copy `redis-server.exe` here

### macOS
```bash
brew install redis
# Binary is usually at: /opt/homebrew/bin/redis-server (Apple Silicon)
#                   or: /usr/local/bin/redis-server (Intel)
cp $(which redis-server) apps/desktop/resources/redis/darwin/redis-server
```

### Linux (static binary)
Download from: https://github.com/redis/redis/releases
Build static or use a pre-built static binary.
```bash
# Or build from source with static linking:
make CFLAGS="-static" LDFLAGS="-static -pthread"
cp src/redis-server apps/desktop/resources/redis/linux/redis-server
chmod +x apps/desktop/resources/redis/linux/redis-server
```

## Important Notes
- These binaries are NOT committed to git (see .gitignore)
- You must download them before running `pnpm build:electron`
- Redis runs on port **16379** (to avoid conflicts with the user's own Redis)
- It binds to `127.0.0.1` only (not exposed externally)
- Persistence is disabled (no RDB/AOF files)
