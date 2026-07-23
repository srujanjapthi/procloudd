local data = redis.call("HMGET", KEYS[1], "delay", "lastRequest", "count")
local now = tonumber(ARGV[1])
local waitTime = tonumber(ARGV[2])
local delayAfter = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local delay = tonumber(data[1]) or 0
local lastRequest = tonumber(data[2]) or (now - waitTime)
local count = tonumber(data[3]) or 0

local elapsed = now - lastRequest
local newDelay = math.max(0, waitTime + delay - elapsed)
local newCount = count + 1

if newCount >= delayAfter then
  redis.call("HMSET", KEYS[1], "delay", newDelay, "lastRequest", now, "count", newCount)
else
  redis.call("HMSET", KEYS[1], "delay", 0, "lastRequest", now - waitTime, "count", newCount)
end
redis.call("EXPIRE", KEYS[1], ttl)

if newCount < delayAfter then
  return 0
else
  return newDelay
end
