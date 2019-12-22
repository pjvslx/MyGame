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
import SingleDepthData = require('./SingleDepthData');

@ccclass
class DiamondConfig extends cc.Component {
    // static stoneRate = stoneRate;
    static stoneData:SingleDepthData[] = [
        {
            depthId:0,
            stoneRateList:[{stoneId:10001,rate:0.3}],
            goldRateList:[{goldId:1,rate:0.2},{goldId:2,rate:0.1}]
        },
        {
            depthId:1,
            stoneRateList:[{stoneId:10001,rate:0.3}],
            goldRateList:[{goldId:1,rate:0.4}]
        },
        {
            depthId:2,
            stoneRateList:[{stoneId:10001,rate:0.2},{stoneId:10002,rate:0.2}],
            goldRateList:[{goldId:1,rate:0.4}]
        }
    ];
}
export = DiamondConfig;