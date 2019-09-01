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

import Game = require('../../common/src/Game');
import EventConfig = require('../../common/src/EventConfig');

@ccclass
class PushConfirmView extends cc.Component {
    @property(cc.Node)
    btnOK: cc.Node = null;
    @property(cc.Node)
    btnCancel: cc.Node = null;

    onLoad(){
        this.addEvent();
    }

    addEvent(){
        this.btnOK.on('click',()=>{
            Game.getInstance().gNode.emit(EventConfig.EVT_PUSHTRAIN_CONFIRM_OK_CLICKED);
        },this);

        this.btnCancel.on('click',()=>{
            Game.getInstance().gNode.emit(EventConfig.EVT_PUSHTRAIN_CONFIRM_CANCEL_CLICKED);
        },this);
    }
}

export = PushConfirmView;
