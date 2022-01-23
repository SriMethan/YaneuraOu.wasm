# `@mizarjp/yaneuraou.k-p`

- [YaneuraOu](https://github.com/yaneurao/YaneuraOu) is the World's Strongest Shogi engine(AI player) , WCSC29 1st winner , educational and [USI](http://shogidokoro.starfree.jp/usi.html) compliant engine.
- Evaluation type: NNUE K-P
- Evaluation file has built in SuishoPetite(2021-11) by [`たややん＠水匠(将棋AI)`](https://twitter.com/tayayan_ts)
- License: GPLv3

## Usage

```typescript
export interface YaneuraOuModule
{
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (command: string) => void;
  terminate: () => void;
}

export function YaneuraOu_K_P(userModule?: any): Promise<YaneuraOuModule>;
```

## Example

```javascript
(async () => {
    // engine
    const yaneuraou = await require('@mizarjp/yaneuraou.k-p')();
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
< id name YaneuraOu NNUE KP256 7.00 32WASM TOURNAMENT
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
< info depth 1 seldepth 1 score cp 88 nodes 259 nps 129500 time 2 pv 2g2f
< info depth 2 seldepth 2 score cp 91 nodes 1402 nps 701000 time 2 pv 2g2f 3c3d
< info depth 3 seldepth 3 score cp 144 nodes 1798 nps 599333 time 3 pv 2g2f 1c1d 2f2e
< info depth 4 seldepth 4 score cp 40 nodes 4192 nps 1048000 time 4 pv 2g2f 3c3d 1g1f 2b3c
< info depth 5 seldepth 5 score cp 37 nodes 5166 nps 1291500 time 4 pv 2g2f 3c3d 3i4h 1c1d 2f2e
< info depth 6 seldepth 6 score cp 24 nodes 7737 nps 1547400 time 5 pv 2g2f 3c3d 2f2e 2b3c 7g7f 8c8d
< info depth 7 seldepth 7 score cp 24 nodes 13848 nps 1978285 time 7 pv 2g2f 3c3d 2f2e 2b3c 7g7f 8c8d 8h3c+ 2a3c
< info depth 8 seldepth 9 score cp 51 nodes 23881 nps 2171000 time 11 pv 2g2f 8c8d 2f2e 8d8e 2e2d 2c2d 2h2d
< info depth 9 seldepth 11 score cp 10 nodes 66264 nps 2366571 time 28 pv 2g2f 3c3d 6i7h 8c8d 7g7f 4a3b 3i4h 8d8e 8h7g 2b7g+ 7h7g
< info depth 10 seldepth 11 score cp 53 nodes 109264 nps 2483272 time 44 pv 2g2f 3c3d 7g7f 4a3b 2f2e 2b3c 3i4h 8c8d 8h3c+ 3b3c
< info depth 11 seldepth 15 score cp 36 nodes 151223 nps 2520383 time 60 pv 2g2f 3c3d 7g7f 4a3b 2f2e 2b3c 8h3c+ 3b3c 4g4f 9c9d 7i8h 8c8d 3i4h 8d8e
< info depth 12 seldepth 16 score cp 61 nodes 204847 nps 2593000 time 79 pv 2g2f 3c3d 7g7f 4c4d 7i7h 7a6b 3i4h 8c8d 4i5h 4a3b 3g3f
< info depth 13 seldepth 20 score cp 47 nodes 333853 nps 2529189 time 132 pv 2g2f 4a3b 7g7f 8c8d 2f2e 8d8e 8h7g 3c3d 7i8h 2b3c 4i5h 1c1d 3i4h 4c4d
< info depth 14 seldepth 16 score cp 32 nodes 395496 nps 2551587 time 155 pv 2g2f 8c8d 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i8h 2b3c 4i5h 6a5b 3i4h 4c4d 3g3f 1c1d 6g6f
< info depth 15 seldepth 18 score cp 43 nodes 542969 nps 2502161 time 217 pv 2g2f 8c8d 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i8h 2b3c 7g3c+ 2a3c 8h7g 3a2b 6i7h 1c1d 2e2d 2c2d
< info depth 16 seldepth 18 score cp 46 nodes 601904 nps 2487206 time 242 pv 2g2f 8c8d 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i8h 2b3c 7g3c+ 3b3c 8h7g 1c1d 3i4h 9c9d 3g3f 4c4d 2i3g
< info depth 17 seldepth 20 score cp 37 nodes 759944 nps 2467350 time 308 pv 2g2f 8c8d 7g7f 8d8e 8h7g 3c3d 7i8h 4c4d 3i4h 7a6b 3g3f 7c7d 5i6h 2b3c 4h3g 8a7c 6h7h
< info depth 18 seldepth 24 score cp 34 nodes 971815 nps 2447896 time 397 pv 2g2f 8c8d 7g7f 4a3b 6i7h 8d8e 8h7g 3c3d 6g6f 4c4d 3i4h 3a4b 2f2e 2b3c 3g3f 7c7d 2i3g 7a6b
< info depth 19 seldepth 25 score cp 40 nodes 1564140 nps 2417527 time 647 pv 2g2f 8c8d 7g7f 8d8e 8h7g 4a3b 3i4h 3c3d 7i7h 7a6b 2f2e 2b3c 3g3f 7c7d 2i3g 8a7c 6g6f 6a5b 4i5h
< info depth 19 seldepth 24 score cp 18 nodes 2409628 nps 2402420 hashfull 12 time 1003 pv 2g2f 8c8d
< bestmove 2g2f ponder 8c8d
> position startpos moves 2g2f 8c8d
> go movetime 1000
< info depth 1 seldepth 1 score cp 28 nodes 191 nps 95500 time 2 pv 7g7f
< info depth 2 seldepth 2 score cp 30 nodes 1001 nps 500500 time 2 pv 7g7f 4a3b
< info depth 3 seldepth 3 score cp 30 nodes 1572 nps 786000 time 2 pv 7g7f 4a3b 2f2e
< info depth 4 seldepth 4 score cp 30 nodes 1988 nps 994000 time 2 pv 7g7f 4a3b 2f2e 8d8e
< info depth 5 seldepth 5 score cp 30 nodes 2426 nps 1213000 time 2 pv 7g7f 4a3b 2f2e 8d8e 8h7g
< info depth 6 seldepth 6 score cp 30 nodes 2872 nps 957333 time 3 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d
< info depth 7 seldepth 7 score cp 30 nodes 7406 nps 1851500 time 4 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h
< info depth 8 seldepth 9 score cp 28 nodes 8522 nps 2130500 time 4 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h
< info depth 9 seldepth 11 score cp 30 nodes 10958 nps 2191600 time 5 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 6g6f 2b3c 3i4h 7a6b 6i7h
< info depth 10 seldepth 11 score cp 28 nodes 14229 nps 2371500 time 6 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 4i5h
< info depth 11 seldepth 14 score cp 26 nodes 18181 nps 2597285 time 7 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 2i3g 4c4d
< info depth 12 seldepth 14 score cp 30 nodes 21489 nps 2686125 time 8 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d
< info depth 13 seldepth 15 score cp 30 nodes 24237 nps 2693000 time 9 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d 2i3g 8a7c
< info depth 14 seldepth 15 score cp 30 nodes 27029 nps 2702900 time 10 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d 2i3g 8a7c
< info depth 15 seldepth 17 score cp 30 nodes 30097 nps 2736090 time 11 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d 2i3g 8a7c 9g9f
< info depth 16 seldepth 18 score cp 26 nodes 47252 nps 2779529 time 17 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3g3f 6a5b 3i4h 7a6b 2i3g 7c7d 4i5h 8a7c 9g9f 4c4d
< info depth 17 seldepth 20 score cp 30 nodes 53826 nps 2832947 time 19 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3g3f 6a5b 3i4h 7a6b 4i5h 7c7d 9g9f 8a7c 2i3g 1c1d 9f9e 4c4d
< info depth 18 seldepth 22 score cp 25 nodes 96784 nps 2688444 time 36 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3g3f 6a5b 3i4h 7a6b 2i3g 7c7d 7g3c+ 3b3c 7h7g 8a7c 3g4e
< info depth 19 seldepth 22 score cp 33 nodes 213036 nps 2536142 time 84 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 2i3g 4c4d 4i5h 1c1d 5i6h 7c7d 4g4f 8a7c 4h4g
< info depth 20 seldepth 23 score cp 35 nodes 318769 nps 2550152 time 125 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d 9g9f 8a7c 4g4f 6c6d 5i6h 1c1d 2i3g
< info depth 21 seldepth 24 score cp 30 nodes 675931 nps 2570079 time 263 pv 7g7f 4a3b 2f2e 8d8e 8h7g 3c3d 7i7h 2b3c 3i4h 7a6b 3g3f 6a5b 4i5h 7c7d 9g9f 1c1d 2i3g 4c4d 5i6h 8a7c 4g4f 3a4b
< info depth 21 seldepth 29 score cp 21 nodes 2403800 nps 2391840 hashfull 20 time 1005 pv 7g7f 4a3b 2f2e 3c3d 6g6f 2b3c 3i4h 7a6b 3g3f 7c7d 7i6h 8d8e 8h7g 1c1d 9g9f 4c4d 6i7h 6c6d 4i5h 6a5b 6h6g 3a4b
< bestmove 7g7f ponder 4a3b
{"bestmove":"bestmove 2g2f ponder 8c8d","info":"info depth 19 seldepth 24 score cp 18 nodes 2409628 nps 2402420 hashfull 12 time 1003 pv 2g2f 8c8d","position":"position startpos"}
{"bestmove":"bestmove 7g7f ponder 4a3b","info":"info depth 21 seldepth 29 score cp 21 nodes 2403800 nps 2391840 hashfull 20 time 1005 pv 7g7f 4a3b 2f2e 3c3d 6g6f 2b3c 3i4h 7a6b 3g3f 7c7d 7i6h 8d8e 8h7g 1c1d 9g9f 4c4d 6i7h 6c6d 4i5h 6a5b 6h6g 3a4b","position":"position startpos moves 2g2f 8c8d"}
```
