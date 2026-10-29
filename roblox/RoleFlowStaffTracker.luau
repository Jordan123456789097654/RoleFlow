--[[
RoleFlow staff tracker. Put this file in ServerScriptService as a ModuleScript
named "RoleFlowStaffTracker", then require it once from a Script in ServerScriptService:

    require(game:GetService("ServerScriptService").RoleFlowStaffTracker)

Setup:
  1. Enable "Allow HTTP Requests" in Game Settings > Security.
  2. Fill in CONFIG below. The secret is shown once in your RoleFlow staff page.
  3. Keep this module in ServerScriptService. Never put the secret in a LocalScript,
     ReplicatedStorage, or anything a player's client can download.

What it does:
  - Reports staff join, heartbeat, and leave events (only group members are sent).
  - Reports server status every 30 seconds for the Live servers panel.
  - Polls for owner broadcasts every 15 seconds and shows them to every player.
]]

local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")

local CONFIG = {
	BaseUrl = "https://roleflow.site",
	CommunityId = "YOUR_DISCORD_GUILD_ID",
	Secret = "rfs_PASTE_SECRET_HERE",
	RobloxGroupId = 0, -- your Roblox group ID
	HeartbeatSeconds = 60, -- must stay well under RoleFlow's 3-minute timeout
	ServerReportSeconds = 30,
	BroadcastPollSeconds = 15,
	NoticeSeconds = 8,
}

local BASE = CONFIG.BaseUrl .. "/api/guilds/" .. CONFIG.CommunityId
local AUTH = { ["Authorization"] = "Bearer " .. CONFIG.Secret, ["Content-Type"] = "application/json" }
local STARTED_AT = os.time()
local tracked = {} -- [Player] = true while a player has an open shift
local shownBroadcasts = {}

-- Sends a request, retrying once on network or 5xx errors. Never retries 4xx.
local function request(method, path, body)
	for attempt = 1, 2 do
		local ok, res = pcall(HttpService.RequestAsync, HttpService, {
			Url = BASE .. path,
			Method = method,
			Headers = AUTH,
			Body = body,
		})
		if ok and res.Success then
			return true, res
		end
		if ok and res.StatusCode >= 400 and res.StatusCode < 500 then
			warn(("[RoleFlow] %s %s rejected (%d)"):format(method, path, res.StatusCode))
			return false, res
		end
		if attempt == 1 then
			task.wait(2)
		end
	end
	warn(("[RoleFlow] %s %s failed"):format(method, path))
	return false, nil
end

local function isGroupMember(player)
	local ok, rank = pcall(function()
		return player:GetRankInGroup(CONFIG.RobloxGroupId)
	end)
	return ok and rank > 0
end

local function sendEvent(player, eventType)
	request("POST", "/game/event", HttpService:JSONEncode({
		type = eventType,
		robloxUserId = tostring(player.UserId),
		serverJobId = game.JobId,
		placeId = tostring(game.PlaceId),
		shiftType = player:GetAttribute("RoleFlowShiftType") or "STANDARD",
		sentAt = os.time(),
	}))
end

local function averagePingMs()
	local total, count = 0, 0
	for _, player in ipairs(Players:GetPlayers()) do
		local ok, ping = pcall(function()
			return player:GetNetworkPing()
		end)
		if ok then
			total += ping
			count += 1
		end
	end
	if count == 0 then
		return 0
	end
	return math.floor(total / count * 1000)
end

local function reportServer()
	request("POST", "/game/server", HttpService:JSONEncode({
		serverJobId = game.JobId,
		placeId = tostring(game.PlaceId),
		playerCount = #Players:GetPlayers(),
		maxPlayers = Players.MaxPlayers,
		averagePingMs = averagePingMs(),
		startedAt = STARTED_AT,
		sentAt = os.time(),
	}))
end

-- Shows a notice on every player's screen. Plain text only, so message content can't inject rich text.
local function showNotice(message)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(function()
			local playerGui = player:WaitForChild("PlayerGui", 10)
			if not playerGui then
				return
			end
			local gui = Instance.new("ScreenGui")
			gui.Name = "RoleFlowNotice"
			gui.ResetOnSpawn = false
			gui.Parent = playerGui

			local label = Instance.new("TextLabel")
			label.Size = UDim2.new(0.6, 0, 0, 60)
			label.Position = UDim2.new(0.2, 0, 0, 20)
			label.BackgroundColor3 = Color3.fromRGB(20, 20, 28)
			label.BackgroundTransparency = 0.2
			label.TextColor3 = Color3.new(1, 1, 1)
			label.TextScaled = true
			label.Font = Enum.Font.GothamBold
			label.RichText = false
			label.Text = message
			label.Parent = gui

			Debris:AddItem(gui, CONFIG.NoticeSeconds)
		end)
	end
end

local function pollBroadcasts()
	local lastSince = os.time()
	while true do
		task.wait(CONFIG.BroadcastPollSeconds)
		local ok, res = request(
			"GET",
			"/game/broadcasts?serverJobId=" .. HttpService:UrlEncode(game.JobId) .. "&since=" .. lastSince,
			nil
		)
		if ok then
			local data = HttpService:JSONDecode(res.Body)
			for _, b in ipairs(data.broadcasts or {}) do
				if not shownBroadcasts[b.id] then
					shownBroadcasts[b.id] = true
					showNotice(b.message)
					request("POST", "/game/broadcasts/" .. b.id .. "/receipt", HttpService:JSONEncode({
						serverJobId = game.JobId,
					}))
				end
				lastSince = math.max(lastSince, b.createdAtUnix)
			end
		end
	end
end

local function onJoin(player)
	if not isGroupMember(player) then
		return
	end
	tracked[player] = true
	task.spawn(sendEvent, player, "join")
end

local function onLeave(player)
	if tracked[player] then
		tracked[player] = nil
		sendEvent(player, "leave")
	end
end

local Tracker = {}

function Tracker.start()
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onJoin, player)
	end
	Players.PlayerAdded:Connect(onJoin)
	Players.PlayerRemoving:Connect(onLeave)

	task.spawn(function()
		while true do
			task.wait(CONFIG.HeartbeatSeconds)
			for player in pairs(tracked) do
				if player.Parent == Players then
					task.spawn(sendEvent, player, "heartbeat")
				end
			end
		end
	end)

	task.spawn(function()
		reportServer()
		while true do
			task.wait(CONFIG.ServerReportSeconds)
			reportServer()
		end
	end)

	task.spawn(pollBroadcasts)

	-- Best effort: close open shifts when the server shuts down. Crashes are handled by
	-- RoleFlow's heartbeat timeout instead.
	game:BindToClose(function()
		local pending = {}
		for player in pairs(tracked) do
			table.insert(pending, player)
		end
		for _, player in ipairs(pending) do
			sendEvent(player, "leave")
		end
	end)
end

Tracker.start()
return Tracker
