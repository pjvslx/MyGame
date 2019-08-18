// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

//@ 0:startIndex 1:endIndex 2:dir 3: 1:凹 2:凸
//⬆     1,
//⬇     2,
//⬅    3,
//➡    4,
// let lockInfo = [
//     [0,1,4,1]
// ];

@ccclass
class PuzzleMissionConfig extends cc.Component {
    static data = [
        {
            cellInfo:[
                [0,0,0,0,1,1,1,0,0,0,0],
                [0,0,0,1,1,1,1,1,0,0,0],
                [0,0,0,1,1,0,1,1,0,0,0],
                [0,0,0,1,1,1,1,1,0,0,0],
                [0,0,0,0,1,1,1,0,0,0,0],
            ],
            // lockInfo : [
            //     [0,1,4,1]
            // ],
            lockInfo:[
                [4,15,2,1],[5,6,4,1],[6,17,2,1],[14,15,4,2],[14,25,2,1],[15,16,4,1],[15,26,2,2],[16,17,4,2],[17,18,4,2],[18,29,2,2],[25,36,2,1],[28,39,2,2],[36,37,4,2],[37,48,2,1],[38,49,2,2],[39,40,4,2],[39,50,2,1],[48,49,4,1],[49,50,4,2]
            ]
        }
    ];
}

export = PuzzleMissionConfig;
