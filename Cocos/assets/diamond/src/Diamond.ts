import { Animation, Component, Node, Size, Sprite, _decorator, sp } from 'cc';
import Game from '../../common/src/Game';

const { ccclass, menu, property } = _decorator;

@ccclass('Diamond')
@menu('diamond/Diamond')
class Diamond extends Component {
    static SIZE:Size = new Size(90,90);
    static COMPOSE_TYPE = {
        NONE : 0,
        BOMB : 1,
        CROSS : 2,
        CUBE : 3
    }
    @property(Node)
    imgNode: Node = null;
    @property(Node)
    animNode: Node = null;
    @property(Node)
    effect1: Node = null;
    @property(Node)
    effect2: Node = null;
    @property(Node)
    maskNode: Node = null;
    @property([sp.SkeletonData])
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
        this.imgNode.getComponent(Sprite).spriteFrame = Game.getInstance().diamond.diamondIconFrame[id - 1];
        let animation:Animation = this.animNode.getComponent(Animation);
        if(!animation){
            animation = this.animNode.addComponent(Animation);
        }
        let clip = Game.getInstance().diamond.createDiamondClip(id);
        clip.name = 'turn';
        const previousClip = animation.getState('turn')?.clip;
        if (previousClip) {
            animation.removeClip(previousClip, true);
        }
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
            let animation:Animation = this.animNode.getComponent(Animation);
            if(!animation){
                animation = this.animNode.addComponent(Animation);
            }
            let clip = Game.getInstance().diamond.createCubeClip();
            clip.name = 'turn';
            const previousClip = animation.getState('turn')?.clip;
            if (previousClip) {
                animation.removeClip(previousClip, true);
            }
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
export default Diamond;
