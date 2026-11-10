import { _decorator, Component, log } from 'cc';

const { ccclass } = _decorator;

@ccclass('NetworkManager')
export default class NetworkManager extends Component {
    public static HTTPS_URL = 'https://lydiamond.oss-cn-beijing.aliyuncs.com/';
    public static PACKET_MESSAGE_TYPE_LEN = 2;
    public static PACKET_MESSAGE_ID_LEN = 4;
    public static PACKET_HEADER_LEN = NetworkManager.PACKET_MESSAGE_TYPE_LEN + NetworkManager.PACKET_MESSAGE_ID_LEN;
    private lastMsgTime:number = 0;
    static index: number = 1;
    public get(url:string,reqData:any,callback:any){
        var self = this;

        url += "?";
        for(var item in reqData){
            url += item +"=" +reqData[item] +"&";
        }
        log(url)
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4){
                if(xhr.status >= 200 && xhr.status < 400){
                    var response = xhr.responseText;
                    console.log(response)
                    if(response){
                        var responseJson = JSON.parse(response);
                        callback(responseJson);
                    }else{
                        log("返回数据不存在")
                        callback(false);
                    }
                }else{
                    log("请求失败")
                    callback(false);
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    }

    public post(url:string, reqData:any, callback:any, isJson:boolean){
        var self = this;
        // log(url)
        // log(reqData)
        //1.拼接请求参数
        var param = "";
        if(isJson == true){
            param = JSON.stringify(reqData);
            console.log(param);
        }else{
            for(var item in reqData){
                param += item + "=" + reqData[item] + "&";
            }
        }
        //2.发起请求
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4){
                if(xhr.status >= 200 && xhr.status < 400){
                    var response = xhr.responseText;
                    // log(response)
                    if(response){
                        var responseJson = JSON.parse(response);
                        callback(responseJson);
                    }else{
                        log("返回数据不存在")
                        callback(false);
                    }
                }else{
                    log("请求失败")
                    callback(false);
                }
            }
        };
        log('url = ' + url);
        log('param = ' + param);
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type" , "application/x-www-form-urlencoded");
        xhr.send(param);//reqData为字符串形式： "key=value"
    }
}
