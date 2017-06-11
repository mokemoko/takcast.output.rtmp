"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var ttg = require("ttlibjsgyp2");
// データを保存するための動作
var fs_1 = require("fs");
var fs_2 = require("fs");
// とりあえずデータとして保存できるようにしておこう。
var Rtmp = (function () {
    /**
     * コンストラクタ
     */
    function Rtmp() {
        this.name = "rtmp";
        this.type = "output";
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
        // 1.codecListの配列に追加したいものを書いておく
        this.codecList = ["MacOS", "Windows", "Faac", "Openh264", "X264"];
    }
    // 2.追加した名前と同じ名称の関数を準備する
    Rtmp.prototype.MacOS = function (target) {
        // 3.targetの設定があるのは、実際にencoderを作るとき、ない場合は選択候補をつくるとき
        if (!target) {
            // 4.外部ライブラリで利用可能で確認して、利用できる場合はaudioCodecsかvideoCodecsにコーデック情報を記録しておく
            if (ttg.encoder.AudioConverterEncoder.enabled) {
                this.audioCodecs.push({
                    codec: "MacOS",
                    codecType: "audio",
                    name: "MacOS",
                    channelNum: 1,
                    sampleRate: 44100,
                    type: "aac",
                    bitrate: { type: "number", value: 96000, values: 96000 } // jsonになっているものは、ダイアログで選択可能になるもの
                });
            }
            if (ttg.encoder.VtCompressSessionEncoder.enabled) {
                this.videoCodecs.push({
                    codec: "MacOS",
                    codecType: "video",
                    name: "MacOS",
                    semiPlanar: false,
                    width: 320,
                    height: 240,
                    fps: 15,
                    bitrate: { type: "number", value: 600000, values: 600000 },
                    isbaseline: { type: "checkbox", value: 1, values: 1 } // チェックボックスでon offしtrue falseを設定する場合
                });
            }
        }
        else {
            // 実際にtargetの内容がある場合はその設定でencoderを作る必要があるときの動作
            switch (target.codecType) {
                case "audio":
                    // codec情報を登録するのは必須
                    this.audioCodec = target;
                    this.aacEncoder = new ttg.encoder.AudioConverterEncoder("aac", this.audioCodec.sampleRate, this.audioCodec.channelNum, parseInt(this.audioCodec.bitrate));
                    break;
                case "video":
                    // 映像側はcodec情報を設定するのと、入力に利用するyuvデータのsubType(planarかsemiPlanar)とuvStride値の設定が必要
                    this.videoCodec = target;
                    this.subType = "planar";
                    this.uvStride = target.width / 2;
                    // あとはencoderを作ればよい
                    this.h264Encoder = new ttg.encoder.VtCompressSessionEncoder("h264", this.videoCodec.width, this.videoCodec.height, this.videoCodec.fps, this.videoCodec.bitrate, this.videoCodec.isbaseline);
                    break;
                default:
                    break;
            }
        }
    };
    Rtmp.prototype.Windows = function (target) {
        var _this = this;
        if (!target) {
            if (ttg.encoder.MSAacEncoder.enabled) {
                ttg.MsSetup.CoInitialize("multithread");
                ttg.MsSetup.MFStartup();
                this.audioCodecs.push({
                    codec: "Windows",
                    codecType: "audio",
                    name: "Windows",
                    channelNum: 1,
                    sampleRate: 44100,
                    bitrate: { type: "number", value: 96000, values: 96000 }
                });
            }
            if (ttg.encoder.MSH264Encoder.enabled) {
                ttg.encoder.MSH264Encoder.listEncoders(function (err, encoder) {
                    _this.videoCodecs.push({
                        codec: "Windows",
                        codecType: "video",
                        name: encoder,
                        semiPlanar: true,
                        width: 320,
                        height: 240,
                        bitrate: { type: "number", value: 600000, values: 600000 }
                    });
                    return true;
                });
            }
        }
        else {
            switch (target.codecType) {
                case "audio":
                    this.audioCodec = target;
                    this.aacEncoder = new ttg.encoder.MSAacEncoder(this.audioCodec.sampleRate, this.audioCodec.channelNum, this.audioCodec.bitrate);
                    break;
                case "video":
                    this.videoCodec = target;
                    this.subType = "semiPlanar";
                    this.uvStride = target.width;
                    this.h264Encoder = new ttg.encoder.MSH264Encoder(this.videoCodec.name, this.videoCodec.width, this.videoCodec.height, this.videoCodec.bitrate);
                    break;
                default:
                    break;
            }
        }
    };
    Rtmp.prototype.Faac = function (target) {
        if (!target) {
            if (ttg.encoder.FaacEncoder.enabled) {
                this.audioCodecs.push({
                    codec: "Faac",
                    name: "Faac",
                    type: "low",
                    bitrate: { type: "number", value: 96000, values: 96000 },
                    sampleRate: 44100,
                    channelNum: 1
                });
            }
        }
        else {
            this.audioCodec = target;
            this.aacEncoder = new ttg.encoder.FaacEncoder(this.audioCodec.type, this.audioCodec.sampleRate, this.audioCodec.channelNum, this.audioCodec.bitrate);
        }
    };
    Rtmp.prototype.Openh264 = function (target) {
        if (!target) {
            if (ttg.encoder.Openh264Encoder.enabled) {
                this.videoCodecs.push({
                    codec: "Openh264",
                    name: "Openh264",
                    semiPlanar: false,
                    width: 320,
                    height: 240,
                    param: { type: "textarea", value: "", values: "" },
                    spatialParamArray: { type: "textarea", value: "", values: "" }
                });
            }
        }
        else {
            this.videoCodec = target;
            this.subType = "planar";
            this.uvStride = target.width / 2;
            this.h264Encoder = new ttg.encoder.Openh264Encoder(this.videoCodec.width, this.videoCodec.height, {}, [{}]);
        }
    };
    Rtmp.prototype.X264 = function (target) {
        if (!target) {
            if (ttg.encoder.X264Encoder.enabled) {
                this.videoCodecs.push({
                    codec: "X264",
                    name: "X264",
                    width: 320,
                    height: 240,
                    preset: { type: "select", value: "veryfast", values: ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow", "placebo"] },
                    tune: { type: "select", value: "zerolatency", values: ["film", "animation", "grain", "stillimage", "psnr", "ssim", "fastdecode", "zerolatency"] },
                    profile: { type: "select", value: "baseline", values: ["baseline", "main", "high"] },
                    //          profile: {type: "text", value: "baseline", values: ["baseline", "main", "high", "high10", "high422", "high444"]},
                    semiPlanar: false,
                    params: { type: "textarea", value: "", values: "" }
                });
            }
        }
        else {
            this.videoCodec = target;
            this.subType = "planar";
            this.uvStride = target.width / 2;
            this.h264Encoder = new ttg.encoder.X264Encoder(this.videoCodec.width, this.videoCodec.height, this.videoCodec.preset, this.videoCodec.tune, this.videoCodec.profile, {});
        }
    };
    /**
     * 他のプラグイン読み込み完了時にcallされるplugin設定動作
     * とりあえず他のプラグインとの連携はない
     * 全体のプラグインの読み込みが完了したあとにcallされるので初期化動作として使っておく
     * @param plugins
     */
    Rtmp.prototype.setPlugins = function (plugins) {
        var _this = this;
        this.codecList.forEach(function (codec) {
            if (_this[codec]) {
                _this[codec](null);
            }
        });
        // 初期設定つくっておく必要がある。
        electron_1.ipcMain.on(this.name + "init", function (event, args) {
            // 初期化したときの動作
            // encoderの情報を送っておく
            var publishInfo = null;
            try {
                publishInfo = JSON.parse(fs_2.readFileSync("rtmp.json", "utf8"));
            }
            catch (e) {
            }
            event.sender.send(_this.name + "init", [{
                    audio: _this.audioCodecs,
                    video: _this.videoCodecs
                },
                publishInfo]);
        });
        electron_1.ipcMain.on(this.name + "publish", function (event, args) {
            // アドレスからrtmpの接続を作成して
            _this._publish(args);
        });
        electron_1.ipcMain.on(this.name + "yuv", function (event, args) {
            if (_this.h264Encoder == null) {
                return;
            }
            if (args[0] instanceof Buffer) {
                _this._yuv(args[0], args[1]);
            }
        });
        electron_1.ipcMain.on(this.name + "pcm", function (event, args) {
            if (_this.aacEncoder == null) {
                return;
            }
            if (args[0] instanceof Buffer) {
                _this._pcm(args[0], args[1]);
            }
        });
        electron_1.ipcMain.on(this.name + "stop", function (event, args) {
            _this._stop();
        });
    };
    Rtmp.prototype._yuv = function (buffer, pts) {
        var _this = this;
        var frame = ttg.Frame.fromBinaryBuffer(this.yuvFrame, buffer, {
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
        });
        if (frame != null) {
            this.yuvFrame = frame;
        }
        this.h264Encoder.encode(frame, function (err, frame) {
            frame.id = 9;
            _this.ns.queueFrame(frame);
            return true;
        });
    };
    Rtmp.prototype._pcm = function (buffer, pts) {
        var _this = this;
        var frame = ttg.Frame.fromBinaryBuffer(this.pcmFrame, buffer, {
            type: "pcmS16",
            id: 1,
            pts: pts,
            timebase: this.audioCodec.sampleRate,
            sampleRate: this.audioCodec.sampleRate,
            channelNum: this.audioCodec.channelNum,
            subType: "littleEndian"
        });
        if (frame != null) {
            this.pcmFrame = frame;
        }
        this.aacEncoder.encode(frame, function (err, frame) {
            frame.id = 8;
            _this.ns.queueFrame(frame);
            return true;
        });
    };
    Rtmp.prototype._publish = function (args) {
        var _this = this;
        fs_1.writeFile("rtmp.json", JSON.stringify(args), function () { });
        this.nc = new ttg.rtmp.NetConnection();
        this.nc.on("onStatusEvent", function (event) {
            if (event.info.code == "NetConnection.Connect.Success") {
                // netStreamもつくっておく必要がある。
                _this.ns = new ttg.rtmp.NetStream(_this.nc);
                _this.ns.on("onStatusEvent", function (event) {
                    // 一応メモっておく
                    console.log(event.info.code);
                    if (event.info.code == "NetStream.Publish.Start") {
                        _this[args.audio.codec](args.audio);
                        _this[args.video.codec](args.video);
                    }
                });
                _this.ns.publish(args.streamName);
            }
        });
        this.nc.connect(args.address);
    };
    Rtmp.prototype._stop = function () {
        this.ns.close(); // streamCloseを実施してから、netConnectionを落とす。そうすることで再度配信したときにNetStream.Publish.BadNameがでないようにする
        this.ns = null;
        this.nc = null;
    };
    return Rtmp;
}());
exports.Rtmp = Rtmp;
exports._ = new Rtmp();
