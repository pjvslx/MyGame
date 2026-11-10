import { Component, Node, _decorator, isValid } from 'cc';
import EventConfig from '../../common/src/EventConfig';
import ViewAction from "../../common/src/ViewAction";
import Util from '../../common/src/Util';
import AdManager from '../../common/src/AdManager';
import Game from "../../common/src/Game";

const { ccclass, property } = _decorator;
@ccclass('ReviveView')
class ReviveView extends Component {
    @property(Node)
    btnVideo: Node = null;
    @property(Node)
    btnOver: Node = null;

    start(){
        this.addEvent();
    }

    addEvent(){
        this.btnVideo.on('click',()=>{
            Util.playClickSound();
            Game.getInstance().adManager.openVedioAd(AdManager.VIDEO_ADUNIT.EXTEND_TIME,()=>{
                if(!isValid(this.node)){
                    return;
                }
                this.getComponent(ViewAction).close(()=>{
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_USE_TIME);
                });
            });
            // Game.getInstance().share.shareWechat(1,()=>{
            //     if(!isValid(this.node)){
            //         return;
            //     }
            //     this.getComponent(ViewAction).close(()=>{
            //         Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_USE_TIME);
            //     });
            // });
        },this);

        this.btnOver.on('click',()=>{
            if(Game.getInstance().adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_REVIVE_GIVEUP);
            });
        },this);
    }
}
export default ReviveView;
