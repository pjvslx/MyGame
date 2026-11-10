import { Component, Node, _decorator } from 'cc';
import Util from "../../common/src/Util";
import ViewAction from "../../common/src/ViewAction";

const { ccclass, property } = _decorator;

@ccclass('RankView')
class RankView extends Component {
    @property(Node)
    btnClose: Node = null;

    onLoad(){
        if(Util.isWXPlatform()){
            Util.postOpenDataMessage({
                message: 'ShowRank'
            });
        }

        this.btnClose.on('click',()=>{
            Util.playClickSound();
            if(Util.isWXPlatform()){
                Util.postOpenDataMessage({
                    message: 'CloseRank'
                });
            }
            this.getComponent(ViewAction).close();
        },this);
    }
}
export default RankView;
