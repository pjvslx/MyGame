const {ccclass, property} = cc._decorator;
import Util = require('./Util');
import Module = require('./Module');
@ccclass
class AdManager extends cc.Component {
    bannerList: any[] = [];
    bannerID: string = 'adunit-4e1e37194843bec2';
    bannerRefreshInterval: number = 30;
    // ------ reward video ------
    public videoInstance: any = null;
    public isVideoPlaying: boolean = false;
    public cb: Function = null;
    public showCb: Function = null;
    public closeCb: Function = null;

    static VIDEO_ADUNIT = {
        EXTEND_TIME : 'adunit-428776d3ade22195',
    };

    onLoad(){
        this.initBannerAd(this.bannerID,this.bannerList);
    }

    public initBannerAd(adUnitId: string, bannerList: any[]) {
        if(!Util.isWXPlatform()){
            return;
        }
        let self = this;
        // this.closeBannerAd();
        window['wx'].getSystemInfo({
            success: (res) => {
                let width: number = res.screenWidth;
                let height: number = res.screenHeight;
                console.log('screen width = ' + width + ' height = ' + height);

                let bannerWidth = 300;
                let bannerHeight = 35;
                let style = (cc.sys.os.toString().toLowerCase() == 'ios') ? { top: height - 100, width: bannerWidth, height: bannerHeight } : { top: 0, left: 0, width: bannerWidth, height: bannerHeight }
                let bannerAd = window['wx'].createBannerAd({
                    adUnitId: adUnitId,
                    style: style,
                    adIntervals: self.bannerRefreshInterval
                });


                bannerAd.onResize((res) => {

                    console.log('@@@@@onResize res.width = ' + res.width + ' res.height = ' + res.height + ' width = ' + width + ' height = ' + height);
                    bannerAd.style.top = (cc.sys.os.toString().toLowerCase() == 'ios') ? height - res.height : height - res.height;
                    console.log('bannerAd.style.top' + bannerAd.style.top + 'bannerAd.style.realWidth' + bannerAd.style.realWidth + 'bannerAd.style.realheight' + bannerAd.style.realheight);

                    // //水平居中
                    bannerAd.style.left = (width - res.width) / 2;
                    console.log('bannerAd.style.left' + bannerAd.style.left);

                });

                bannerList[bannerList.length] = bannerAd;
            }
        });
    }

    public showBanner(index:number = 0){
        for(let i = 0; i < this.bannerList.length; i++){
            this.bannerList[i].hide();
        }
        if(this.bannerList[index]){
            this.bannerList[index].show();
        }else{
            if(this.bannerList[0]){
                this.bannerList[0].show();
            }
        }
    }

    public openVedioAd(adUnitId:string, cb: Function, showCb?: Function, closeCb?: Function) {
        if(!Util.isWXPlatform()){
            return;
        }
        let Game = require('./Game');
        if (this.isVideoPlaying) return console.log('正在播放，请勿重复创建');
        // reset
        this.isVideoPlaying = true;
        this.cb = null;
        this.showCb = null;
        this.closeCb = null;
        // assignment
        this.cb = cb || null;
        this.showCb = showCb || null;
        this.closeCb = closeCb || null;

        console.log('==========openVedioAd========');
        if (cc.audioEngine.isMusicPlaying()) {
            cc.audioEngine.pauseMusic();
        }
        let video = window['wx'].createRewardedVideoAd({
            adUnitId: adUnitId
        });
        video.load()
            .then(() => {
                if (this.showCb) {
                    this.showCb();
                }
                video.show();
            })
            // err.errMsg
            .catch(err => {
                if (err.errMsg === 'no advertisement') {
                    err.errMsg = '当前无广告填充，请您稍后再试';
                }
                if (err && err.errMsg) {
                    Util.showToast(err.errMsg);
                }
                if (this.closeCb) {
                    this.closeCb();
                }
                this.isVideoPlaying = false;
                Game.getInstance().share.shareWechat(1, cb);
            });
        if (this.videoInstance === null) {
            this.videoInstance = video;
            this.videoInstance.onClose((res) => {
                if (Module.currentModule === Game.getInstance().diamond) {
                    if (Util.__instance.isMusicEnabled) {
                        cc.audioEngine.resumeMusic();
                    }
                }

                this.isVideoPlaying = false;
                console.log('videoAd.onClose res.isEnded = ' + res.isEnded);
                if (this.closeCb) {
                    this.closeCb();
                }
                if (res.isEnded == true) {
                    if (this.cb) {
                        this.cb();
                    }
                } else {
                    Util.showToast('视频中途退出无奖励');
                }
            });
        }
    }
}
export = AdManager;