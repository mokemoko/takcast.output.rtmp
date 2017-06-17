import * as React from "react";

import {IPlugin} from "takcast.interface";
import {IOutputPlugin} from "takcast.interface";
import {IMediaPlugin} from "takcast.interface";
import {IBasePlugin} from "takcast.interface";

import * as electron from "electron";

import {settingComponent} from "./ui/settingComponent";
import {setting} from "./ui/setting";

import * as tt from "ttlibjs_next2";
var ipcRenderer = electron.ipcRenderer;

export interface RtmpEventListener {
  onUpdate(info:{address:string, streamName:string, audio:any, video:any});
  onStop();
}

export class Rtmp implements IOutputPlugin {
  public name = "rtmp";
  public type = "output";

  private activeMedia:IMediaPlugin;
  private targetMedia:IMediaPlugin;

  private basePlugin:IBasePlugin;
  private codecsInfo:{audio:any[], video:any[]} = null;
  private targetInfo:{address:string, streamName:string, audio:any, video:any};

  private pts:number; // 動作pts
  private timerId:NodeJS.Timer; // 映像データを処理するときに利用するtimerのID、停止時に利用するため、保持しておく
  private scriptNode:ScriptProcessorNode; // AudioNodeからpcmデータを取得する

  private eventTarget:RtmpEventListener;
  /**
   * コンストラクタ
   */
  constructor() {
    this.activeMedia = null;
    this.targetMedia = null;
    this.codecsInfo = null;
    this.targetInfo = null;
    this.timerId = null;
    this.scriptNode = null;
    this.eventTarget = null;
  }
  public _setEventTarget(eventTarget:RtmpEventListener) {
    this.eventTarget = eventTarget;
  }
  /**
   * プラグイン初期化
   */
  public setPlugins(plugins:{[key:string]:Array<IPlugin>}):void {
    // 基本pluginを保持
    this.basePlugin = plugins["base"][0] as IBasePlugin;
    // node側に初期化を送って、codecの情報をもらう
    ipcRenderer.on(this.name + "init", (e:Electron.IpcRendererEvent, args:any) => {
      this.codecsInfo = args[0];
      this.targetInfo = args[1];
      if(this.targetInfo == null) {
        this.targetInfo = {
          address: "",
          streamName: "",
          audio: null,
          video: null
        };
      }
      if(this.eventTarget != null) {
        this.eventTarget.onUpdate(this.targetInfo);
      }
    });
    ipcRenderer.on(this.name + "close", () => {
      // サーバーとの通信がなんらかの原因でおわったときのイベント
      if(this.eventTarget != null) {
        this.eventTarget.onStop(); // 停止したことを通知しておく
      }
      // このタイミングで停止を実施しなければならない。
    });
    ipcRenderer.send(this.name + "init");
  }
  /**
   * 下部の設定コンポーネントを参照
   */
  public refSettingComponent():React.ComponentClass<{}> {
    return settingComponent(this);
  }
  /**
   * node側からもらった利用可能なコーデック情報を参照する
   */
  public _refCodecsInfo():{audio:any[], video:any[]} {
    return this.codecsInfo;
  }
  public _refTargetInfo():{address:string, streamName:string, audio:any, video:any} {
    return this.targetInfo;
  }
  /**
   * 設定ダイアログを開く
   * rtmpアドレスやコーデック設定等が実施できる
   */
  public _openSetting():void {
    setting(this);
  }
  /**
   * 配信設定をセットする
   * 設定ダイアログの結果を保存する
   * @param info 
   */
  public _setInfo(info:{address:string, streamName:string, audio:any, video:any}):void {
    // 設定を受け取ったらfooterの部分のアドレス表示を更新しておきたいところ。
    // イベントを通知しないとね。
    this.targetInfo = info;
    this.eventTarget.onUpdate(info);
  }
  /**
   * 有効になっているmediaPluginが変更になったときの動作
   */
  public onChangeActiveMedia(media:IMediaPlugin):void {
    if(this.targetMedia == media) {
      // 現在処理しているmediaがactiveになった場合は、設定がかわっている可能性がある。
      // その場合は切断しないと処理できなくなる。
    }
    this.activeMedia = media;
  }
  /**
   * mediaPluginが撤去されたときの動作
   * @param media
   */
  public onRemoveMedia(media:IMediaPlugin):void {
    if(this.targetMedia == media) {
    }
  }
  /**
   * 配信実行
   */
  public _publish():boolean {
    // 配信開始
    if(this.targetInfo == null) {
      alert("接続先設定がありません。");
      return false;
    }

    // 動作mediaを確定する
    if(this.targetInfo.audio == null || this.targetInfo.video == null) {
      alert("エンコーダー情報がありません");
      return false;
    }
    this.targetMedia = this.activeMedia;
    // canvasを取得してcapture経由でyuvデータを入手する
    var canvas = this.targetMedia.refCanvas();
    var capture = new tt.video.SceneCapture(canvas.width, canvas.height, this.targetInfo.video.semiPlanar);
    this.targetInfo.video.width = canvas.width;
    this.targetInfo.video.height = canvas.height;
    this.targetInfo.audio.sampleRate = this.basePlugin.refAudioContext().sampleRate;
    this.targetInfo.audio.channelNum = 1;
    // 配信情報をnode側に送信する
    ipcRenderer.send(this.name + "publish", this.targetInfo);
    this.pts = 0; // ptsを初期化する
    // yuvイメージデータを取得する
    var array:Uint8Array = new Uint8Array(canvas.width * canvas.height * 3 / 2);
    var draw = () => {
      capture.drain(canvas, array);
      ipcRenderer.send(this.name + "yuv", [array, this.pts]);
    };
    this.timerId = setInterval(draw, 1000 / 15);
    // pcm音声データを取得する
    this.scriptNode = this.basePlugin.refAudioContext().createScriptProcessor(0, 1, 1);
    this.scriptNode.onaudioprocess = (ev:AudioProcessingEvent) => {
      var ary = ev.inputBuffer.getChannelData(0);
      var length = ev.inputBuffer.length;
      var pcm = new Int16Array(length);
      for(var i = 0;i < length;++ i) {
        var val = ary[i] * 32700;
        if(val > 32700) {
          val = 32700;
        }
        if(val < -32700) {
          val = -32700;
        }
        pcm[i] = val;
      }
      ipcRenderer.send(this.name + "pcm", [new Uint8Array(pcm.buffer), this.pts]);
      this.pts += length;
    };
    this.scriptNode.connect(this.basePlugin.refDevnullNode());
    this.targetMedia.refNode().connect(this.scriptNode);
    return true;
  }
  public _stop() {
    // 配信停止
    if(this.scriptNode != null) {
      this.targetMedia.refNode().disconnect(this.scriptNode);
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    if(this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    ipcRenderer.send(this.name + "stop");
  }
}

export var _ = new Rtmp();