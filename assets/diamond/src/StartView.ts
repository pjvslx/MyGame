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
import Util = require('../../common/src/Util');
import ViewAction = require('../../common/src/ViewAction');
@ccclass
class StartView extends cc.Component {
    @property(cc.Node)
    btnStart: cc.Node;
    @property(cc.Node)
    btnRank: cc.Node
    @property(cc.Node)
    btnShare: cc.Node;
    @property(cc.Node)
    btnSound: cc.Node;
    @property(cc.Node)
    btnSign: cc.Node;

    @property(cc.Prefab)
    rankPrefab: cc.Prefab = null;

    start(){
        this.addEvent();
    }

    addEvent(){
        this.btnStart.on('click',()=>{
            Game.getInstance().diamond.show();
        },this);

        this.btnRank.on('click',()=>{
            this.showRankView();
        },this);
    }

    showRankView(){
        let rankView = cc.instantiate(this.rankPrefab);
        rankView.parent = this.node;
        rankView.getComponent(ViewAction).open();
    }
}

export = StartView;
