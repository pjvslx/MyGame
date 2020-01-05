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
import ViewAction = require('../../common/src/ViewAction');
import Game = require('../../common/src/Game');
import Util = require('../../common/src/Util');
@ccclass
class BalanceView extends cc.Component {
    @property(cc.Node)
    currentScoreNode: cc.Node = null;
    @property(cc.Node)
    historyScoreNode: cc.Node = null;
    @property(cc.Node)
    btnBack: cc.Node = null;
    @property(cc.Node)
    btnAgain: cc.Node = null;

    onLoad(){
        this.addEvent();
        this.updateView();
    }

    addEvent(){
        this.btnAgain.on('click',()=>{
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().diamond.show();
            });
        },this);

        this.btnBack.on('click',()=>{
            cc.director.loadScene('start');
        },this);
    }

    init(currentScore:number,maxScore:number){
        this.currentScoreNode.getComponent(cc.Label).string = `当前分数:${currentScore}`;
        this.historyScoreNode.getComponent(cc.Label).string = `历史最高:${maxScore}`;
        if(Util.isWXPlatform()){
            window['wx'].postMessage({
                message: 'Balance',
                data : {
                    maxScore: maxScore
                }
            });
        }
    }

    updateView(){

    }
}

export = BalanceView;
