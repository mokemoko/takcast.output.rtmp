import {IPlugin} from "takcast.interface";

import {ipcMain} from "electron";

import * as ttg from "ttlibjsgyp2";
// データを保存するための動作
import {writeFile} from "fs";
import {readFileSync} from "fs";

// とりあえずデータとして保存できるようにしておこう。
export class Rtmp implements IPlugin {
  public name = "rtmp";
  public type = "output";

  // コーデック情報収集用
  private audioCodecs:any[];
  private videoCodecs:any[];
  private codecList:string[];
  // rtmp接続用
  private nc:ttg.rtmp.NetConnection;
  private ns:ttg.rtmp.NetStream;
  private isPublishing:boolean;
  // 実際に配信するときに利用するcodec情報
  private audioCodec:any;
  private videoCodec:any;
  // encoder
  private h264Encoder:any;
  private aacEncoder:any;
  // frameデータ(内部で使いまわします)
  private yuvFrame:ttg.Frame;
  private pcmFrame:ttg.Frame;
  // yuvイメージのuvStrideの値
  private uvStride:number;
  // yuvイメージのsubType planarかsemiPlanar
  private subType:string;
  /**
   * コンストラクタ
   */
  constructor() {
    this.nc = null;
    this.ns = null;
    this.h264Encoder = null;
    this.aacEncoder = null;
    this.yuvFrame = null;
    this.pcmFrame = null;
    this.uvStride = 0;
    this.subType = "planar";
    this.audioCodecs = [];
    this.videoCodecs = [];
    this.isPublishing = false;
    // 1.codecListの配列に追加したいものを書いておく
    this.codecList = ["MacOS","Windows","Faac","Openh264","X264"];
  }
  // 2.追加した名前と同じ名称の関数を準備する
  private MacOS(target) {
    // 3.targetの設定があるのは、実際にencoderを作るとき、ない場合は選択候補をつくるとき
    if(!target) {
      // 4.外部ライブラリで利用可能で確認して、利用できる場合はaudioCodecsかvideoCodecsにコーデック情報を記録しておく
      if(ttg.encoder.AudioConverterEncoder.enabled) {
        this.audioCodecs.push({
          codec: "MacOS", // codec必須:追加した名前と同じにする
          codecType: "audio", // 動作タイプ(このcodecでは独自に追加した)
          name: "MacOS", // 選択ダイアログでの名前(なんでもいいがMacOSにした)
          channelNum: 1, // channelNumとsampleRateは音声側では必須項目
          sampleRate: 44100, // audioContextの状態に従って設定が変更されます
          type: "aac", // 以下は初期化に必要な設定項目
          bitrate: {type: "number", value: 95000, values:94000} // jsonになっているものは、ダイアログで選択可能になるもの
        });
      }
      if(ttg.encoder.VtCompressSessionEncoder.enabled) {
        this.videoCodecs.push({
          codec: "MacOS",
          codecType: "video",
          name: "MacOS",
          semiPlanar: false, // 映像側ではsemiPlanarである必要があるかのフラグ
          width: 320, // widthとheightが必須項目
          height: 240,
          fps: 15,
          bitrate: {type: "number", value: 600000, values: 600000}, // 文字入力で値をいれてもらう場合
          isbaseline: {type: "checkbox", value: 1, values: 1} // チェックボックスでon offしtrue falseを設定する場合
        });
      }
    }
    else {
      // 実際にtargetの内容がある場合はその設定でencoderを作る必要があるときの動作
      switch(target.codecType) {
      case "audio":
        // codec情報を登録するのは必須
        this.audioCodec = target;
        this.aacEncoder = new ttg.encoder.AudioConverterEncoder(
          "aac",
          this.audioCodec.sampleRate,
          this.audioCodec.channelNum,
          parseInt(this.audioCodec.bitrate));
        break;
      case "video":
        // 映像側はcodec情報を設定するのと、入力に利用するyuvデータのsubType(planarかsemiPlanar)とuvStride値の設定が必要
        this.videoCodec = target;
        this.subType = "planar";
        this.uvStride = target.width / 2;
        // あとはencoderを作ればよい
        this.h264Encoder = new ttg.encoder.VtCompressSessionEncoder(
          "h264",
          this.videoCodec.width,
          this.videoCodec.height,
          this.videoCodec.fps,
          this.videoCodec.bitrate,
          this.videoCodec.isbaseline);
        break;
      default:
        break;
      }
    }
  }
  private Windows(target) {
    if(!target) {
      if(ttg.encoder.MSAacEncoder.enabled) {
        ttg.MsSetup.CoInitialize("multithread");
        ttg.MsSetup.MFStartup();
        this.audioCodecs.push({
          codec: "Windows",
          codecType: "audio",
          name: "Windows",
          channelNum: 1,
          sampleRate: 44100,
          bitrate: {type: "number", value: 96000, values:96000}
        });
      }
      if(ttg.encoder.MSH264Encoder.enabled) {
        ttg.encoder.MSH264Encoder.listEncoders((err, encoder) => {
          this.videoCodecs.push({
            codec: "Windows",
            codecType: "video",
            name: encoder,
            semiPlanar: true,
            width: 320,
            height: 240,
            bitrate: {type: "number", value: 600000, values:600000}
          });
          return true;
        });
      }
    }
    else {
      switch(target.codecType) {
      case "audio":
        this.audioCodec = target;
        this.aacEncoder = new ttg.encoder.MSAacEncoder(
          this.audioCodec.sampleRate,
          this.audioCodec.channelNum,
          this.audioCodec.bitrate);
        break;
      case "video":
        this.videoCodec = target;
        this.subType = "semiPlanar";
        this.uvStride = target.width;
        this.h264Encoder = new ttg.encoder.MSH264Encoder(
          this.videoCodec.name,
          this.videoCodec.width,
          this.videoCodec.height,
          this.videoCodec.bitrate);
        break;
      default:
        break;
      }
    }
  }
  private Faac(target) {
    if(!target) {
      if(ttg.encoder.FaacEncoder.enabled) {
        this.audioCodecs.push({
          codec: "Faac",
          name: "Faac",
          type: "low",
          bitrate: {type: "number", value: 96000, values:96000},
          sampleRate: 44100,
          channelNum: 1
        });
      }
    }
    else {
      this.audioCodec = target;
      this.aacEncoder = new ttg.encoder.FaacEncoder(
        this.audioCodec.type,
        this.audioCodec.sampleRate,
        this.audioCodec.channelNum,
        this.audioCodec.bitrate);
    }
  }
  private Openh264(target) {
    if(!target) {
      if(ttg.encoder.Openh264Encoder.enabled) {
        this.videoCodecs.push({
          codec: "Openh264",
          name: "Openh264",
          semiPlanar: false,
          width: 320,
          height: 240,
          param: {type: "textarea", value: "", values: ""},
          spatialParamArray: {type: "textarea", value: "", values: ""}
        });
      }
    }
    else {
      // このタイミングでparamsとspatialArrayをちゃんとした形に復元しないといけない。
      // とりあえずparamsをparseするか・・・
      var param = {};
      var spatialParamArray = [{}];
      try {
        var jobj = JSON.parse(target.param);
        if(jobj instanceof Object) {
          param = jobj;
        }
      }
      catch(e) {
      }
      try {
        var jobj = JSON.parse(target.spatialParamArray);
        var isOk = true;
        if(jobj instanceof Array) {
          jobj.forEach((ele) => {
            if(!(ele instanceof Object)) {
              isOk = false;
            }
          });
        }
        else {
          isOk = false;
        }
        if(isOk) {
          spatialParamArray = jobj;
        }
      }
      catch(e) {
      }
      this.videoCodec = target;
      this.subType = "planar";
      this.uvStride = target.width / 2;
      this.h264Encoder = new ttg.encoder.Openh264Encoder(
        this.videoCodec.width,
        this.videoCodec.height,
        param,
        spatialParamArray);
    }
  }
  private X264(target) {
    if(!target) {
      if(ttg.encoder.X264Encoder.enabled) {
        this.videoCodecs.push({
          codec:"X264",
          name: "X264",
          width: 320,
          height: 240,
          preset: {type: "select", value: "veryfast", values: ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow", "placebo"]},
          tune: {type: "select", value: "zerolatency", values: ["film", "animation", "grain", "stillimage", "psnr", "ssim", "fastdecode", "zerolatency"]},
          profile: {type: "select", value: "baseline", values: ["baseline", "main", "high"]},
//          profile: {type: "text", value: "baseline", values: ["baseline", "main", "high", "high10", "high422", "high444"]},
          semiPlanar: false,
          params: {type: "textarea", value: "", values: ""}
        });
      }
    }
    else {
      var params = {};
      try {
        var jobj = JSON.parse(target.params);
        if(jobj instanceof Object) {
          params = jobj;
        }
      }
      catch(e) {
      }
      this.videoCodec = target;
      this.subType = "planar";
      this.uvStride = target.width / 2;
      this.h264Encoder = new ttg.encoder.X264Encoder(
        this.videoCodec.width,
        this.videoCodec.height,
        this.videoCodec.preset,
        this.videoCodec.tune,
        this.videoCodec.profile,
        params);
    }
  }
  /**
   * 他のプラグイン読み込み完了時にcallされるplugin設定動作
   * とりあえず他のプラグインとの連携はない
   * 全体のプラグインの読み込みが完了したあとにcallされるので初期化動作として使っておく
   * @param plugins
   */
  public setPlugins(plugins:{[key:string]:Array<IPlugin>}):void {
    this.codecList.forEach((codec) => {
      if(this[codec]) {
        this[codec](null);
      }
    });
    // 初期設定つくっておく必要がある。
    ipcMain.on(this.name + "init", (event:any, args: any) => {
      // 初期化したときの動作
      // encoderの情報を送っておく
      var publishInfo = null;
      try {
        publishInfo = JSON.parse(readFileSync("rtmp.json", "utf8"));
      }
      catch(e) {
      }
      event.sender.send(this.name + "init", [{
        audio: this.audioCodecs,
        video: this.videoCodecs
      },
      publishInfo]);
    });
    ipcMain.on(this.name + "publish", (event:any, args:any) => {
      // アドレスからrtmpの接続を作成して
      this._publish(args);
    });
    ipcMain.on(this.name + "yuv", (event:any, args:any) => {
      if(this.h264Encoder == null) {
        if(this.isPublishing) {
          this.isPublishing = false;
          event.sender.send(this.name + "close", {});
        }
        return;
      }
      if(args[0] instanceof Buffer) {
        this._yuv(args[0] as Buffer, args[1]);
      }
    });
    ipcMain.on(this.name + "pcm", (event:any, args:any) => {
      if(this.aacEncoder == null) {
        if(this.isPublishing) {
          this.isPublishing = false;
          event.sender.send(this.name + "close", {});
        }
        return;
      }
      if(args[0] instanceof Buffer) {
        this._pcm(args[0] as Buffer, args[1]);
      }
    });
    ipcMain.on(this.name + "stop", (event:any, args:any) => {
      this._stop();
    });
  }
  private _yuv(buffer:Buffer, pts:number) {
    var frame = ttg.Frame.fromBinaryBuffer(
      this.yuvFrame,
      buffer,
      {
        type: "yuv",
        id: 9,
        pts: pts,
        timebase: this.audioCodec.sampleRate,
        subType: this.subType,
        width: this.videoCodec.width,
        height: this.videoCodec.height,
        yStride: this.videoCodec.width,
        uStride: this.uvStride,
        vStride: this.uvStride
      }
    );
    if(frame != null) {
      this.yuvFrame = frame;
    }
    this.h264Encoder.encode(frame, (err, frame) => {
      frame.id = 9;
      this.ns.queueFrame(frame);
      return true;
    });
  }
  private _pcm(buffer:Buffer, pts:number) {
    var frame = ttg.Frame.fromBinaryBuffer(
      this.pcmFrame,
      buffer,
      {
        type: "pcmS16",
        id: 1,
        pts: pts,
        timebase: this.audioCodec.sampleRate,
        sampleRate:this.audioCodec.sampleRate,
        channelNum:this.audioCodec.channelNum,
        subType: "littleEndian"
      }
    );
    if(frame != null) {
      this.pcmFrame = frame;
    }
    this.aacEncoder.encode(frame, (err, frame) => {
      frame.id = 8;
      this.ns.queueFrame(frame);
      return true;
    });
  }
  private _publish(args:any) {
    writeFile("rtmp.json", JSON.stringify(args), () => {});
    this.nc = new ttg.rtmp.NetConnection();
    this.nc.on("onStatusEvent", (event:any) => {
      switch(event.info.code) {
      case "NetConnection.Connect.Success":
        // netStreamもつくっておく必要がある。
        this.ns = new ttg.rtmp.NetStream(this.nc);
        this.ns.on("onStatusEvent", (event) => {
          // 一応メモっておく
          if(event.info.code == "NetStream.Publish.Start") {
            this.isPublishing = true;
            this[args.audio.codec](args.audio);
            this[args.video.codec](args.video);
          }
        });
        this.ns.publish(args.streamName);
        break;
      case "NetConnection.Connect.Failed":
        // エラーが発生して切断した場合
        this.ns = null;
        this._stop();
        break;
      case "NetConnection.Connect.Closed":
        break;
      default:
        break;
      }
    });
    this.nc.connect(args.address);
  }
  private _stop() {
    if(this.ns != null) {
      this.ns.close(); // streamCloseを実施してから、netConnectionを落とす。そうすることで再度配信したときにNetStream.Publish.BadNameがでないようにする
      this.isPublishing = false;
      this.ns = null;
    }
    this.nc = null;
    this.aacEncoder = null;
    this.h264Encoder = null;
  }
}

export var _ = new Rtmp();

/*
{
"open-gop":1,
"threads":1,
"merange":16,
"qcomp":0.6,
"ip-factor": 0.71,
"bitrate":300,
"qp":21,
"crf":23,
"crf-max":23,
"fps":"30/1",
"keyint":150,
"keyint-min":150,
"bframes":3,
"vbv-maxrate":0,
"vbv-bufsize":1024,
"qp-max":40,
"qp-min": 21,
"qp-step": 4
}

なるほど・・・このやり方だと、encoderが生成される前にcallがくる可能性がちょっとだけ存在するのか・・・
あとエラー時に転送がきちんとクリアされるという保証もないため、データがかぶって壊れることもありうるわけか・・・

*/
