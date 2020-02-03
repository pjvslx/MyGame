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
import ISignData = require('./ISignData');
@ccclass
class DiamondConfig extends cc.Component {
    static remoteConfig = {
        isShareHide : false,
        getItemShareRate : '0|10000',
        turnplateAgainRate : '0|10000',
    };
    static goldLevelConfig = [
        [1],
        [2,4,5],
        [3,6,7,8]
    ];
    //小中大金子10,20,30 福袋红包 20, 钻石，美钞30
    static scoreConfig = [1000,2000,3000,2000,2000,3000,3000,3000];
    // static stoneRate = stoneRate;
    static stoneData:SingleDepthData[] = [
        {
            depthId:0,
            stoneRateList:[],
            goldRateList:[{goldLevelId:1,rate:0.4},{goldLevelId:2,rate:0.1},{goldLevelId:3,rate:0.1}]
        },
        {
            depthId:1,
            stoneRateList:[{stoneId:10001,rate:0.3}],
            goldRateList:[{goldLevelId:1,rate:0.2},{goldLevelId:2,rate:0.3},{goldLevelId:3,rate:0.2}]
        },
        {
            depthId:2,
            stoneRateList:[{stoneId:10001,rate:0.4},{stoneId:10002,rate:0.3}],
            goldRateList:[{goldLevelId:1,rate:0.1},{goldLevelId:2,rate:0.3},{goldLevelId:3,rate:0.3}]
        },
        {
            depthId:3,
            stoneRateList:[{stoneId:10001,rate:0.2},{stoneId:10002,rate:0.3},{stoneId:10003,rate:0.2}],
            goldRateList:[{goldLevelId:2,rate:0.4},{goldLevelId:3,rate:0.3}]
        },
        {
            depthId:4,
            stoneRateList:[{stoneId:10001,rate:0.1},{stoneId:10002,rate:0.3},{stoneId:10003,rate:0.3},{stoneId:10004,rate:0.07}],
            goldRateList:[{goldLevelId:2,rate:0.6},{goldLevelId:3,rate:0.3}]
        },
        {
            depthId:5,
            stoneRateList:[{stoneId:10002,rate:0.4},{stoneId:10003,rate:0.3},{stoneId:10004,rate:0.07}],
            goldRateList:[{goldLevelId:3,rate:0.8}]
        },
        {
            depthId:6,
            stoneRateList:[{stoneId:10002,rate:0.3},{stoneId:10003,rate:0.4},{stoneId:10004,rate:0.07}],
            goldRateList:[{goldLevelId:3,rate:1}]
        },
        {
            depthId:7,
            stoneRateList:[{stoneId:10002,rate:0.2},{stoneId:10003,rate:0.5},{stoneId:10004,rate:0.07}],
            goldRateList:[{goldLevelId:3,rate:1}]
        }
    ];

    /**
     * SEARCH_TOOL : 'SEARCH_TOOL',
        DIGGER_TOOL : 'DIGGER_TOOL',
        TIME_TOOL : 'TIME_TOOL',
     */
    static signConfig:ISignData[] = [
        {
            attrKey: 'SEARCH_TOOL',
            count: 1
        },
        {
            attrKey: 'DIGGER_TOOL',
            count: 1
        },
        {
            attrKey: 'TIME_TOOL',
            count: 1
        },
        {
            attrKey: 'SEARCH_TOOL',
            count: 2
        },
        {
            attrKey: 'DIGGER_TOOL',
            count: 2
        },
        {
            attrKey: 'TIME_TOOL',
            count: 2
        },
        {
            attrKey: 'TIME_TOOL',
            count: 3
        }
    ];
}
export = DiamondConfig;