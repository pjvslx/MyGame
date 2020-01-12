import EventConfig = require('./EventConfig');
import Util = require("./Util");

const {ccclass, property} = cc._decorator;

@ccclass
class Share extends cc.Component {

    lastShareTime : number =0;
    isShare : boolean = false;
    failedNum : number = 0;
    shareNum : number = 0;
    cb: any = null;
    isCancel: boolean = false;

    onLoad () {
        //分享失败次数
        this.failedNum = 0;
        //分享次数
        this.shareNum = 0;

        let self = this;
        if(Util.isWXPlatform()){
            window['wx'].onShow((res)=>{
                self.handleNoWechatShareEvent();
            });
        }

        this.addCommonShareEvent();
    }

    addCommonShareEvent(){
        if(cc.sys.platform !== cc.sys.WECHAT_GAME){
            return;
        }
        let shareIndex: number = 8;
        window['wx'].onShareAppMessage((res)=>{
            cc.log('微信右上角分享');
            let Game = require('./Game');
            Game.getInstance().gNode.emit(EventConfig.EVT_FINISED_SHARE);
			return {
				title : '一款上手后就停不下来的宝石消除游戏',
                imageUrl : 'https://lydiamond.oss-cn-beijing.aliyuncs.com/share/1.png'
            };
        });
    }

    handleNoWechatShareEvent(){
        if(this.isShare == false){
            return;
        }
        let Game = require('./Game');
        if(Game.getInstance().isShareHide() == true){
            if(this.cb){
                this.cb();
            }
            this.cb = null;
            return;
        }
        //增加分享次数
        this.shareNum++;
        //14.分享的逻辑添加：1、分享2秒内必失败；2、分享2-4秒以上40%失败；3、4秒100%成功；
        // let mustFailedTime: number = 2000;
        // let mustFailedTime = parseInt(Game.getInstance().sdkConfig.data['shareTimeLimit']);
        let mustFailedTime: number = 2000;
        let mustSuccessTime: number = 4000;

        let curTime: number = Date.parse((new Date().toString()));
        if(curTime - this.lastShareTime <= mustFailedTime){
            //2s之内必失败
            this.failed();
        }else if (curTime - this.lastShareTime > mustFailedTime && curTime - this.lastShareTime <= mustSuccessTime) {
            //大于两秒 小于四秒
            let failRange: number = 60;
            let randomNum: number = Util.random(100);
            if(randomNum < failRange){
                this.failed(`randomNum = ${randomNum} failRange = ${failRange}`);
            }else{
                this.success(`randomNum = ${randomNum} failRange = ${failRange}`);
            }
        } else {
            this.success();
        }
        this.isShare = false;
    }

    success(str?: string) {
        this.scheduleOnce(()=>{
            this.failedNum = 0;
            this.shareNum = 0;
            if(this.cb != null){
                this.cb();
            }
            this.cb = null;
            cc.log('=========EventConfig.EVT_FINISED_SHARE==========');
            let Game = require('./Game');
            Game.getInstance().gNode.emit(EventConfig.EVT_FINISED_SHARE);
        },1);   
    }

    failed (str?: string) {
        this.scheduleOnce(()=>{
            this.failedNum++;
            let failedMsg: string;
            failedMsg = '换个朋友试试吧！';
            Util.showToast(failedMsg);
            this.cb = null;
        },1);
    }

    shareWechat (shareIndex: number, cb: any, queryParam?: string) {
        if(cc.sys.platform != cc.sys.WECHAT_GAME){
            return;
        }

        this.isCancel = false;
        this.cb = cb;
        this.lastShareTime = Date.parse((new Date()).toString());
        this.isShare = true;

        let func: any = () => {
            queryParam = `shareIndex=${shareIndex}`;
            window['wx'].shareAppMessage({
                title : '一款上手后就停不下来的宝石消除游戏',
                imageUrl : 'https://lydiamond.oss-cn-beijing.aliyuncs.com/share/1.png',
                query : queryParam,
                cancel : () => {
                    cc.log('====shareWechat cancel====');
                    this.isCancel = true;
                }
            });
        };

        func();
    }
}
export = Share;