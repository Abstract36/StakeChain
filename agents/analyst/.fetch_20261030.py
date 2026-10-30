import json, urllib.request

URL = "https://stakechain-api.vercel.app/mcp"

body = dict(jsonrpc="2.0", id=1, method="tools/call",
            params=dict(name="list_base_yields",
                        arguments=dict(minTvl=10000000, sortByApy=True)))
req = urllib.request.Request(
    URL,
    data=json.dumps(body).encode(),
    headers={"Content-Type": "application/json",
             "Accept": "application/json, text/event-stream"},
)
with urllib.request.urlopen(req, timeout=60) as r:
    res = json.loads(r.read().decode())

data = json.loads(res["result"]["content"][0]["text"])
print("count:", data["count"])
for p in data["pools"]:
    print("%-14s %-16s apy=%-8s base=%-8s rew=%-8s tvl=%.1fM stable=%s il=%s" % (
        p["project"], p["symbol"], p["apy"], p["apyBase"], p["apyReward"],
        p["tvlUsd"] / 1e6, p["stablecoin"], p["ilRisk"]))
