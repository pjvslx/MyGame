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

import DiamondView = require('./DiamondView');
import Module = require('../../common/src/Module');

@ccclass
class DiamondGame extends Module {
    @property(cc.SpriteFrame)
    diamondIconFrame: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList1: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList2: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList3: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList4: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList5: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    diamondFrameList6: cc.SpriteFrame[] = [];

    sceneName: string = 'diamond';
    root: DiamondView = null;


    createDiamondClip(id:number){
        let clip = cc.AnimationClip.createWithSpriteFrames(this[`diamondFrameList${id}`], this[`diamondFrameList${id}`].length);
        clip.wrapMode = cc.WrapMode.Loop;
        clip.speed = 5;
        return clip;
    }

    createCubeClip(){
        let clip = cc.AnimationClip.createWithSpriteFrames(this[`diamondFrameList${6}`],this[`diamondFrameList${6}`].length);
        clip.wrapMode = cc.WrapMode.Loop;
        clip.speed = 0.5;
        return clip;
    }
}
export = DiamondGame;