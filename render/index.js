"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var tt = require("ttlibjs_next2");
var Rtmp = (function () {
    /**
     * コンストラクタ
     */
    function Rtmp() {
        this.name = "rtmp";
        this.type = "output";
        this.codecsInfo = null;
        this.activeMedia = null;
        this.targetMedia = null;
        this.codecsInfo = null;
        this.targetInfo = null;
        this.timerId = null;
        this.scriptNode = null;
        this.eventTarget = null;
    }
    Rtmp.prototype._setEventTarget = function (eventTarget) {
        this.eventTarget = eventTarget;
    };
    /**
     * プラグイン初期化
     */
    Rtmp.prototype.setPlugins = function (plugins) {
        var _this = this;
        // 基本pluginを保持
        this.basePlugin = plugins["base"][0];
        // node側に初期化を送って、codecの情報をもらう
        electron_1.ipcRenderer.on(this.name + "init", function (e, args) {
            _this.codecsInfo = args[0];
            _this.targetInfo = args[1];
            if (_this.targetInfo == null) {
                _this.targetInfo = {
                    address: "",
                    streamName: "",
                    audio: null,
                    video: null
                };
            }
            if (_this.eventTarget != null) {
                _this.eventTarget.onUpdate(_this.targetInfo);
            }
        });
        electron_1.ipcRenderer.on(this.name + "close", function () {
            // サーバーとの通信がなんらかの原因でおわったときのイベント
            if (_this.eventTarget != null) {
                _this.eventTarget.onStop(); // 停止したことを通知しておく
            }
            // このタイミングで停止を実施しなければならない。
        });
        electron_1.ipcRenderer.send(this.name + "init");
    };
    /**
     * 下部の設定コンポーネントを参照
     */
    Rtmp.prototype.refSettingComponent = function () {
        // コンポーネントはないため空で返しておく
        // TODO: IOutputPluginの定義自体の修正
        return null;
    };
    /**
     * node側からもらった利用可能なコーデック情報を参照する
     */
    Rtmp.prototype._refCodecsInfo = function () {
        return this.codecsInfo;
    };
    Rtmp.prototype._refTargetInfo = function () {
        return this.targetInfo;
    };
    /**
     * 配信設定をセットする
     * 設定ダイアログの結果を保存する
     * @param info
     */
    Rtmp.prototype._setInfo = function (info) {
        // 設定を受け取ったらfooterの部分のアドレス表示を更新しておきたいところ。
        // イベントを通知しないとね。
        this.targetInfo = info;
        this.eventTarget.onUpdate(info);
    };
    /**
     * 有効になっているmediaPluginが変更になったときの動作
     */
    Rtmp.prototype.onChangeActiveMedia = function (media) {
        if (this.targetMedia == media) {
            // 現在処理しているmediaがactiveになった場合は、設定がかわっている可能性がある。
            // その場合は切断しないと処理できなくなる。
        }
        this.activeMedia = media;
    };
    /**
     * mediaPluginが撤去されたときの動作
     * @param media
     */
    Rtmp.prototype.onRemoveMedia = function (media) {
        if (this.targetMedia == media) {
        }
    };
    /**
     * 配信実行
     */
    Rtmp.prototype._publish = function () {
        var _this = this;
        if (this.timerId != null) {
            // 既に配信中の場合は何もしない
            return false;
        }
        // 配信開始
        if (this.targetInfo == null) {
            alert("接続先設定がありません。");
            return false;
        }
        // 動作mediaを確定する
        if (this.targetInfo.audio == null || this.targetInfo.video == null) {
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
        electron_1.ipcRenderer.send(this.name + "publish", this.targetInfo);
        this.pts = 0; // ptsを初期化する
        // yuvイメージデータを取得する
        var array = new Uint8Array(canvas.width * canvas.height * 3 / 2);
        var draw = function () {
            capture.drain(canvas, array);
            electron_1.ipcRenderer.send(_this.name + "yuv", [array, _this.pts]);
        };
        this.timerId = setInterval(draw, 1000 / 15);
        // pcm音声データを取得する
        this.scriptNode = this.basePlugin.refAudioContext().createScriptProcessor(0, 1, 1);
        this.scriptNode.onaudioprocess = function (ev) {
            var ary = ev.inputBuffer.getChannelData(0);
            var length = ev.inputBuffer.length;
            var pcm = new Int16Array(length);
            for (var i = 0; i < length; ++i) {
                var val = ary[i] * 32700;
                if (val > 32700) {
                    val = 32700;
                }
                if (val < -32700) {
                    val = -32700;
                }
                pcm[i] = val;
            }
            electron_1.ipcRenderer.send(_this.name + "pcm", [new Uint8Array(pcm.buffer), _this.pts]);
            _this.pts += length;
        };
        this.scriptNode.connect(this.basePlugin.refDevnullNode());
        this.targetMedia.refNode().connect(this.scriptNode);
        return true;
    };
    Rtmp.prototype._stop = function () {
        // 配信停止
        if (this.scriptNode != null) {
            this.targetMedia.refNode().disconnect(this.scriptNode);
            this.scriptNode.disconnect();
            this.scriptNode = null;
        }
        if (this.timerId != null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        electron_1.ipcRenderer.send(this.name + "stop");
    };
    return Rtmp;
}());
exports.Rtmp = Rtmp;
exports._ = new Rtmp();
