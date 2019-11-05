// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, menu, property} = cc._decorator;

import Game = require('../../common/src/Game');

@ccclass
@menu('diamond/Diamond')
class Diamond extends cc.Component {
    static SIZE:cc.Size = new cc.Size(90,90);
    @property(cc.Node)
    imgNode: cc.Node = null;
    @property(cc.Node)
    animNode: cc.Node = null;
    
    value:number = null;
    row:number = null;
    col:number = null;

    onLoad(){
        this.setDiamondId(5);
    }

    setDiamondId(id:number){
        if(this.value == id){
            return;
        }
        this.value = id;
        this.imgNode.getComponent(cc.Sprite).spriteFrame = Game.getInstance().diamond.diamondIconFrame[id - 1];
        let animation:cc.Animation = this.animNode.getComponent(cc.Animation);
        if(!animation){
            animation = this.animNode.addComponent(cc.Animation);
        }
        let clip = Game.getInstance().diamond.createDiamondClip(id);
        clip.name = 'turn';
        animation.addClip(clip);
        animation.play(clip.name);
        this.stop();
    }

    play(){
        this.imgNode.active = false;
        this.animNode.active = true;
    }

    stop(){
        this.imgNode.active = true;
        this.animNode.active = false;
    }
}
export = Diamond;