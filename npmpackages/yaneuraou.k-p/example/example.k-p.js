#!/usr/bin/env node

const YaneuraOu_K_P = require("@mizarjp/yaneuraou.k-p");

(async () => {
    // engine
    const yaneuraou = await YaneuraOu_K_P();
    // utils
    const wCache = {};
    const rCache = {};
    yaneuraou.addMessageListener((line) => {
        console.log(`< ${line}`);
        Object.keys(rCache)
        .filter((v) => line.startsWith(v))
        .forEach((v) => { rCache[v] = line; })
        Object.keys(wCache)
        .filter((v) => line.startsWith(v))
        .forEach((v) => { rCache[v] = line; wCache[v] = false; });
    });
    const postMessage = (command) => {
        console.log(`> ${command}`);
        yaneuraou.postMessage(command);
    };
    const postMessageWait = (command, waitResp, ...gatherResps) => {
        wCache[waitResp] = true;
        for (const gatherResp of gatherResps) {
            rCache[gatherResp] = "";
        }
        postMessage(command);
        return new Promise((resolve) => {
            const poll = () => {
                if (wCache[waitResp]) {
                    setTimeout(poll, 1);
                } else {
                    delete wCache[waitResp];
                    const res = {};
                    res[waitResp] = rCache[waitResp];
                    for (const gatherResp of gatherResps) {
                        res[gatherResp] = rCache[gatherResp];
                    }
                    resolve(res);
                }
            };
            poll();
        });
    };
    // initialize engine
    await postMessageWait("usi", "usiok");
    postMessage("setoption name USI_Hash value 1024");
    postMessage("setoption name PvInterval value 0");
    postMessage("setoption name Threads value 4");
    await postMessageWait("isready", "readyok");
    // search positions
    const resList = [];
    for (const pos of ["position startpos", "position startpos moves 2g2f 8c8d"]) {
        postMessage(pos);
        const res = await postMessageWait("go movetime 1000", "bestmove", "info");
        res.position = pos;
        resList.push(res);
    }
    // output results
    for (const res of resList) {
        console.log(JSON.stringify(res));
    }
    // terminate engine
    yaneuraou.terminate();
})();