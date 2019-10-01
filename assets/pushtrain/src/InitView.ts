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
class InitView extends cc.Component {
    @property(cc.Node)
    heartNodeList: cc.Node[] = [];
    @property(cc.Node)
    btnStart: cc.Node = null;
    @property(cc.Prefab)
    selectPrefab: cc.Prefab = null;

    onLoad(){
        this.updateView();
        this.addEvent();
    }

    showSelectView(){
        let selectView = cc.instantiate(this.selectPrefab);
        selectView.parent = this.node;
    }

    updateView(){
        this.updateHeart();
    }

    updateHeart(){
        let heartNum = Game.getInstance().heartNum;
        for(let i = 0; i < this.heartNodeList.length; i++){
            if(i < heartNum){
                this.heartNodeList[i].active = true;
            }else{
                this.heartNodeList[i].active = false;
            }
        }
    }

    addEvent(){
        this.btnStart.on('click',()=>{
            // Game.getInstance().pushTrain.show();
            this.showSelectView();
        },this);
    }
}

export = InitView;