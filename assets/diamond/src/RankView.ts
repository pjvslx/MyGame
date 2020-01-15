import Util = require("../../common/src/Util");
import ViewAction = require("../../common/src/ViewAction");

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
class RankView extends cc.Component {
    @property(cc.Node)
    btnClose: cc.Node = null;
    
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