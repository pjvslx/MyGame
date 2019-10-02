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
import FateConfig = require('../src/FateConfig');
import Util = require('../../common/src/Util');

@ccclass
class BalanceView extends cc.Component {
    @property(cc.Node)
    txtNode: cc.Node = null;

    @property(cc.Node)
    btnClose: cc.Node = null;

    onLoad(){
        this.addEvent();
    }

    addEvent(){
        this.btnClose.on('click',()=>{
            this.node.destroy();
        },this);
    }

    init(fateType:number){
        let fateList = FateConfig.data[fateType];
        let randomIndex = Util.random(fateList.length) - 1;
        let value = fateList[randomIndex];
        this.txtNode.getComponent(cc.Label).string = value;
    }
}

export = BalanceView;