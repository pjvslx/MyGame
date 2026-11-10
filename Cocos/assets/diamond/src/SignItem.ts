import { Component, Label, Node, Sprite, SpriteFrame, _decorator } from 'cc';
import Player from './Player';

const { ccclass, property } = _decorator;

@ccclass('SignItem')
class SignItem extends Component {
    @property(Node)
    iconNode: Node = null;

    @property(Node)
    countNode: Node = null;

    @property(Node)
    markNode: Node = null;

    @property([SpriteFrame])
    iconFrameList: SpriteFrame[] = [];

    setAttr(attrKey:string){
        if(attrKey == Player.ATTR.DIGGER_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[1];
        }else if(attrKey == Player.ATTR.SEARCH_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[0];
        }else if(attrKey == Player.ATTR.TIME_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[2];
        }
    }

    setNum(num:number){
        this.countNode.getComponent(Label).string = `x${num}`;
    }

    setIsSign(isSign:boolean){
        this.markNode.active = isSign;
    }
}

export default SignItem;
