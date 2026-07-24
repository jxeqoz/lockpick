local activePromise = nil
local activeToken = nil
local startedAt = 0

local function finishGame(success)
    SetNuiFocus(false, false)
    activeToken = nil
    if activePromise then
        local p = activePromise
        activePromise = nil
        p:resolve(success)
    end
end

RegisterNUICallback('close', function(_, cb)
    finishGame(false)
    cb('ok')
end)

RegisterNUICallback('succeed', function(data, cb)
    cb('ok')
    if not activePromise then return end
    if not data or data.token ~= activeToken then return end
    if GetGameTimer() - startedAt < 500 then return end
    finishGame(true)
end)

RegisterNUICallback('failed', function(_, cb)
    finishGame(false)
    cb('ok')
end)

RegisterCommand('lockpicktry', function()
    print(exports['lockpick']:startLockpick(), 'lockpicking result')
end)

exports('startLockpick', function()
    if activePromise then return false end

    activeToken = ('%x%x'):format(math.random(0, 0xFFFFFFF), GetGameTimer())
    startedAt = GetGameTimer()
    activePromise = promise.new()
    SendNUIMessage({ start = true, token = activeToken })
    SetNuiFocus(true, true)

    return Citizen.Await(activePromise)
end)
