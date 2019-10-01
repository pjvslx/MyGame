import Util = require("../../common/src/Util");

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

@ccclass
class SelectView extends cc.Component {
    @property(cc.Node)
    btnList: cc.Node[] = [];

    @property(cc.Node)
    btnClose: cc.Node = null;

    onLoad(){
        this.addEvent();
    }

    addEvent(){
        for(let i = 0; i < this.btnList.length; i++){
            this.btnList[i].on('click',(p)=>{
                this.handleSelectClicked(p);
            },this);
        }

        this.btnClose.on('click',()=>{
            this.node.destroy();
        },this);
    }

    handleSelectClicked(p){
        let node = p.node;
        let index;
        for(let i = 0; i < this.btnList.length; i++){
            if(this.btnList[i] == node){
                index = i;
                break;
            }
        }

        Game.getInstance().enterPushScene(index);
    }
}

export = SelectView;
