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
import Player = require('./Player');
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
    @property(cc.Node)
    btnMusic: cc.Node;
    @property(cc.Prefab)
    rankPrefab: cc.Prefab = null;
    @property(cc.SpriteFrame)
    musicFrameList: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    effectFrameList: cc.SpriteFrame[] = [];
    @property(cc.Prefab)
    signPrefab: cc.Prefab = null;

    start(){
        this.updateMusicButton();
        this.updateSoundButton();
        this.addEvent();
    }

    updateMusicButton(){
        let musicFrame = (Util.__instance.isMusicEnabled ? this.musicFrameList[0] : this.musicFrameList[1]);
        this.btnMusic.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = musicFrame;
    }

    updateSoundButton(){
        let effectFrame = (Util.__instance.isEffectEnabled ? this.effectFrameList[0] : this.effectFrameList[1]);
        this.btnSound.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = effectFrame;
    }

    addEvent(){
        this.btnStart.on('click',()=>{
            Game.getInstance().diamond.show();
        },this);

        this.btnRank.on('click',()=>{
            this.showRankView();
        },this);

        this.btnSound.on('click',()=>{
            Util.changeSoundSetting();
            this.updateSoundButton();
        },this);

        this.btnMusic.on('click',()=>{
            Util.changeMusicSetting();
            this.updateMusicButton()
        });

        this.btnSign.on('click',()=>{
            this.showSignView();
        });

        this.btnShare.on('click',()=>{
            // cc.sys.localStorage.removeItem(Player.SPECIAL_ATTR.SIGN_DATA);
            // Game.getInstance().player.resetAttr();
        });
    }

    showSignView(){
        let signView = cc.instantiate(this.signPrefab);
        signView.parent = this.node;
        signView.getComponent(ViewAction).open();
    }

    showRankView(){
        let rankView = cc.instantiate(this.rankPrefab);
        rankView.parent = this.node;
        rankView.getComponent(ViewAction).open();
    }
}

export = StartView;
