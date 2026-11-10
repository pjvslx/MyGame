// // Learn TypeScript:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import { _decorator, Component } from 'cc';
const {ccclass, property} = _decorator;

import EventConfig = require('../../../common/src/EventConfig');
import Game = require('../../../common/src/Game');
class GuideFocus extends Component {
    onDestroy(){
        Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_FOCUS_DESTROY,this.node);
    }
}
export = GuideFocus;

@ccclass('GuideFocus')
/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// // Learn TypeScript:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
// 
// const {ccclass, property} = cc._decorator;
// import EventConfig = require('../../../common/src/EventConfig');
// import Game = require('../../../common/src/Game');
// @ccclass
// class GuideFocus extends cc.Component {
//     onDestroy(){
//         Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_FOCUS_DESTROY,this.node);
//     }
// }
// export = GuideFocus;
