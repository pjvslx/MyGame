const {ccclass, property} = cc._decorator;
import Util = require('./Util');
import Module = require('./Module');
@ccclass
class AdManager extends cc.Component {
    bannerList: any[] = [];
    bannerID: string = 'fc8bb0cfec6127b88af767bce81862dd';
    // ------ reward video ------
    public videoInstance: any = null;
    public isVideoPlaying: boolean = false;
    public cb: Function = null;
    public showCb: Function = null;
    public closeCb: Function = null;

    onLoad(){
        this.initBannerAd(this.bannerID,this.bannerList);
    }

    public initBannerAd(adUnitId: string, bannerList: any[]) {
        if(!Util.isWXPlatform()){
            return;
        }
        // this.closeBannerAd();
        window['wx'].getSystemInfo({
            success: (res) => {
                let width: number = res.screenWidth;
                let height: number = res.screenHeight;
                console.log('screen width = ' + width + ' height = ' + height);

                let bannerWidth = 300 * 1.5;
                let bannerHeight = 35 * 1.5;
                let style = (cc.sys.os.toString().toLowerCase() == 'ios') ? { top: height - 100, width: bannerWidth, height: bannerHeight } : { top: 0, left: 0, width: bannerWidth, height: bannerHeight }
                let bannerAd = window['wx'].createBannerAd({
                    adUnitId: adUnitId,
                    style: style
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

    public openVedioAd(videoIndex: number, cb: Function, showCb?: Function, closeCb?: Function) {
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
        let adId: string;
        switch (videoIndex) {
            case 1: // 宝箱减2小时
                adId = 'cf135852de46a499a4d6bdb53743a81c';
                break;
            default:
                cc.log('videoIndex error');
                adId = 'cf135852de46a499a4d6bdb53743a81c';
                break;
        }
        let video = window['wx'].createRewardedVideoAd({
            adUnitId: adId
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
                    // Game.gNode.emit(EventConfig.EVT_FINISHED_AD_VEDIO);
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