import { AnimationClip, SpriteFrame, _decorator } from 'cc';
import type DiamondView from './DiamondView';
import Module from '../../common/src/Module';

const { ccclass, property } = _decorator;

@ccclass('DiamondGame')
class DiamondGame extends Module {
    @property([SpriteFrame])
    diamondIconFrame: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList1: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList2: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList3: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList4: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList5: SpriteFrame[] = [];
    @property([SpriteFrame])
    diamondFrameList6: SpriteFrame[] = [];

    sceneName: string = 'diamond';
    root: DiamondView = null;

    createDiamondClip(id:number){
        let clip = AnimationClip.createWithSpriteFrames(this[`diamondFrameList${id}`], this[`diamondFrameList${id}`].length);
        clip.wrapMode = AnimationClip.WrapMode.Loop;
        clip.speed = 5;
        return clip;
    }

    createCubeClip(){
        let clip = AnimationClip.createWithSpriteFrames(this[`diamondFrameList${6}`],this[`diamondFrameList${6}`].length);
        clip.wrapMode = AnimationClip.WrapMode.Loop;
        clip.speed = 0.5;
        return clip;
    }
}
export default DiamondGame;
