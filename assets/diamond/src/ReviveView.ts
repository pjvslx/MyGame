import Game = require("../../common/src/Game");

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
import EventConfig = require('../../common/src/EventConfig');
import ViewAction = require("../../common/src/ViewAction");
import Util = require('../../common/src/Util');
@ccclass
class ReviveView extends cc.Component {
    @property(cc.Node)
    btnVideo: cc.Node = null;
    @property(cc.Node)
    btnOver: cc.Node = null;

    start(){
        this.addEvent();
    }

    addEvent(){
        this.btnVideo.on('click',()=>{
            // Game.getInstance().adManager.openVedioAd(0,()=>{
            //     Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_USE_TIME);
            //     this.getComponent(ViewAction).close();
            // });
            Util.playClickSound();
            Game.getInstance().share.shareWechat(1,()=>{
                if(!cc.isValid(this.node)){
                    return;
                }
                this.getComponent(ViewAction).close(()=>{
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_USE_TIME);
                });
            });
        },this);

        this.btnOver.on('click',()=>{
            Util.playClickSound();
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_REVIVE_GIVEUP);
            });
        },this);
    }
}
export = ReviveView;