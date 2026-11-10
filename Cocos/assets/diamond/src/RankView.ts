// // Learn TypeScript:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import { _decorator, Component, Node } from 'cc';
const {ccclass, property} = _decorator;

import Util = require("../../common/src/Util");
import ViewAction = require("../../common/src/ViewAction");
class RankView extends Component {
    btnClose: Node | null = null;
    onLoad(){
        if(Util.isWXPlatform()){
            window['wx'].postMessage({
                message: 'ShowRank'
            });
        }
        this.btnClose.on('click',()=>{
            Util.playClickSound();
            if(Util.isWXPlatform()){
                window['wx'].postMessage({
                    message: 'CloseRank'
                });
            }
            this.getComponent(ViewAction).close();
        },this);
    }
}
export = RankView;

@ccclass('RankView')
    @property(cc.Node)
/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// import Util = require("../../common/src/Util");
// import ViewAction = require("../../common/src/ViewAction");
// 
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
// 
// @ccclass
// class RankView extends cc.Component {
//     @property(cc.Node)
//     btnClose: cc.Node = null;
//     
//     onLoad(){
//         if(Util.isWXPlatform()){
//             window['wx'].postMessage({
//                 message: 'ShowRank'
//             });
//         }
// 
//         this.btnClose.on('click',()=>{
//             Util.playClickSound();
//             if(Util.isWXPlatform()){
//                 window['wx'].postMessage({
//                     message: 'CloseRank'
//                 });
//             }
//             this.getComponent(ViewAction).close();
//         },this);
//     }
// }
// export = RankView;
