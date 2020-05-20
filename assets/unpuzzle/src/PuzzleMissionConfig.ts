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
    /**
     * [0 ,1 ,2, 3, 4, 5, 6, 7, 8, 9, 10]
     * [11,12,13,14,15,16,17,18,19,20,21]
     * [22,23,24,25,26,27,28,29,30,31,32]
     * [33,34,35,36,37,38,39,40,41,42,43]
     * [44,45,46,47,48,49,50,51,52,53,54]
     **/
    static data = [
        //1
        {
            cellSize:{
                width:100,
                height:100
            },
            cellInfo:[
                [ , , , , , , , , , , ],
                [ , , , , , , , , , , ],
                [ , , , , ,1, , , , , ],
                [ , , , , , , , , , , ],
                [ , , , , , , , , , , ],
            ],
            lockInfo:[]
        },
        //2
        {
            cellSize:{
                width:100,
                height:100
            },
            cellInfo:[
                [ , , , , , , , , , , ],
                [ , , , ,7,7, , , , , ],
                [ , , , , , , , , , , ],
                [ , , , ,0,0, , , , , ],
                [ , , , , , , , , , , ],
            ],
            lockInfo:[
                // [15,16,4,2],[37,38,4,1]
                [37,38,4,1]
            ]
        },
        //3
        {
            cellSize:{
                width:100,
                height:100
            },
            cellInfo:[
                [ , , , , , , , , , , ],
                [ , , , ,0,0,0, , , , ],
                [ , , , ,0,0,0, , , , ],
                [ , , , ,0,0,0, , , , ],
                [ , , , , , , , , , , ],
            ],
            lockInfo:[
            ] 
        },
        //4
        {
            cellSize:{
                width:100,
                height:100
            },
            cellInfo:[
                [ , , , ,0,0, , , , , ],
                [ , , , , , , , , , , ],
                [ , ,0, ,0,0, ,0, , , ],
                [ , ,0, ,0,0, ,0, , , ],
                [ , , , , , , , , , , ],
            ],
            lockInfo:[
                [4,5,4,2],[24,35,2,1],[26,37,2,1],[27,38,2,2],[29,40,2,2],[37,38,4,2]
            ] 
        },
    ];
}

export = PuzzleMissionConfig;
