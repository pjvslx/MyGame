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
    static COMPOSE_TYPE = {
        NONE : 0,
        BOMB : 1,
        CROSS : 2,
        CUBE : 3
    }
    @property(cc.Node)
    imgNode: cc.Node = null;
    @property(cc.Node)
    animNode: cc.Node = null;
    @property(cc.Node)
    effect1: cc.Node = null;
    @property(cc.Node)
    effect2: cc.Node = null;
    @property(cc.Node)
    maskNode: cc.Node = null;
    @property(sp.SkeletonData)
    baozhaSpineDataList: sp.SkeletonData[] = [];
    @property(sp.SkeletonData)
    shiziSpineData: sp.SkeletonData = null;
    
    value:number = null;
    row:number = null;
    col:number = null;

    composeType: number = 0;
    

    onLoad(){
        this.setDiamondId(5);
    }

    setDiamondId(id:number){
        // console.log('setDiamondId id = ' + id);
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
        animation.removeClip(animation.currentClip);
        animation.addClip(clip);
        animation.play(clip.name);
        this.stop();
    }

    play(){
        if(this.composeType < Diamond.COMPOSE_TYPE.CUBE){
            this.imgNode.active = false;
            this.animNode.active = true;
        }else{
            this.imgNode.active = false;
        }
    }

    stop(){
        if(this.composeType < Diamond.COMPOSE_TYPE.CUBE){
            this.imgNode.active = true;
            this.animNode.active = false;
        }else{
            this.imgNode.active = false;
            this.animNode.active = true;   
        }   
    }

    setComposeType(composeType){
        // console.log('setComposeType type = ' + composeType);
        if(composeType == Diamond.COMPOSE_TYPE.NONE){
            this.effect1.active = false;
            this.effect2.active = false;
        }else if(composeType == Diamond.COMPOSE_TYPE.BOMB){
            this.effect1.active = true;
            this.effect2.active = false;
            if(this.value == 1){
                this.effect1.getComponent(sp.Skeleton).skeletonData = this.baozhaSpineDataList[1];
            }else if(this.value == 2){
                this.effect1.getComponent(sp.Skeleton).skeletonData = this.baozhaSpineDataList[0];
            }else if(this.value == 3){
                this.effect1.getComponent(sp.Skeleton).skeletonData = this.baozhaSpineDataList[0];
            }else if(this.value == 4){
                this.effect1.getComponent(sp.Skeleton).skeletonData = this.baozhaSpineDataList[0];
            }else if(this.value == 5){
                this.effect1.getComponent(sp.Skeleton).skeletonData = this.baozhaSpineDataList[3];
            }
            this.effect1.getComponent(sp.Skeleton).setAnimation(0,'huo',true);
        }else if(composeType == Diamond.COMPOSE_TYPE.CROSS){
            this.effect1.active = true;
            this.effect1.getComponent(sp.Skeleton).skeletonData = this.shiziSpineData;
            this.effect1.getComponent(sp.Skeleton).setAnimation(0,'animation',true);
            this.effect2.active = true;
        }else if(composeType == Diamond.COMPOSE_TYPE.CUBE){
            let animation:cc.Animation = this.animNode.getComponent(cc.Animation);
            if(!animation){
                animation = this.animNode.addComponent(cc.Animation);
            }
            let clip = Game.getInstance().diamond.createCubeClip();
            clip.name = 'turn';
            animation.removeClip(animation.currentClip);
            animation.addClip(clip);
            animation.play(clip.name);
            this.imgNode.active = false;
            this.animNode.active = true;
            this.effect1.active = false;
            this.effect2.active = false;
        }
        this.composeType = composeType;
    }

    setMask(isActive:boolean){
        this.maskNode.active = isActive;
    }
}
export = Diamond;
