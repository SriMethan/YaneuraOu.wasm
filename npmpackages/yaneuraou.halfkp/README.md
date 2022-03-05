# `@mizarjp/yaneuraou.halfkp`

- [YaneuraOu](https://github.com/yaneurao/YaneuraOu) is the World's Strongest Shogi engine(AI player) , WCSC29 1st winner , educational and [USI](http://shogidokoro.starfree.jp/usi.html) compliant engine.
- Evaluation type: NNUE HalfKP
- Evaluation file has built in Suisho5(水匠5, 2021-11) by [`たややん＠水匠(将棋AI)`](https://twitter.com/tayayan_ts)
- License: GPLv3

## Usage

```typescript
/// <reference types="emscripten" />

export interface YaneuraOuModule extends EmscriptenModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
}

export const YaneuraOu_HalfKP: EmscriptenModuleFactory<YaneuraOuModule>;
```

## Example

```javascript
(async () => {
    // engine
    const yaneuraou = await require('@mizarjp/yaneuraou.halfkp')();
    // utils
    const wCache = {};
    const rCache = {};
    yaneuraou.addMessageListener((line) => {
        console.log(`< ${line}`);
        Object.keys(rCache)
        .filter((v) => `${line}`.startsWith(v))
        .forEach((v) => { rCache[v] = line; })
        Object.keys(wCache)
        .filter((v) => `${line}`.startsWith(v))
        .forEach((v) => { rCache[v] = line; wCache[v] = false; });
    });
    const postMessage = (command) => {
        console.log(`> ${command}`);
        yaneuraou.postMessage(command);
    };
    const postMessageWait = (command, waitResp, ...gatherResps) => {
        wCache[waitResp] = true;
        for (const gatherResp of gatherResps) {
            rCache[gatherResp] = null;
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
```

Output Example:

```
> usi
< id name Suisho5+YaneuraOu NNUE 7.00 32WASM TOURNAMENT
< id author by yaneurao
< option name Threads type spin default 1 min 1 max 32
< option name USI_Hash type spin default 16 min 1 max 1024
< option name USI_Ponder type check default false
< option name Stochastic_Ponder type check default false
< option name MultiPV type spin default 1 min 1 max 800
< option name NetworkDelay type spin default 120 min 0 max 10000
< option name NetworkDelay2 type spin default 1120 min 0 max 10000
< option name MinimumThinkingTime type spin default 2000 min 1000 max 100000
< option name SlowMover type spin default 100 min 1 max 1000
< option name MaxMovesToDraw type spin default 0 min 0 max 100000
< option name DepthLimit type spin default 0 min 0 max 2147483647
< option name NodesLimit type spin default 0 min 0 max 9223372036854775807
< option name EvalDir type string default <internal>
< option name WriteDebugLog type string default 
< option name GenerateAllLegalMoves type check default false
< option name EnteringKingRule type combo default CSARule27 var NoEnteringKing var CSARule24 var CSARule24H var CSARule27 var CSARule27H var TryRule
< option name USI_OwnBook type check default true
< option name NarrowBook type check default false
< option name BookMoves type spin default 16 min 0 max 10000
< option name BookIgnoreRate type spin default 0 min 0 max 100
< option name BookFile type combo default no_book var no_book var standard_book.db var yaneura_book1.db var yaneura_book2.db var yaneura_book3.db var yaneura_book4.db var user_book1.db var user_book2.db var user_book3.db var book.bin
< option name BookDir type string default .
< option name BookEvalDiff type spin default 30 min 0 max 99999
< option name BookEvalBlackLimit type spin default 0 min -99999 max 99999
< option name BookEvalWhiteLimit type spin default -140 min -99999 max 99999
< option name BookDepthLimit type spin default 16 min 0 max 99999
< option name BookOnTheFly type check default false
< option name ConsiderBookMoveCount type check default false
< option name BookPvMoves type spin default 8 min 1 max 246
< option name IgnoreBookPly type check default false
< option name SkillLevel type spin default 20 min 0 max 20
< option name DrawValueBlack type spin default -2 min -30000 max 30000
< option name DrawValueWhite type spin default -2 min -30000 max 30000
< option name PvInterval type spin default 300 min 0 max 100000
< option name ResignValue type spin default 99999 min 0 max 99999
< option name ConsiderationMode type check default false
< option name OutputFailLHPV type check default true
< option name FV_SCALE type spin default 24 min 1 max 128
< usiok
> setoption name USI_Hash value 1024
> setoption name PvInterval value 0
> setoption name Threads value 4
> isready
< info string loading eval file : <internal>
< readyok
> position startpos
> go movetime 1000
< info depth 1 seldepth 1 score cp 144 nodes 310 nps 310000 time 1 pv 2g2f
< info depth 2 seldepth 2 score cp 98 nodes 1478 nps 739000 time 2 pv 2g2f 8c8d 2f2e
< info depth 3 seldepth 3 score cp 101 nodes 1942 nps 971000 time 2 pv 2g2f 8c8d 2f2e
< info depth 4 seldepth 4 score cp 116 nodes 2732 nps 910666 time 3 pv 7g7f 3c3d 2g2f 8c8d 2f2e
< info depth 5 seldepth 5 score cp 88 nodes 5602 nps 1400500 time 4 pv 7g7f 8c8d 2g2f 3c3d 2f2e
< info depth 6 seldepth 6 score cp 70 nodes 9189 nps 1837800 time 5 pv 7g7f 8c8d 2g2f 3c3d 2f2e 8d8e
< info depth 7 seldepth 7 score cp 83 nodes 14720 nps 2102857 time 7 pv 2g2f 8c8d 2f2e 8d8e 6i7h 1c1d 2e2d
< info depth 8 seldepth 9 score cp 92 nodes 24530 nps 2230000 time 11 pv 2g2f 4a3b 2f2e 8c8d 7g7f 8d8e 8h7g 3c3d
< info depth 9 seldepth 9 score cp 111 nodes 35637 nps 2375800 time 15 pv 2g2f 8c8d 7g7f 3c3d 2f2e 8d8e 2e2d 2c2d 2h2d
< info depth 10 seldepth 10 score cp 111 nodes 64104 nps 2465538 time 26 pv 2g2f 8c8d 7g7f 3c3d 2f2e 4a3b 2e2d 2c2d 2h2d 8d8e
< info depth 11 seldepth 12 score cp 123 nodes 89362 nps 2628294 time 34 pv 2g2f 8c8d 7g7f 3c3d 2f2e 4a3b 2e2d 2c2d 2h2d 8d8e 6i7h 8e8f
< info depth 12 seldepth 14 score cp 91 nodes 284449 nps 2633787 time 108 pv 7g7f 8c8d 8h7g 3c3d 7i8h 4a3b 3g3f 7c7d 3i3h 5a4a 2g2f 2b7g+ 8h7g
< info depth 13 seldepth 24 score cp 97 nodes 384050 nps 2577516 time 149 pv 7g7f 4a3b 2g2f 3c3d 2f2e 8c8d 6i7h 8d8e 2e2d 2c2d 2h2d 8e8f 8g8f 8b8f
< info depth 14 seldepth 20 score cp 58 nodes 741180 nps 2564636 time 289 pv 7g7f 3c3d 2g2f 4a3b 6i7h 8c8d 2f2e 8d8e 2e2d 2c2d 2h2d 8e8f 8g8f 8b8f 5i5h 2b8h+ 7i8h B*3c
< info depth 15 seldepth 16 score cp 88 nodes 787932 nps 2566553 time 307 pv 7g7f 8c8d 2g2f 3c3d 2f2e 8d8e 5i5h 8e8f 8g8f 8b8f 8h2b+ 3a2b B*7g 8f8b
< info depth 16 seldepth 23 score cp 68 nodes 915235 nps 2563683 time 357 pv 7g7f 8c8d 2g2f 3c3d 2f2e 8d8e 5i5h 5a5b 6i7h 8e8f 8g8f 8b8f 2e2d 2c2d 2h2d 4a3b 8h2b+
< info depth 17 seldepth 24 score cp 106 nodes 1116850 nps 2544077 time 439 pv 7g7f 8c8d 2g2f 8d8e 2f2e 3c3d 6i7h 8e8f 8g8f 8b8f 2e2d 2c2d 2h2d 4a3b 8h2b+ 3a2b B*7g 8f8i+
< info depth 18 seldepth 23 score cp 61 nodes 1979745 nps 2493381 time 794 pv 7g7f 8c8d 2g2f 4a3b 2f2e 8d8e 8h7g 3c3d 7i6h 2b7g+ 6h7g 3a2b 5i6h 2b3c 6i7h 7a6b 3i4h 9c9d 3g3f 7c7d 4h3g 6b7c 3g4f
< info depth 19 seldepth 25 score cp 63 nodes 2475537 nps 2470595 hashfull 15 time 1002 pv 7g7f 8c8d 2g2f 4a3b 2f2e 8d8e 8h7g 3c3d 7i6h 2b7g+ 6h7g 3a2b 5i6h 2b3c 6i7h 7a6b 3i4h 7c7d 4g4f 9c9d 1g1f 1c1d
< bestmove 7g7f ponder 8c8d
> position startpos moves 2g2f 8c8d
> go movetime 1000
< info depth 1 seldepth 1 score cp 57 nodes 235 nps 235000 time 1 pv 2f2e
< info depth 2 seldepth 2 score cp 57 nodes 944 nps 944000 time 1 pv 2f2e 8d8e
< info depth 3 seldepth 3 score cp 55 nodes 1738 nps 1738000 time 1 pv 2f2e 4a3b 2e2d
< info depth 4 seldepth 4 score cp 57 nodes 2461 nps 2461000 time 1 pv 2f2e 4a3b 7g7f 8d8e 8h7g
< info depth 5 seldepth 5 score cp 57 nodes 3622 nps 1811000 time 2 pv 7g7f 4a3b 2f2e 8d8e 8h7g
< info depth 6 seldepth 6 score cp 57 nodes 7789 nps 2596333 time 3 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d
< info depth 7 seldepth 7 score cp 56 nodes 10258 nps 3419333 time 3 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i6h
< info depth 8 seldepth 8 score cp 56 nodes 12428 nps 3107000 time 4 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i6h 3a4b
< info depth 9 seldepth 10 score cp 70 nodes 14894 nps 2978800 time 5 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i6h 3a4b 7g2b+ 3b2b    
< info depth 10 seldepth 11 score cp 70 nodes 18582 nps 3097000 time 6 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i8h 3a4b 7g2b+ 3b2b 8h7g
< info depth 11 seldepth 11 score cp 54 nodes 21712 nps 3101714 time 7 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i8h 3a4b 7g2b+ 3b2b 8h7g
< info depth 12 seldepth 15 score cp 54 nodes 28094 nps 3511750 time 8 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i6h 3a4b 7g2b+ 3b2b 6h7g 7a6b 3i4h 4b3c
< info depth 13 seldepth 21 score cp 53 nodes 56383 nps 3132388 time 18 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i6h 3a4b 7g2b+ 3b2b 6h7g 7a6b 3i4h 4b3c 5i6h 7c7d 3g3f 6b7c 4h3g 7c6d
< info depth 14 seldepth 23 score cp 42 nodes 149629 nps 3053653 time 49 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i8h 3a4b 7g2b+ 3b2b 8h7g 7a6b 3i3h 4b3c 1g1f 7c7d 1f1e 6b7c 4g4f 5a4b 5i6h
< info depth 15 seldepth 20 score cp 36 nodes 230590 nps 2956282 time 78 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i8h 3a4b 7g2b+ 3b2b 8h7g 4b3c 3i4h 7a6b 3g3f 7c7d 4h3g 2b3b 5i6h 6b7c
< info depth 16 seldepth 21 score cp 36 nodes 236073 nps 2950912 time 80 pv 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 7i8h 3a4b 7g2b+ 3b2b 8h7g 4b3c 3i4h 7a6b 3g3f 7c7d 4h3g 2b3b 5i6h 6b7c 3g4f
< info depth 17 seldepth 24 score cp 70 nodes 351882 nps 2770724 time 127 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i8h 2b7g+ 8h7g 3a2b 3i3h 2b3c 3g3f 7a6b 3h3g 7c7d 3g4f 6b7c 6i7h 7c6d
< info depth 18 seldepth 23 score cp 53 nodes 766009 nps 2614365 time 293 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 3i3h 2b3c 6i7h 7c7d 3g3f 7a6b 3h3g 6b7c 3g4f 7c6d 3f3e 3d3e 4f3e
< info depth 19 seldepth 27 score cp 38 nodes 1026266 nps 2559266 time 401 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 3i3h 2b3c 3g3f 7c7d 3h3g 7a6b 6i7h 6b7c 3g4f 7c6d 5i5h 7d7e 7f7e
< info depth 20 seldepth 25 score cp 36 nodes 1982842 nps 2426979 time 817 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 3i4h 2b3c 3g3f 7c7d 4h3g 7a6b 6i7h 6b7c 3g4f 7c6d 3f3e 3d3e
< info depth 21 seldepth 26 score cp 32 nodes 2332314 nps 2424442 time 962 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 5i6h 2b3c 3i4h 7c7d 6i7h 7a6b 4g4f 5a4b 6g6f 1c1d 1g1f 6b7c 9g9f 7c6d 4h4g 7d7e
< info depth 21 seldepth 26 score cp 32 nodes 2419045 nps 2416628 hashfull 17 time 1001 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 5i6h 2b3c 3i4h 7c7d 6i7h 7a6b 4g4f 5a4b 6g6f 1c1d 1g1f 6b7c 9g9f 7c6d 4h4g 7d7e
< bestmove 7g7f ponder 8d8e
{"bestmove":"bestmove 7g7f ponder 8c8d","info":"info depth 19 seldepth 25 score cp 63 nodes 2475537 nps 2470595 hashfull 15 time 1002 pv 7g7f 8c8d 2g2f 4a3b 2f2e 8d8e 8h7g 3c3d 7i6h 2b7g+ 6h7g 3a2b 5i6h 2b3c 6i7h 7a6b 3i4h 7c7d 4g4f 9c9d 1g1f 1c1d","position":"position startpos"}
{"bestmove":"bestmove 7g7f ponder 8d8e","info":"info depth 21 seldepth 26 score cp 32 nodes 2419045 nps 2416628 hashfull 17 time 1001 pv 7g7f 8d8e 8h7g 4a3b 7i8h 3c3d 2f2e 2b7g+ 8h7g 3a2b 5i6h 2b3c 3i4h 7c7d 6i7h 7a6b 4g4f 5a4b 6g6f 1c1d 1g1f 6b7c 9g9f 7c6d 4h4g 7d7e","position":"position startpos moves 2g2f 8c8d"}
```
