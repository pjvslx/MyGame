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

@ccclass
class GuideConfig extends cc.Component {
    static guideMissionData = [
        [1,     2,      5,      3,      4,      1,      2,      5],
        [1,     4,      2,      3,      5,      5,      2,      4],
        [3,     1,      1,      2,      2,      1,      4,      3],
        [1,     2,      2,      1,      2,      2,      1,      2],
        [1,     10000,  10000,  10000,  10000,  10000,  10000,  1],
        [10000, 10000,  10000,  10000,  10000,  10000,  10000,  10000],
        [10000, 10000,  10000,  10000,  10000,  10000,  10000,  10000],
        [10000, 10000,  10000,  10000,  10000,  10000,  10000,  10000],
    ];
}

export = GuideConfig;
