import sys,os
import shutil
import os
#coding=utf-8
if __name__ == "__main__":    
    gameVersion = '1.0.0'
    if len(sys.argv) < 2:
        print 'gameVersion is not defined, default is 1.0.0'
    else:
        gameVersion = sys.argv[1]
    # read game.js template
    f = open('./game.tmp.js', 'r')
    text = f.read()
    SUB_PACKAGE_NAME = 'sub-package'
    # newText = text %(CDN_ROOT,SUB_PACKAGE_NAME)
    path = './'
    title = 'diamond'
    platform = 'wechatgame'
    buildPath  = './build'
    inlineSpriteFrames = 'true'
    md5Cache = 'true'
    appid = 'wx4c1b0b3923b79729'
    orientation = 'portrait'

    buildCmd = 'CocosCreator.exe '
    buildCmd = buildCmd + ' --path ' + path + ' --build '
    buildParam = '\"'
    buildParam = buildParam + 'debug=false;'
    buildParam = buildParam + 'title=' + title + ';'
    buildParam = buildParam + 'platform=' + platform + ';'
    buildParam = buildParam + 'buildPath=' + buildPath + ';'
    buildParam = buildParam + 'inlineSpriteFrames=' + inlineSpriteFrames + ';'
    buildParam = buildParam + 'md5Cache' + md5Cache + ';'
    buildParam = buildParam + 'appid=' + appid + ';'
    buildParam = buildParam + 'orientation=' + orientation + ';'
    buildParam = buildParam + '\"'
    buildCmd = buildCmd + buildParam
    print buildCmd
    os.system(buildCmd)

    # find the fuck main.xxx.js and replace
    mainName = ''
    settingName = ''
    for root, dirs, files in os.walk('./build/wechatgame'):  
        for file in files:
            lst = file.split('.',-1)
            if lst[0] == 'main':
                mainName = file
            if lst[0] == 'settings':
                settingName = file

    newText = text %(settingName,mainName,SUB_PACKAGE_NAME)
    newText = newText + '\nfundebug = require(\"./libs/fundebug.0.5.0.min.js\")\n'
    newText = newText + 'fundebug.init({\n'
    newText = newText + '    apikey: "04b1890fedf54c5f4d3e54b2b6537e3082a342940a488404b8e961771a8d3757",\n'
    newText = newText + '    appVersion:' + '\"' + gameVersion + '\"' + ',\n'
    newText = newText + '    setSystemInfo:true,\n'
    newText = newText + '    setUserInfo:true,\n'
    newText = newText + '    silentHttp:true,\n'
    newText = newText + '})\n'
    f1 = open('./build/wechatgame/game.js','r+')
    f1.truncate()
    f1.write(newText)
    f1.flush()
    f1.close()
    shutil.copy('./fundebug.0.5.0.min.js','./build/wechatgame/libs/fundebug.0.5.0.min.js')