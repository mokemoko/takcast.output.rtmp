import { IPlugin } from "takcast.interface";
export declare class Rtmp implements IPlugin {
    name: string;
    type: string;
    private audioCodecs;
    private videoCodecs;
    private codecList;
    private nc;
    private ns;
    private audioCodec;
    private videoCodec;
    private h264Encoder;
    private aacEncoder;
    private yuvFrame;
    private pcmFrame;
    private uvStride;
    private subType;
    /**
     * コンストラクタ
     */
    constructor();
    private MacOS(target);
    private Windows(target);
    private Faac(target);
    private Openh264(target);
    private X264(target);
    /**
     * 他のプラグイン読み込み完了時にcallされるplugin設定動作
     * とりあえず他のプラグインとの連携はない
     * 全体のプラグインの読み込みが完了したあとにcallされるので初期化動作として使っておく
     * @param plugins
     */
    setPlugins(plugins: {
        [key: string]: Array<IPlugin>;
    }): void;
    private _yuv(buffer, pts);
    private _pcm(buffer, pts);
    private _publish(args);
    private _stop();
}
export declare var _: Rtmp;
