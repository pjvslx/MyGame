import { Component, Label, Node, Prefab, Sprite, UITransform, _decorator, director, instantiate, tween } from 'cc';
import ViewAction from '../../common/src/ViewAction';
import Game from '../../common/src/Game';
import Util from '../../common/src/Util';
import EventConfig from '../../common/src/EventConfig';

const { ccclass, property } = _decorator;
@ccclass('BalanceView')
class BalanceView extends Component {
    @property(Node)
    currentScoreNode: Node = null;
    @property(Node)
    btnBack: Node = null;
    @property(Node)
    btnAgain: Node = null;
    @property(Node)
    btnTurnplate: Node = null;
    @property(Node)
    progressText: Node = null;
    @property(Node)
    imgProgress: Node = null;
    @property(Prefab)
    degreePrefab: Prefab = null;
    @property(Node)
    btnNormalNode: Node = null;
    @property(Node)
    btnTurnplateNode: Node = null;
    turnplateRewardTime: number = 4;        //每打完多少次赢得一次转盘机会

    onLoad(){
        this.addEvent();
        Game.getInstance().adManager.openInterstitialAd();
    }

    addEvent(){
        this.btnAgain.on('click',()=>{
            this.getComponent(ViewAction).close(()=>{
                // Game.getInstance().diamond.show();
                Game.getInstance().pregame.deal();
                Util.playClickSound();
            });
        },this);

        this.btnBack.on('click',()=>{
            //TODO 插屏
            director.loadScene('start');
            Util.playClickSound();
        },this);

        this.btnTurnplate.on('click',()=>{
            Game.getInstance().player.setTurnplatePlayTimes(0);
            this.imgProgress.getComponent(Sprite).fillRange = 0;
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_SHOW_TURNPLATE);
            });
        },this);
    }

    init(currentScore:number,maxScore:number){
        this.currentScoreNode.getComponent(Label).string = `当前分数:${currentScore}`;
        if(Util.isWXPlatform()){
            Util.postOpenDataMessage({
                message: 'Balance',
                data : {
                    maxScore: maxScore
                }
            });
        }

        let innerWidth = this.imgProgress.getComponent(UITransform).width;
        //初始化刻度
        for(let i = 2; i <= this.turnplateRewardTime; i++){
            let degreeNode = instantiate(this.degreePrefab);
            degreeNode.parent = this.imgProgress;
            degreeNode.layer = this.imgProgress.layer;
            degreeNode.x = (i - 1) * innerWidth / this.turnplateRewardTime;
        }

        this.btnAgain.active = false;
        this.btnBack.active = false;
        let turnplatePlayTimes = Game.getInstance().player.turnplatePlayTimes;
        let oldTurnplatePlayTimes = turnplatePlayTimes;
        turnplatePlayTimes++;
        let percent;
        if(turnplatePlayTimes >= this.turnplateRewardTime){
            percent = 1;
        }else{
            percent = turnplatePlayTimes / this.turnplateRewardTime;
        }
        this.progressText.getComponent(Label).string = `每玩${this.turnplateRewardTime}把将获得一次抽奖机会`;
        this.imgProgress.getComponent(Sprite).fillRange = oldTurnplatePlayTimes / this.turnplateRewardTime;
        let delayTime = 0.5;
        let progressTime = 1;
        tween(this.node)
            .delay(delayTime)
            .call(() => {
                tween(this.imgProgress.getComponent(Sprite))
                    .to(progressTime, { fillRange: percent }, { easing: 'quintOut' })
                    .start();
            })
            .delay(progressTime)
            .call(() => {
                this.btnAgain.active = true;
                this.btnBack.active = true;
                this.btnNormalNode.active = percent !== 1;
                this.btnTurnplateNode.active = percent === 1;
                if (percent !== 1) {
                    Game.getInstance().player.setTurnplatePlayTimes(turnplatePlayTimes);
                }
            })
            .start();
    }
}

export default BalanceView;
